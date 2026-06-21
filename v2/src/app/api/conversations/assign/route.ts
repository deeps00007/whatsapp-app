import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { runAutomationsForTrigger } from '@/lib/automations/engine'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.conversation_id || !body?.agent_id) {
    return NextResponse.json({ error: 'conversation_id and agent_id required' }, { status: 400 })
  }

  const admin = supabaseAdmin()

  const { data: conv, error: fetchErr } = await admin
    .from('conversations')
    .select('id, user_id, contact_id, assigned_agent_id')
    .eq('id', body.conversation_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchErr || !conv) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const prevAgent = conv.assigned_agent_id
  const newAgent = body.agent_id

  const { error: updErr } = await admin
    .from('conversations')
    .update({ assigned_agent_id: newAgent })
    .eq('id', conv.id)

  if (updErr) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  if (newAgent && newAgent !== prevAgent) {
    runAutomationsForTrigger({
      userId: user.id,
      triggerType: 'conversation_assigned',
      contactId: conv.contact_id,
      context: {
        conversation_id: conv.id,
        agent_id: newAgent,
      },
    }).catch((err) => console.error('[automations] conversation_assigned dispatch failed:', err))
  }

  return NextResponse.json({ ok: true })
}
