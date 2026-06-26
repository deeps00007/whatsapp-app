import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { validateAdminKey } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200)
  const offset = Number(searchParams.get('offset') ?? 0)

  const admin = supabaseAdmin()
  let query = admin
    .from('support_conversations')
    .select('*')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && ['open', 'agent_assigned', 'resolved', 'closed'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: allCount } = await admin
    .from('support_conversations')
    .select('id', { count: 'exact', head: true })

  return NextResponse.json({
    conversations: data || [],
    total: allCount?.length || 0,
    offset,
    limit,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
