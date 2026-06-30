import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { validateAdminKey } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const { id } = await params
  const admin = supabaseAdmin()

  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }

    const { active, days, plan } = body

    let expiresAt: string | null = null
    if (active) {
      const d = Number(days) || 30
      expiresAt = new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString()
    }

    const planValue = ['monthly', 'quarterly', 'yearly'].includes(plan) ? plan : null

    // If profile doesn't exist, create it first.
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, user_id, full_name, email, role, subscription_expires_at, created_at')
      .eq('user_id', id)
      .maybeSingle()

    let profile = existingProfile

    if (!profile) {
      const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(id)
      if (authErr || !authUser?.user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
      }

      const { data: inserted, error: insertErr } = await admin
        .from('profiles')
        .insert({
          user_id: id,
          full_name: authUser.user.user_metadata?.full_name ?? '',
          email: authUser.user.email ?? '',
          subscription_expires_at: expiresAt,
          subscription_plan: planValue,
        })
        .select('id, user_id, full_name, email, role, subscription_expires_at, created_at')
        .maybeSingle()

      if (insertErr || !inserted) {
        console.error('[admin/users/[id]/subscription] insert error:', insertErr?.message)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
      }

      profile = inserted
    } else {
      const { data: updated, error: updateErr } = await admin
        .from('profiles')
        .update({ subscription_expires_at: expiresAt, subscription_plan: planValue })
        .eq('user_id', id)
        .select('id, user_id, full_name, email, role, subscription_expires_at, created_at')
        .maybeSingle()

      if (updateErr || !updated) {
        console.error('[admin/users/[id]/subscription] update error:', updateErr?.message)
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
      }

      profile = updated
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        created_at: profile.created_at,
        subscription: {
          active: active,
          expires_at: profile.subscription_expires_at,
        }
      }
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[admin/users/[id]/subscription] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
