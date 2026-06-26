import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAdminPushNotification } from '@/lib/fcm/push'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, content } = body

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing conversationId or content' }, { status: 400 })
    }

    const { data: convo } = await supabase
      .from('support_conversations')
      .select('id, user_id, user_name, subject')
      .eq('id', conversationId)
      .maybeSingle()

    if (!convo || convo.user_id !== user.id) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { data: message, error: msgError } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'user',
        sender_name: user.email?.split('@')[0] || 'User',
        content: content.trim(),
      })
      .select()
      .single()

    if (msgError) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    await supabase
      .from('support_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    sendAdminPushNotification(
      `New support message from ${convo.user_name || 'User'}`,
      content.trim().length > 80 ? content.trim().slice(0, 80) + '...' : content.trim(),
      {
        conversation_id: conversationId,
        type: 'new_user_message',
        click_action: 'OPEN_CONVERSATION',
      },
    ).catch((err) => console.error('[support/send] FCM push failed:', err))

    return NextResponse.json({ message })
  } catch (err: any) {
    console.error('[support/send] error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
