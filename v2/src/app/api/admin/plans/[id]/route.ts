import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { validateAdminKey } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const { id } = await params

  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }

    const { amount, active, label } = body
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (typeof amount === 'number' && amount > 0) updates.amount = amount
    if (typeof active === 'boolean') updates.active = active
    if (typeof label === 'string' && label.trim()) updates.label = label.trim()

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }

    const admin = supabaseAdmin()
    const { data: plan, error } = await admin
      .from('subscription_plans')
      .update(updates)
      .eq('id', id)
      .select('id, label, amount, period_days, active')
      .maybeSingle()

    if (error) {
      console.error('[admin/plans/[id]] update error:', error.message)
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    }

    return NextResponse.json({ success: true, plan }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[admin/plans/[id]] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
