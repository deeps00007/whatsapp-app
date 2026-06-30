import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { validateAdminKey } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    const admin = supabaseAdmin()
    const { data: plans, error } = await admin
      .from('subscription_plans')
      .select('id, label, amount, period_days, active')
      .order('period_days', { ascending: true })

    if (error) {
      console.error('[admin/plans] error:', error.message)
      return NextResponse.json({ error: 'Failed to load plans' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
    }

    return NextResponse.json({ plans: plans ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[admin/plans] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
