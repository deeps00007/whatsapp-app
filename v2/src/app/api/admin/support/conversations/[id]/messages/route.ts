import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { validateAdminKey, getAgentName } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

// GET — fetch all messages in a conversation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const afterTimestamp = searchParams.get('after')

  const admin = supabaseAdmin()

  const { data: convo } = await admin
    .from('support_conversations')
    .select('id, status, user_email, user_name, subject')
    .eq('id', id)
    .maybeSingle()

  if (!convo) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  let query = admin
    .from('support_messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (afterTimestamp) {
    query = query.gt('created_at', afterTimestamp)
  }

  const { data: messages, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json({
    conversation: convo,
    messages: messages || [],
  }, { headers: { 'Cache-Control': 'no-store' } })
}

// POST — agent sends a reply message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const { id } = await params
  const agentName = getAgentName(request)
  const body = await request.json()
  const { content } = body

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const admin = supabaseAdmin()

  const { data: convo } = await admin
    .from('support_conversations')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (!convo) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  const { data: message, error: msgError } = await admin
    .from('support_messages')
    .insert({
      conversation_id: id,
      sender_type: 'agent',
      sender_name: agentName,
      content: content.trim(),
    })
    .select()
    .single()

  if (msgError) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  await admin
    .from('support_conversations')
    .update({
      status: 'agent_assigned',
      assigned_agent: agentName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  return NextResponse.json({ message }, { headers: { 'Cache-Control': 'no-store' } })
}
