import { createSign } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase/admin-client'

let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get OAuth2 access token for FCM HTTP v1 API using service account JWT.
 * Caches the token until 5 minutes before expiry.
 */
async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300_000) {
    return cachedToken.token
  }

  const clientEmail = process.env.FCM_CLIENT_EMAIL
  const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const projectId = process.env.FCM_PROJECT_ID

  if (!clientEmail || !privateKey || !projectId) {
    console.warn('[FCM] Missing FCM env vars (FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY, FCM_PROJECT_ID)')
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  const jwtHeader = { alg: 'RS256', typ: 'JWT' }
  const jwtPayload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encodedHeader = Buffer.from(JSON.stringify(jwtHeader)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url')
  const signInput = `${encodedHeader}.${encodedPayload}`

  const sign = createSign('RSA-SHA256')
  sign.update(signInput)
  const signature = sign.sign(privateKey).toString('base64url')

  const jwt = `${encodedHeader}.${encodedPayload}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[FCM] OAuth2 token exchange failed:', res.status, text)
    return null
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return data.access_token
}

/**
 * Send FCM push notification to all active admin devices via HTTP v1 API.
 */
export async function sendAdminPushNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const admin = supabaseAdmin()

  const { data: tokens } = await admin
    .from('admin_device_tokens')
    .select('token, agent_name')
    .eq('is_active', true)

  if (!tokens || tokens.length === 0) {
    return
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    return
  }

  const projectId = process.env.FCM_PROJECT_ID
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

  for (const t of tokens) {
    const message = {
      message: {
        token: t.token,
        notification: { title, body },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            channel_id: 'support_messages',
            priority: 'high',
            default_sound: true,
            default_vibrate_timings: true,
          },
        },
      },
    }

    try {
      const res = await fetch(fcmUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })

      if (!res.ok) {
        const text = await res.text()
        console.error('[FCM] Push failed for token', t.token.slice(0, 20) + '...', res.status, text)

        if (res.status === 404 || res.status === 400) {
          await admin
            .from('admin_device_tokens')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('token', t.token)
        }
      }
    } catch (err) {
      console.error('[FCM] Push error for token', t.token.slice(0, 20) + '...', err)
    }
  }
}
