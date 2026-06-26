import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTemplateMessage } from '@/lib/whatsapp/meta-api'
import { decrypt } from '@/lib/whatsapp/encryption'
import {
  sanitizePhoneForMeta,
  isValidE164,
  phoneVariants,
  isRecipientNotAllowedError,
} from '@/lib/whatsapp/phone-utils'
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit'
import { extractVariables } from '@/lib/whatsapp/template-variables'
import { supabaseAdmin } from '@/lib/supabase/admin-client'

interface BroadcastResult {
  phone: string
  status: 'sent' | 'failed'
  whatsapp_message_id?: string
  error?: string
}

/**
 * Two input shapes are accepted:
 *
 *   NEW (preferred — supports per-recipient variable substitution):
 *     {
 *       recipients: Array<{ phone: string; params: string[] }>,
 *       template_name, template_language
 *     }
 *
 *   LEGACY (all phones receive the same params — kept so existing
 *   callers don't break):
 *     {
 *       phone_numbers: string[],
 *       template_params: string[],
 *       template_name, template_language
 *     }
 *
 * Previous implementation only supported the legacy shape, and the
 * sending hook was forced to ship every batch with `templateParams[0]`
 * — meaning every recipient got contact-0's personalization. The new
 * shape is what actually fixes that.
 */
interface NewRecipient {
  phone: string
  params?: string[]
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Per-user broadcast budget. Note: this limits how often a user
    // can *start* a campaign, not how many messages go out inside
    // one — the fan-out loop below runs without additional gating.
    const limit = checkRateLimit(`broadcast:${user.id}`, RATE_LIMITS.broadcast)
    if (!limit.success) {
      return rateLimitResponse(limit)
    }

    const body = await request.json()
    const {
      recipients: newRecipients,
      phone_numbers,
      template_name,
      template_language,
      template_params,
    } = body

    // Normalize to a list of {phone, params} regardless of shape.
    let recipients: NewRecipient[]
    if (Array.isArray(newRecipients) && newRecipients.length > 0) {
      recipients = newRecipients
    } else if (Array.isArray(phone_numbers) && phone_numbers.length > 0) {
      const shared: string[] = Array.isArray(template_params)
        ? template_params
        : []
      recipients = phone_numbers.map((phone: string) => ({
        phone,
        params: shared,
      }))
    } else {
      return NextResponse.json(
        { error: 'No recipients provided' },
        { status: 400 },
      )
    }

    const MAX_BROADCAST_RECIPIENTS = 1000
    if (recipients.length > MAX_BROADCAST_RECIPIENTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BROADCAST_RECIPIENTS} recipients per broadcast` },
        { status: 400 },
      )
    }

    if (!template_name) {
      return NextResponse.json(
        { error: 'template_name is required' },
        { status: 400 }
      )
    }

    const { data: templateCheck } = await supabase
      .from('message_templates')
      .select('status, header_type, header_content, body_text, language')
      .eq('user_id', user.id)
      .eq('name', template_name)
      .maybeSingle()

    if (!templateCheck || templateCheck.status !== 'Approved') {
      return NextResponse.json(
        { error: `Template "${template_name}" is not approved. Only approved templates can be used for broadcasts.` },
        { status: 400 }
      )
    }

    const resolvedTemplateLanguage = template_language || templateCheck.language || 'en_US'

    const templateParamNames = templateCheck.body_text
      ? extractVariables(templateCheck.body_text)
          .filter(v => v.isNamed)
          .map(v => v.name)
      : []

    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('id, phone_number_id, waba_id, access_token, status')
      .eq('user_id', user.id)
      .single()

    if (configError || !config) {
      return NextResponse.json(
        { error: 'WhatsApp not configured. Please set up your WhatsApp integration first.' },
        { status: 400 }
      )
    }

    const accessToken = decrypt(config.access_token)

    const db = supabaseAdmin()

    const phoneToContactId = new Map<string, string>()
    if (recipients.length > 0) {
      const phones = recipients.map(r => sanitizePhoneForMeta(r.phone)).filter(p => isValidE164(p))
      if (phones.length > 0) {
        const { data: contacts } = await db
          .from('contacts')
          .select('id, phone')
          .eq('user_id', user.id)
          .in('phone', phones)
        for (const c of contacts ?? []) {
          phoneToContactId.set(c.phone, c.id)
        }
      }
    }

    const results: BroadcastResult[] = []
    let sentCount = 0
    let failedCount = 0

    for (const recipient of recipients) {
      const sanitized = sanitizePhoneForMeta(recipient.phone)

      if (!isValidE164(sanitized)) {
        results.push({
          phone: recipient.phone,
          status: 'failed',
          error: 'Invalid phone number format',
        })
        failedCount++
        continue
      }

      // Retry with phone variants on "not in allowed list" so numbers
      // that differ only in a trunk-prefix 0 still reach recipients.
      const variants = phoneVariants(sanitized)
      let sentMessageId: string | null = null
      let lastError: string | null = null

      for (const variant of variants) {
        try {
          const result = await sendTemplateMessage({
            phoneNumberId: config.phone_number_id,
            accessToken,
            to: variant,
            templateName: template_name,
            language: resolvedTemplateLanguage,
            params: recipient.params ?? [],
            paramNames: templateParamNames.length > 0 ? templateParamNames : undefined,
            headerType: templateCheck.header_type,
            headerMediaUrl: templateCheck.header_content,
          })
          sentMessageId = result.messageId
          lastError = null
          break
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          if (!isRecipientNotAllowedError(errorMessage)) {
            lastError = errorMessage
            break
          }
          lastError = errorMessage
          // retry with next variant
        }
      }

      if (sentMessageId) {
        const contactId = phoneToContactId.get(sanitized)
        if (contactId) {
          try {
            let conversationId: string | null = null
            const { data: existingConv } = await db
              .from('conversations')
              .select('id')
              .eq('user_id', user.id)
              .eq('contact_id', contactId)
              .maybeSingle()
            if (existingConv) {
              conversationId = existingConv.id
            } else {
              const { data: newConv, error: convErr } = await db
                .from('conversations')
                .insert({
                  user_id: user.id,
                  contact_id: contactId,
                  status: 'open',
                })
                .select('id')
                .single()
              if (!convErr && newConv) conversationId = newConv.id
            }
            if (conversationId) {
              await db.from('messages').insert({
                conversation_id: conversationId,
                sender_type: 'agent',
                content_type: 'template',
                content_text: null,
                template_name,
                message_id: sentMessageId,
                status: 'sent',
              })
              await db
                .from('conversations')
                .update({
                  last_message_text: `[template: ${template_name}]`,
                  last_message_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', conversationId)
            }
          } catch (dbErr) {
            console.error('[broadcast] DB write failed for recipient:', dbErr)
          }
        }
        results.push({
          phone: recipient.phone,
          status: 'sent',
          whatsapp_message_id: sentMessageId,
        })
        sentCount++
      } else {
        console.error(
          `Failed to send broadcast to ${recipient.phone}:`,
          lastError
        )
        results.push({
          phone: recipient.phone,
          status: 'failed',
          error: lastError || 'Unknown error',
        })
        failedCount++
      }
    }

    return NextResponse.json({
      success: true,
      total: recipients.length,
      sent: sentCount,
      failed: failedCount,
      results,
    })
  } catch (error) {
    console.error('Error in WhatsApp broadcast POST:', error)
    return NextResponse.json(
      { error: 'Failed to process broadcast' },
      { status: 500 }
    )
  }
}
