import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { validateAdminKey } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const { id } = await params
  const admin = supabaseAdmin()

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, user_id, full_name, email, role, subscription_expires_at, created_at')
    .eq('user_id', id)
    .maybeSingle()

  if (error) {
    console.error('[admin/users/[id]] error:', error.message)
    return NextResponse.json({ error: 'Failed to load user' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  const { data: config } = await admin
    .from('whatsapp_config')
    .select('*')
    .eq('user_id', id)
    .maybeSingle()

  const { count: contactsCount } = await admin
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', id)

  const { count: conversationsCount } = await admin
    .from('support_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', id)

  const now = new Date()
  const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null

  return NextResponse.json({
    user: {
      id: profile.id,
      user_id: profile.user_id,
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
      created_at: profile.created_at,
      subscription: {
        active: expiresAt ? expiresAt > now : false,
        expires_at: profile.subscription_expires_at,
      },
      counts: {
        contacts: contactsCount || 0,
        support_conversations: conversationsCount || 0,
      },
      whatsapp: config
        ? {
            connected: config.status === 'connected',
            status: config.status,
            phone_number: config.phone_number,
            business_name: config.business_name,
            phone_number_id: config.phone_number_id,
            waba_id: config.waba_id,
            payment_method_connected: config.payment_method_connected,
            phone_verified: config.code_verification_status === 'VERIFIED',
            quality_rating: config.quality_rating,
            coexistence_mode: config.coexistence_mode,
            created_at: config.created_at,
            updated_at: config.updated_at,
          }
        : null,
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}
