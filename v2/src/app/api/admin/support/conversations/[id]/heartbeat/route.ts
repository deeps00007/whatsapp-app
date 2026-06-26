import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { validateAdminKey, getAgentName } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

// POST — Agent heartbeat (called every 5s while viewing a chat)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const { id } = await params
  const agentName = getAgentName(request)
  const admin = supabaseAdmin()

  const { error } = await admin
    .from('support_conversations')
    .update({
      agent_last_active_at: new Date().toISOString(),
      assigned_agent: agentName,
      status: 'agent_assigned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
}

// DELETE — Agent left the chat (called on dispose/navigate away)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const { id } = await params
  const admin = supabaseAdmin()

  const { error } = await admin
    .from('support_conversations')
    .update({
      agent_last_active_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to clear heartbeat' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
}
