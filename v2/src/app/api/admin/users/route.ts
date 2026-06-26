import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { validateAdminKey } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const admin = supabaseAdmin()

  const { data: users, error } = await admin
    .from('profiles')
    .select('id, user_id, full_name, email, role, subscription_expires_at, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/users] error:', error.message)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  const userIds = (users || []).map((u) => u.user_id)
  const configs: Record<string, { status?: string; phone_number?: string; business_name?: string; payment_method_connected?: boolean; code_verification_status?: string; updated_at?: string }> = {}

  if (userIds.length > 0) {
    const { data: configsData, error: configsError } = await admin
      .from('whatsapp_config')
      .select('user_id, status, phone_number, business_name, payment_method_connected, code_verification_status, updated_at')
      .in('user_id', userIds)

    if (configsError) {
      console.error('[admin/users] config error:', configsError.message)
    } else {
      for (const c of configsData || []) {
        configs[c.user_id] = c
      }
    }
  }

  const now = new Date()
  const enriched = (users || []).map((u) => {
    const config = configs[u.user_id]
    const expiresAt = u.subscription_expires_at ? new Date(u.subscription_expires_at) : null
    return {
      id: u.id,
      user_id: u.user_id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      subscription: {
        active: expiresAt ? expiresAt > now : false,
        expires_at: u.subscription_expires_at,
      },
      whatsapp: config
        ? {
            connected: config.status === 'connected',
            status: config.status,
            phone_number: config.phone_number,
            business_name: config.business_name,
            payment_method_connected: config.payment_method_connected,
            phone_verified: config.code_verification_status === 'VERIFIED',
            updated_at: config.updated_at,
          }
        : null,
    }
  })

  return NextResponse.json({ users: enriched }, { headers: { 'Cache-Control': 'no-store' } })
}
