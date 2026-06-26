import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTextMessage, sendTemplateMessage } from '@/lib/whatsapp/meta-api'
import { decrypt } from '@/lib/whatsapp/encryption'
import { sanitizePhoneForMeta, isValidE164 } from '@/lib/whatsapp/phone-utils'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { extractVariables } from '@/lib/whatsapp/template-variables'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = checkRateLimit(`start-conversation:${user.id}`, RATE_LIMITS.send)
    if (!limit.success) return rateLimitResponse(limit)

    const body = await request.json()
    const { phone, name, message_text, template_name, template_language, template_params } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    if (!message_text && !template_name) {
      return NextResponse.json({ error: 'Either message_text or template_name is required' }, { status: 400 })
    }

    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('id, phone_number_id, waba_id, access_token, status')
      .eq('user_id', user.id)
      .single()

    if (configError || !config || !config.phone_number_id) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 })
    }

    const sanitizedPhone = sanitizePhoneForMeta(phone)
    if (!isValidE164(sanitizedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    let contactId: string
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .eq('phone', sanitizedPhone)
      .maybeSingle()

    if (existingContact) {
      contactId = existingContact.id
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          phone: sanitizedPhone,
          name: name?.trim() || null,
        })
        .select('id')
        .single()

      if (contactError || !newContact) {
        return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
      }
      contactId = newContact.id
    }

    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('contact_id', contactId)
      .maybeSingle()

    let conversationId: string
    if (existingConv) {
      conversationId = existingConv.id
    } else {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          status: 'open',
        })
        .select('id')
        .single()

      if (convError || !newConv) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }
      conversationId = newConv.id
    }

    const accessToken = decrypt(config.access_token)

    let templateHeaderType: string | null = null
    let templateHeaderUrl: string | null = null
    let templateParamNames: string[] = []
    let resolvedTemplateLanguage = template_language
    if (template_name) {
      const { data: tpl } = await supabase
        .from('message_templates')
        .select('header_type, header_content, body_text, language')
        .eq('user_id', user.id)
        .eq('name', template_name)
        .maybeSingle()
      templateHeaderType = tpl?.header_type ?? null
      templateHeaderUrl = tpl?.header_content ?? null
      if (tpl?.body_text) {
        templateParamNames = extractVariables(tpl.body_text)
          .filter(v => v.isNamed)
          .map(v => v.name)
      }
      if (!resolvedTemplateLanguage && tpl?.language) {
        resolvedTemplateLanguage = tpl.language
      }
    }

    let waMessageId = ''
    let contentText = ''

    if (template_name) {
      const result = await sendTemplateMessage({
        phoneNumberId: config.phone_number_id,
        accessToken,
        to: sanitizedPhone,
        templateName: template_name,
        language: resolvedTemplateLanguage || 'en_US',
        params: template_params || [],
        paramNames: templateParamNames.length > 0 ? templateParamNames : undefined,
        headerType: templateHeaderType,
        headerMediaUrl: templateHeaderUrl,
      })
      waMessageId = result.messageId
      contentText = `[template: ${template_name}]`
    } else {
      const result = await sendTextMessage({
        phoneNumberId: config.phone_number_id,
        accessToken,
        to: sanitizedPhone,
        text: message_text,
      })
      waMessageId = result.messageId
      contentText = message_text
    }

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'agent',
      content_type: template_name ? 'template' : 'text',
      content_text: contentText,
      template_name: template_name || null,
      message_id: waMessageId,
      status: 'sent',
    })

    await supabase
      .from('conversations')
      .update({
        last_message_text: contentText,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    return NextResponse.json({
      success: true,
      conversation_id: conversationId,
      contact_id: contactId,
      whatsapp_message_id: waMessageId,
    })
  } catch (err: any) {
    console.error('[start-conversation] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
