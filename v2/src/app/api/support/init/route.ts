import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subject } = body

    const { data: existing } = await supabase
      .from('support_conversations')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['open', 'agent_assigned'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      const { data: messages } = await supabase
        .from('support_messages')
        .select('*')
        .eq('conversation_id', existing.id)
        .order('created_at', { ascending: true })

      return NextResponse.json({
        conversationId: existing.id,
        status: existing.status,
        messages: messages || [],
      })
    }

    const { data: convo, error: convoError } = await supabase
      .from('support_conversations')
      .insert({
        user_id: user.id,
        user_email: user.email || '',
        user_name: (user as any).user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        subject: subject || 'General Support',
        status: 'open',
      })
      .select()
      .single()

    if (convoError) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    const { error: msgError } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: convo.id,
        sender_type: 'bot',
        sender_name: 'Grow by Chat Support',
        content: "👋 Hi! Welcome to Grow by Chat Support. How can we help you today? Our team typically responds within a few minutes.",
      })

    if (msgError) {
      console.error('[support/init] bot message error:', msgError)
    }

    const { data: messages } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', convo.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      conversationId: convo.id,
      status: 'open',
      messages: messages || [],
    })
  } catch (err: any) {
    console.error('[support/init] error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
