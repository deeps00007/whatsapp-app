import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { validateAdminKey, getAgentName } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

// POST — Register or update an FCM device token
export async function POST(request: Request) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const agentName = getAgentName(request)
  const body = await request.json()
  const { token, device_info } = body

  if (!token?.trim()) {
    return NextResponse.json({ error: 'FCM token is required' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('admin_device_tokens')
    .upsert({
      token: token.trim(),
      agent_name: agentName,
      device_info: device_info || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'token' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to register token' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json({ success: true, token: data }, { headers: { 'Cache-Control': 'no-store' } })
}

// DELETE — Deactivate a device token (on logout)
export async function DELETE(request: Request) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const body = await request.json()
  const { token } = body

  if (!token?.trim()) {
    return NextResponse.json({ error: 'FCM token is required' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const admin = supabaseAdmin()

  const { error } = await admin
    .from('admin_device_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('token', token.trim())

  if (error) {
    return NextResponse.json({ error: 'Failed to deactivate token' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
}
