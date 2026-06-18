import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import { requestVerificationCode } from '@/lib/whatsapp/meta-api'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { method } = await request.json()
    if (method !== 'SMS' && method !== 'VOICE') {
      return NextResponse.json({ error: 'Method must be SMS or VOICE' }, { status: 400 })
    }

    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('phone_number_id, access_token, status')
      .eq('user_id', user.id)
      .single()

    if (configError || !config || config.status !== 'connected') {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 })
    }

    if (!config.phone_number_id) {
      return NextResponse.json({ error: 'Phone number ID missing' }, { status: 400 })
    }

    const accessToken = decrypt(config.access_token)

    await requestVerificationCode({
      phoneNumberId: config.phone_number_id,
      accessToken,
      method,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[phone-verification/request] Error:', err.message)

    const isRateLimit =
      err.message?.includes('wait for 1 hour') ||
      err.message?.includes('2388091') ||
      err.message?.includes('temporarily unavailable')

    const isCoexistence =
      err.message?.includes('coexistence') ||
      err.message?.includes('registered on the app') ||
      err.message?.includes('linked to the app')

    if (isRateLimit) {
      return NextResponse.json(
        {
          error: 'Too many attempts. Please wait 1 hour before requesting another verification code.',
          is_rate_limited: true,
          cooldown_seconds: 3600,
        },
        { status: 429 }
      )
    }

    if (isCoexistence) {
      return NextResponse.json(
        {
          error: 'This number is linked to the WhatsApp Business app (coexistence mode). It must be verified through Meta Business Manager instead.',
          is_coexistence: true,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: err.message || 'Failed to request verification code' },
      { status: 502 }
    )
  }
}
