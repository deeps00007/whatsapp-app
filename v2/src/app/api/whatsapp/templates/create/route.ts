import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createMessageTemplate } from '@/lib/whatsapp/meta-api'
import { decrypt } from '@/lib/whatsapp/encryption'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, category, language, body_text, header_type, header_content, footer_text } = body

    if (!name || !category || !body_text) {
      return NextResponse.json({ error: 'name, category, and body_text are required' }, { status: 400 })
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

    const result = await createMessageTemplate({
      wabaId: config.waba_id,
      accessToken,
      name: name.trim(),
      category,
      language: language || 'en_US',
      bodyText: body_text.trim(),
      headerType: header_type || null,
      headerContent: header_content || null,
      footerText: footer_text?.trim() || null,
    })

    const normalizedStatus = result.status === 'APPROVED' ? 'Approved'
      : result.status === 'REJECTED' ? 'Rejected'
      : result.status === 'PENDING' || result.status === 'IN_APPEAL' ? 'Pending'
      : 'Pending'

    const { error: dbError } = await supabase
      .from('message_templates')
      .upsert({
        user_id: user.id,
        name: name.trim(),
        category,
        language: language || 'en_US',
        body_text: body_text.trim(),
        header_type: (header_type && header_type !== 'none') ? header_type : null,
        header_content: header_content?.trim() || null,
        footer_text: footer_text?.trim() || null,
        status: normalizedStatus,
        meta_template_id: result.id,
      }, { onConflict: 'user_id,name' })

    if (dbError) {
      console.error('[templates/create] DB upsert failed:', dbError.message)
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      status: normalizedStatus,
    })
  } catch (err: any) {
    console.error('[templates/create] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
