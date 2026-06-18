import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'

const META_API_VERSION = 'v21.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

function normalizeStatus(meta: string): 'Draft' | 'Pending' | 'Approved' | 'Rejected' {
  switch (meta.toUpperCase()) {
    case 'APPROVED': return 'Approved'
    case 'PENDING':
    case 'IN_APPEAL':
    case 'PENDING_DELETION': return 'Pending'
    case 'REJECTED':
    case 'DISABLED':
    case 'PAUSED': return 'Rejected'
    default: return 'Draft'
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { template_id } = await request.json()
    if (!template_id) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 })
    }

    const { data: template, error: tplError } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', template_id)
      .eq('user_id', user.id)
      .single()

    if (tplError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (!template.meta_template_id) {
      const { data: config } = await supabase
        .from('whatsapp_config')
        .select('waba_id, access_token')
        .eq('user_id', user.id)
        .single()

      if (!config?.waba_id) {
        return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 })
      }

      const accessToken = decrypt(config.access_token)
      const metaRes = await fetch(
        `${META_API_BASE}/${config.waba_id}/message_templates?name=${encodeURIComponent(template.name)}&fields=id,name,status,category,language`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (!metaRes.ok) {
        const err = await metaRes.json().catch(() => ({}))
        return NextResponse.json({ error: `Meta API error: ${(err as any).error?.message || metaRes.statusText}` }, { status: 502 })
      }

      const metaBody = await metaRes.json()
      const metaTemplate = (metaBody.data ?? []).find(
        (t: any) => t.name === template.name && t.language === template.language
      )

      if (!metaTemplate) {
        return NextResponse.json({ status: template.status, message: 'Template not found on Meta' })
      }

      const newStatus = normalizeStatus(metaTemplate.status)

      await supabase
        .from('message_templates')
        .update({
          status: newStatus,
          meta_template_id: metaTemplate.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id)

      return NextResponse.json({ status: newStatus, meta_template_id: metaTemplate.id })
    }

    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('access_token')
      .eq('user_id', user.id)
      .single()

    if (!config) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 })
    }

    const accessToken = decrypt(config.access_token)
    const metaRes = await fetch(
      `${META_API_BASE}/${template.meta_template_id}?fields=status,category`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!metaRes.ok) {
      const err = await metaRes.json().catch(() => ({}))
      return NextResponse.json({ error: `Meta API error: ${(err as any).error?.message || metaRes.statusText}` }, { status: 502 })
    }

    const metaBody = await metaRes.json()
    const newStatus = normalizeStatus(metaBody.status || '')

    if (newStatus !== template.status) {
      await supabase
        .from('message_templates')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id)
    }

    return NextResponse.json({ status: newStatus })
  } catch (err: any) {
    console.error('[templates/check-status] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
