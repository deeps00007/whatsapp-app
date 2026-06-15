const META_API_VERSION = 'v21.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`
const DIALOG_BASE = 'https://www.facebook.com/v21.0/dialog/oauth'

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

export function buildOAuthUrl(args: BuildOAuthUrlArgs): string {
  const { userId, frontendHost, redirectUri } = args
  const { clientId, configId } = getOAuthEnv()

  const nonce = crypto.randomUUID()
  const state = Buffer.from(
    JSON.stringify({ user_id: userId, nonce, frontend_host: frontendHost })
  ).toString('base64url')

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
    auth_type: 'rerequest',
    extras,
  })

  return `${DIALOG_BASE}?${params.toString()}`
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

  const shortUrl =
    `${META_API_BASE}/oauth/access_token` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&client_secret=${encodeURIComponent(clientSecret)}` +
    `&code=${encodeURIComponent(code)}`

  const shortRes = await fetch(shortUrl)
  if (!shortRes.ok) {
    const err = await shortRes.json().catch(() => ({}))
    throw new Error(
      `Token exchange failed: ${(err as any).error?.message || shortRes.statusText}`
    )
  }
  const shortData = await shortRes.json()
  const shortLivedToken = (shortData as any).access_token as string
  if (!shortLivedToken) throw new Error('Meta returned empty access token')

  const longUrl =
    `${META_API_BASE}/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&client_secret=${encodeURIComponent(clientSecret)}` +
    `&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`

  const longRes = await fetch(longUrl)
  let longLivedToken = shortLivedToken
  let expiresInSeconds = 5184000

  if (longRes.ok) {
    const longData = await longRes.json()
    if ((longData as any).access_token) {
      longLivedToken = (longData as any).access_token
      expiresInSeconds = (longData as any).expires_in ?? 5184000
    }
  }

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
    `${META_API_BASE}/debug_token` +
    `?input_token=${encodeURIComponent(longLivedToken)}` +
    `&access_token=${encodeURIComponent(appToken)}`

  const debugRes = await fetch(debugUrl)
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

  const wabaUrl =
    `${META_API_BASE}/me/whatsapp_business_accounts` +
    `?access_token=${encodeURIComponent(longLivedToken)}`

  const wabaRes = await fetch(wabaUrl)
  if (wabaRes.ok) {
    const wabaData = await wabaRes.json()
    const entries = (wabaData as any)?.data ?? []
    if (!wabaId && entries[0]?.id) {
      wabaId = entries[0].id
    }
    if (entries[0]?.name) {
      businessName = entries[0].name
    }
  }

  return { wabaId, businessName }
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
  const url =
    `${META_API_BASE}/${wabaId}/phone_numbers` +
    `?access_token=${encodeURIComponent(longLivedToken)}`

  const res = await fetch(url)
  if (!res.ok) return { phoneNumberId: '', phoneNumber: '', codeVerificationStatus: 'NOT_VERIFIED', qualityRating: '' }

  const data = await res.json()
  const phoneList: any[] = (data as any)?.data ?? []

  let bestPhone: any = null
  let bestScore = -1

  for (const entry of phoneList) {
    const num = entry.display_phone_number ?? ''
    const status = entry.code_verification_status ?? ''
    const quality = entry.quality_rating ?? ''

    if (num.includes('555')) continue

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
    const decoded = JSON.parse(Buffer.from(rawState, 'base64url').toString())
    if (!decoded.user_id) return null
    return {
      userId: decoded.user_id,
      nonce: decoded.nonce,
      frontendHost: decoded.frontend_host ?? 'https://growbychat.app',
    }
  } catch {
    return null
  }
}
