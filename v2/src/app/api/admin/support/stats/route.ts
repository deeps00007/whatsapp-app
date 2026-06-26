import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { validateAdminKey } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const admin = supabaseAdmin()

  const { data: convos } = await admin
    .from('support_conversations')
    .select('id, status')

  const all = convos || []

  const stats = {
    total: all.length,
    open: all.filter((c: { status: string }) => c.status === 'open').length,
    agent_assigned: all.filter((c: { status: string }) => c.status === 'agent_assigned').length,
    resolved: all.filter((c: { status: string }) => c.status === 'resolved').length,
    closed: all.filter((c: { status: string }) => c.status === 'closed').length,
  }

  const { count: totalMessages } = await admin
    .from('support_messages')
    .select('id', { count: 'exact', head: true })

  return NextResponse.json({
    ...stats,
    total_messages: totalMessages || 0,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
