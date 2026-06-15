import { exchangeCodeForToken, discoverWaba, discoverPhoneNumbers, validateOAuthState } from '@/lib/whatsapp/oauth'
import { encrypt } from '@/lib/whatsapp/encryption'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: Request) {
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

  const { userId, frontendHost } = state

  try {
    const frontendUrl = new URL(frontendHost)
    const protocol = 'https'
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
    }

    const encryptedAccessToken = encrypt(longLivedToken)
    const verifyToken = crypto.randomBytes(24).toString('hex')
    const encryptedVerifyToken = encrypt(verifyToken)

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await adminClient
      .from('whatsapp_config')
      .upsert({
        user_id: userId,
        phone_number_id: phoneNumberId || 'pending',
        waba_id: wabaId,
        access_token: encryptedAccessToken,
        verify_token: encryptedVerifyToken,
        status: 'connected',
        connected_at: new Date().toISOString(),
        coexistence_mode: true,
        coexistence_region: 'india',
        phone_number: phoneNumber,
        business_name: businessName,
        code_verification_status: codeVerificationStatus,
        quality_rating: qualityRating,
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('[oauth/callback] DB upsert failed:', error.message)
      return NextResponse.redirect(new URL(`/settings?tab=whatsapp&oauth=error&reason=db_error`, frontendHost))
    }

    const needsVerification = codeVerificationStatus !== 'VERIFIED' ? '&needs_verification=1' : ''
    return NextResponse.redirect(new URL(`/settings?tab=whatsapp&oauth=success${needsVerification}`, frontendHost))
  } catch (err: any) {
    console.error('[oauth/callback] Error:', err.message)
    return NextResponse.redirect(new URL(`/settings?tab=whatsapp&oauth=error&reason=${encodeURIComponent(err.message)}`, frontendHost))
  }
}
