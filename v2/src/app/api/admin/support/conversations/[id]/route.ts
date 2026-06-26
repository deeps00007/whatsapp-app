import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { validateAdminKey, getAgentName } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

// PATCH — update conversation status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const { id } = await params
  const agentName = getAgentName(request)
  const body = await request.json()
  const { status, subject } = body

  if (!status || !['open', 'agent_assigned', 'resolved', 'closed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status. Must be: open, agent_assigned, resolved, or closed' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const admin = supabaseAdmin()

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'agent_assigned') {
    update.assigned_agent = agentName
  }

  if (subject !== undefined) {
    update.subject = subject
  }

  const { data, error } = await admin
    .from('support_conversations')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json({ conversation: data }, { headers: { 'Cache-Control': 'no-store' } })
}
