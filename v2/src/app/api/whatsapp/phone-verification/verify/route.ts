import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import { verifyCode } from '@/lib/whatsapp/meta-api'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json()
    if (!code || !/^\d{4,8}$/.test(code)) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
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

    await verifyCode({
      phoneNumberId: config.phone_number_id,
      accessToken,
      code,
    })

    const { error: updateError } = await supabase
      .from('whatsapp_config')
      .update({ code_verification_status: 'VERIFIED' })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[phone-verification/verify] DB update error:', updateError.message)
    }

    return NextResponse.json({ success: true, verified: true })
  } catch (err: any) {
    console.error('[phone-verification/verify] Error:', err.message)
    const isWrongCode = err.message?.includes('Unable to verify') || err.message?.includes('Verify code failed')
    return NextResponse.json(
      {
        error: isWrongCode
          ? 'Invalid or expired verification code. Please request a new one.'
          : err.message || 'Failed to verify code',
        is_wrong_code: isWrongCode,
      },
      { status: isWrongCode ? 400 : 502 }
    )
  }
}
