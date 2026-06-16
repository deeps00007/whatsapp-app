import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'

const META_API_VERSION = 'v21.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (configError || !config || !config.waba_id) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 })
    }

    const accessToken = decrypt(config.access_token)

    const subscribeRes = await fetch(`${META_API_BASE}/${config.waba_id}/subscribed_apps`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!subscribeRes.ok) {
      const err = await subscribeRes.json().catch(() => ({}))
      return NextResponse.json({ error: `App subscription failed: ${(err as any).error?.message || subscribeRes.statusText}` }, { status: 500 })
    }

    const fieldsRes = await fetch(
      `${META_API_BASE}/${config.waba_id}/subscribed_apps?subscribe_fields=${encodeURIComponent('messages,message_status')}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    const fieldsData = await fieldsRes.json().catch(() => ({}))
    const fieldsOk = fieldsRes.ok

    return NextResponse.json({
      success: true,
      app_subscribed: true,
      fields_subscribed: fieldsOk,
      fields_response: fieldsData,
    })
  } catch (err: any) {
    console.error('[webhook/subscribe] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
