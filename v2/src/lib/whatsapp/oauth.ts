import { createHmac, timingSafeEqual } from 'node:crypto'

const META_API_VERSION = 'v21.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`
const DIALOG_BASE = 'https://www.facebook.com/v21.0/dialog/oauth'

const ALLOWED_FRONTEND_HOSTS = [
  'https://growbychat.app',
  process.env.NEXT_PUBLIC_SITE_URL,
].filter(Boolean) as string[]

function safeFrontendHost(host: string | undefined): string {
  if (host && ALLOWED_FRONTEND_HOSTS.includes(host)) return host
  return ALLOWED_FRONTEND_HOSTS[0] || 'https://growbychat.app'
}

export function getOAuthEnv() {
  const clientId = process.env.FACEBOOK_CLIENT_ID!
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET!
  const configId = process.env.FACEBOOK_CONFIG_ID!
  return { clientId, clientSecret, configId }
}

export interface BuildOAuthUrlArgs {
  userId: string
  frontendHost: string
  redirectUri: string
}

export function buildOAuthUrl(args: BuildOAuthUrlArgs): { oauthUrl: string; nonce: string } {
  const { userId, frontendHost, redirectUri } = args
  const { clientId, clientSecret, configId } = getOAuthEnv()

  const nonce = crypto.randomUUID()
  const payload = Buffer.from(
    JSON.stringify({ user_id: userId, nonce, frontend_host: frontendHost })
  ).toString('base64url')
  const stateSecret = process.env.STATE_SIGNING_KEY || clientSecret
  const sig = createHmac('sha256', stateSecret)
    .update(payload)
    .digest('hex')
  const state = `${payload}.${sig}`

  const extras = JSON.stringify({
    version: 'v3',
    sessionInfoVersion: '3',
    featureType: 'whatsapp_business_app_onboarding',
    setup: {},
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    config_id: configId,
    response_type: 'code',
    override_default_response_type: 'true',
    scope: 'whatsapp_business_management,whatsapp_business_messaging',
    extras,
  })

  return { oauthUrl: `${DIALOG_BASE}?${params.toString()}`, nonce }
}

export interface TokenExchangeResult {
  longLivedToken: string
  expiresInSeconds: number
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<TokenExchangeResult> {
  const { clientId, clientSecret } = getOAuthEnv()

  const shortParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    client_secret: clientSecret,
    code,
  })

  const shortRes = await fetch(`${META_API_BASE}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: shortParams.toString(),
  })

  if (!shortRes.ok) {
    const err = await shortRes.json().catch(() => ({}))
    throw new Error(
      `Token exchange failed: ${(err as any).error?.message || shortRes.statusText}`
    )
  }
  const shortData = await shortRes.json()
  const shortLivedToken = (shortData as any).access_token as string
  if (!shortLivedToken) throw new Error('Meta returned empty access token')

  const longParams = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: shortLivedToken,
  })

  const longRes = await fetch(`${META_API_BASE}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: longParams.toString(),
  })

  if (!longRes.ok) {
    throw new Error('Long-lived token exchange failed — session will expire in ~1 hour. Please reconnect.')
  }

  const longData = await longRes.json()
  const longLivedToken = (longData as any).access_token as string
  if (!longLivedToken) throw new Error('Meta returned empty long-lived access token')

  const expiresInSeconds = (longData as any).expires_in ?? 5184000

  return { longLivedToken, expiresInSeconds }
}

export interface WabaDiscoveryResult {
  wabaId: string
  businessName: string
}

