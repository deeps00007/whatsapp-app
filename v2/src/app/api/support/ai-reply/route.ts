import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { generateAIResponse } from '@/lib/ai/sarvam'
import { sendAdminPushNotification } from '@/lib/fcm/push'

export const dynamic = 'force-dynamic'

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId } = body

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    const { data: convo } = await admin
      .from('support_conversations')
      .select('id, user_id, status, user_name, agent_last_active_at')
      .eq('id', conversationId)
      .maybeSingle()

    if (!convo || convo.user_id !== user.id) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check if agent is actively in the chat (heartbeat within last 15 seconds)
    const agentActive = convo.agent_last_active_at
      ? (Date.now() - new Date(convo.agent_last_active_at).getTime()) < 15000
      : false

    if (agentActive) {
      return NextResponse.json({ skipped: true, reason: 'Agent is active' })
    }

    const { data: messages } = await admin
      .from('support_messages')
      .select('sender_type, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10)

    if (!messages || messages.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'No messages to respond to' })
    }

    const aiResponseRaw = await generateAIResponse(
      messages.map((m: { sender_type: string; content: string }) => ({
        role: m.sender_type === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    )

    const isRequestingHuman = aiResponseRaw.includes('[REQUESTING_HUMAN]')
    const aiResponse = aiResponseRaw.replace('[REQUESTING_HUMAN]', '').trim()

    const { data: aiMessage, error: msgError } = await admin
      .from('support_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'bot',
        sender_name: 'Grow by Chat Assistant',
        content: aiResponse,
      })
      .select()
      .single()

    if (msgError) {
      return NextResponse.json({ error: 'Failed to save AI response' }, { status: 500 })
    }

    await admin
      .from('support_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    // If AI is requesting human escalation
    if (isRequestingHuman) {
      // Send URGENT FCM push to admin
      sendAdminPushNotification(
        '🔔 URGENT: User requesting human support',
        `${convo.user_name || 'A user'} is requesting to speak with a human agent. Please respond in the support app.`,
        {
          conversation_id: conversationId,
          type: 'human_escalation',
          click_action: 'OPEN_CONVERSATION',
          priority: 'urgent',
        },
      ).catch((err) => console.error('[ai-reply] FCM push failed:', err))

      // Wait 2 minutes, then check if admin joined
      setTimeout(async () => {
        try {
          const { data: agentCheck } = await admin
            .from('support_messages')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('sender_type', 'agent')
            .limit(1)

          // Admin hasn't joined — send follow-up asking for contact number
          if (!agentCheck || agentCheck.length === 0) {
            await admin.from('support_messages').insert({
              conversation_id: conversationId,
              sender_type: 'bot',
              sender_name: 'Grow by Chat Assistant',
              content: "It seems all our support agents are currently busy attending to other customers. 😔\n\nCould you please share your WhatsApp number? Our team will reach out to you on WhatsApp as soon as possible. Your query is important to us!",
            })

            await admin
              .from('support_conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', conversationId)
          }
        } catch (err) {
          console.error('[ai-reply] follow-up check failed:', err)
        }
      }, 120000) // 2 minutes
    }

    return NextResponse.json({
      message: aiMessage,
      requesting_human: isRequestingHuman,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err: any) {
    console.error('[support/ai-reply] error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
