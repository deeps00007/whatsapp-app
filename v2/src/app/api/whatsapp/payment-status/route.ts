import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'

const META_API_VERSION = 'v21.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('waba_id, access_token, phone_number_id, payment_method_connected, code_verification_status, status')
      .eq('user_id', user.id)
      .single()

    if (configError || !config) {
      return NextResponse.json({
        connected: false,
        payment_method_connected: false,
        phone_verified: false,
        whatsapp_status: 'disconnected',
      })
    }

    if (config.status !== 'connected' || !config.waba_id) {
      return NextResponse.json({
        connected: config.status === 'connected',
        payment_method_connected: false,
        phone_verified: false,
        whatsapp_status: config.status,
      })
    }

    const accessToken = decrypt(config.access_token)

    let paymentConnected = config.payment_method_connected
    let accountReviewStatus: string | null = null
    let phoneVerified = config.code_verification_status === 'VERIFIED'

    try {
      if (config.phone_number_id) {
        const phoneRes = await fetch(
          `${META_API_BASE}/${config.phone_number_id}?fields=code_verification_status`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        if (phoneRes.ok) {
          const phoneData = await phoneRes.json()
          const metaStatus = phoneData.code_verification_status
          phoneVerified = metaStatus === 'VERIFIED'
          if (metaStatus && metaStatus !== config.code_verification_status) {
            void supabase
              .from('whatsapp_config')
              .update({ code_verification_status: metaStatus })
              .eq('user_id', user.id)
          }
        }
      }
    } catch {
      // phone status check failed — keep cached value
    }

    try {
      const wabaRes = await fetch(
        `${META_API_BASE}/${config.waba_id}?fields=account_review_status,ownership_info{owner_business_id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (wabaRes.ok) {
        const wabaData = await wabaRes.json()
        accountReviewStatus = wabaData.account_review_status || null
        const businessId = wabaData.ownership_info?.owner_business_id

        if (businessId) {
          try {
            const payRes = await fetch(
              `${META_API_BASE}/${businessId}/payment_methods?fields=id,method_type`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            )
            if (payRes.ok) {
              const payData = await payRes.json()
              const methods = payData.data ?? []
              paymentConnected = methods.length > 0
            }
          } catch {
            // payment_methods endpoint may not be accessible — keep existing value
          }
        }
      }
    } catch {
      // Meta API unreachable — return cached value
    }

    if (paymentConnected !== config.payment_method_connected) {
      await supabase
        .from('whatsapp_config')
        .update({ payment_method_connected: paymentConnected })
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      connected: true,
      payment_method_connected: paymentConnected,
      phone_verified: phoneVerified,
      whatsapp_status: config.status,
      account_review_status: accountReviewStatus,
    })
  } catch (err: any) {
    console.error('[payment-status] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('whatsapp_config')
      .update({ payment_method_connected: true })
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, payment_method_connected: true })
  } catch (err: any) {
    console.error('[payment-status confirm] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