export async function discoverWaba(
  longLivedToken: string
): Promise<WabaDiscoveryResult> {
  const { clientId, clientSecret } = getOAuthEnv()
  const appToken = `${clientId}|${clientSecret}`

  let wabaId = ''
  let businessName = ''

  const debugUrl =
    `${META_API_BASE}/debug_token?input_token=${encodeURIComponent(longLivedToken)}`

  const debugRes = await fetch(debugUrl, {
    headers: { Authorization: `Bearer ${appToken}` },
  })
  if (debugRes.ok) {
    const debugData = await debugRes.json()
    const granules = (debugData as any)?.data?.granular_scopes ?? []
    for (const g of granules) {
      if (g.scope === 'whatsapp_business_management') {
        const targets: string[] = g.target_ids ?? []
        if (targets[0]) {
          wabaId = targets[0]
          break
        }
      }
    }
  }

  const wabaUrl = `${META_API_BASE}/me/whatsapp_business_accounts`

  const wabaRes = await fetch(wabaUrl, {
    headers: { Authorization: `Bearer ${longLivedToken}` },
  })
  if (wabaRes.ok) {
    const wabaData = await wabaRes.json()
    const entries = (wabaData as any)?.data ?? []
    if (!wabaId && entries[0]?.id) {
      wabaId = entries[0].id
    }
  }

  if (wabaId) {
    const detailUrl = `${META_API_BASE}/${wabaId}?fields=name`
    const detailRes = await fetch(detailUrl, {
      headers: { Authorization: `Bearer ${longLivedToken}` },
    })
    if (detailRes.ok) {
      const detailData = await detailRes.json()
      businessName = (detailData as any)?.name ?? ''
    }
  }

  return { wabaId, businessName }
}

export async function subscribeAppToWaba(
  wabaId: string,
  longLivedToken: string
): Promise<void> {
  const url = `${META_API_BASE}/${wabaId}/subscribed_apps`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${longLivedToken}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Webhook subscription failed: ${(err as any).error?.message || res.statusText}`)
  }

  const fieldsUrl = `${META_API_BASE}/${wabaId}/subscribed_apps?subscribe_fields=${encodeURIComponent('messages,message_status')}`
  const fieldsRes = await fetch(fieldsUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${longLivedToken}` },
  })
  if (!fieldsRes.ok) {
    const err = await fieldsRes.json().catch(() => ({}))
    console.error('[subscribeAppToWaba] Field subscription warning:', (err as any).error?.message || fieldsRes.statusText)
  }
}

export interface PhoneDiscoveryResult {
  phoneNumberId: string
  phoneNumber: string
  codeVerificationStatus: string
  qualityRating: string
}

export async function discoverPhoneNumbers(
  wabaId: string,
  longLivedToken: string
): Promise<PhoneDiscoveryResult> {
  const url = `${META_API_BASE}/${wabaId}/phone_numbers`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${longLivedToken}` },
  })
  if (!res.ok) return { phoneNumberId: '', phoneNumber: '', codeVerificationStatus: 'NOT_VERIFIED', qualityRating: '' }

  const data = await res.json()
  const phoneList: any[] = (data as any)?.data ?? []

  let bestPhone: any = null
  let bestScore = -1

  for (const entry of phoneList) {
    const num = entry.display_phone_number ?? ''
    const status = entry.code_verification_status ?? ''
    const quality = entry.quality_rating ?? ''

    if (/^\+?1?5550\d{2}$/.test(num.replace(/[\s\-()]/g, ''))) continue

    let score = 0
    if (status === 'VERIFIED') score += 3
    if (quality) score += 2
    if (entry.id && num) score += 1

    if (score > bestScore && entry.id && num) {
      bestScore = score
      bestPhone = entry
    }
  }

  if (!bestPhone) {
    for (const entry of phoneList) {
      if (entry.id) { bestPhone = entry; break }
    }
  }

  if (!bestPhone) return { phoneNumberId: '', phoneNumber: '', codeVerificationStatus: 'NOT_VERIFIED', qualityRating: '' }

  return {
    phoneNumberId: bestPhone.id,
    phoneNumber: bestPhone.display_phone_number ?? bestPhone.verified_name ?? '',
    codeVerificationStatus: bestPhone.code_verification_status ?? 'NOT_VERIFIED',
    qualityRating: bestPhone.quality_rating ?? '',
  }
}

export function validateOAuthState(
  rawState: string
): { userId: string; nonce: string; frontendHost: string } | null {
  try {
    const [payload, sig] = rawState.split('.')
    if (!payload || !sig) return null

    const { clientSecret } = getOAuthEnv()
    const stateSecret = process.env.STATE_SIGNING_KEY || clientSecret
    const expectedSig = createHmac('sha256', stateSecret)
      .update(payload)
      .digest('hex')

    if (
      sig.length !== expectedSig.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
    ) {
      return null
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!decoded.user_id || !decoded.nonce) return null
    return {
      userId: decoded.user_id,
      nonce: decoded.nonce,
      frontendHost: safeFrontendHost(decoded.frontend_host),
    }
  } catch (_) {
    return null
  }
}
