import { exchangeCodeForToken, discoverWaba, discoverPhoneNumbers, validateOAuthState, subscribeAppToWaba } from '@/lib/whatsapp/oauth'
import { encrypt } from '@/lib/whatsapp/encryption'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const rawState = searchParams.get('state')

  if (!code || !rawState) {
    return NextResponse.redirect(new URL('/settings?tab=whatsapp&oauth=error&reason=missing_params', process.env.NEXT_PUBLIC_SITE_URL || 'https://growbychat.app'))
  }

  const state = validateOAuthState(rawState)
  if (!state) {
    return NextResponse.redirect(new URL('/settings?tab=whatsapp&oauth=error&reason=invalid_state', process.env.NEXT_PUBLIC_SITE_URL || 'https://growbychat.app'))
  }

  const { userId, nonce, frontendHost } = state

  const cookieNonce = request.cookies.get('oauth_nonce')?.value

  if (!cookieNonce) {
    console.error('[oauth/callback] No oauth_nonce cookie found. Cookies:', request.cookies.getAll().map(c => c.name).join(', '))
    return NextResponse.redirect(new URL('/settings?tab=whatsapp&oauth=error&reason=nonce_missing', frontendHost))
  }

  if (cookieNonce !== nonce) {
    console.error('[oauth/callback] Nonce mismatch')
    return NextResponse.redirect(new URL('/settings?tab=whatsapp&oauth=error&reason=nonce_mismatch', frontendHost))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    console.error('[oauth/callback] User identity mismatch')
    return NextResponse.redirect(new URL('/settings?tab=whatsapp&oauth=error&reason=auth_mismatch', frontendHost))
  }

  try {
    const frontendUrl = new URL(frontendHost)
    const protocol = frontendUrl.protocol.replace(':', '')
    const host = frontendUrl.host
    const redirectUri = `${protocol}://${host}/api/whatsapp/oauth/callback`

    const { longLivedToken } = await exchangeCodeForToken(code, redirectUri)

    const { wabaId, businessName } = await discoverWaba(longLivedToken)

    let phoneNumberId = ''
    let phoneNumber = ''
    let codeVerificationStatus = 'NOT_VERIFIED'
    let qualityRating = ''

    if (wabaId) {
      const phoneResult = await discoverPhoneNumbers(wabaId, longLivedToken)
      phoneNumberId = phoneResult.phoneNumberId
      phoneNumber = phoneResult.phoneNumber
      codeVerificationStatus = phoneResult.codeVerificationStatus
      qualityRating = phoneResult.qualityRating

      await subscribeAppToWaba(wabaId, longLivedToken).catch(err =>
        console.error('[oauth/callback] Webhook subscription failed:', err.message)
      )
    }

    const encryptedAccessToken = encrypt(longLivedToken)
    const verifyToken = crypto.randomBytes(24).toString('hex')
    const encryptedVerifyToken = encrypt(verifyToken)

    const adminClient = supabaseAdmin()

    const upsertData: Record<string, any> = {
      user_id: userId,
      waba_id: wabaId,
      access_token: encryptedAccessToken,
      verify_token: encryptedVerifyToken,
      status: 'connected',
      connected_at: new Date().toISOString(),
      coexistence_mode: codeVerificationStatus !== 'VERIFIED',
      coexistence_region: phoneNumber.startsWith('+91') ? 'india' : null,
      phone_number: phoneNumber,
      business_name: businessName,
      code_verification_status: codeVerificationStatus,
      quality_rating: qualityRating,
    }

    if (phoneNumberId) {
      upsertData.phone_number_id = phoneNumberId
    }

    const { error } = await adminClient
      .from('whatsapp_config')
      .upsert(upsertData, { onConflict: 'user_id' })

    if (error) {
      console.error('[oauth/callback] DB upsert failed:', error.message)
      return NextResponse.redirect(new URL(`/settings?tab=whatsapp&oauth=error&reason=db_error`, frontendHost))
    }

    const needsVerification = codeVerificationStatus !== 'VERIFIED' ? '&needs_verification=1' : ''
    const response = NextResponse.redirect(new URL(`/settings?tab=whatsapp&oauth=success${needsVerification}`, frontendHost))
    response.cookies.set('oauth_nonce', '', { maxAge: 0, path: '/', httpOnly: true, secure: true, sameSite: 'none' })
    return response
  } catch (err: any) {
    console.error('[oauth/callback] Error:', err.message)
    return NextResponse.redirect(new URL(`/settings?tab=whatsapp&oauth=error&reason=server_error`, frontendHost))
  }
}
