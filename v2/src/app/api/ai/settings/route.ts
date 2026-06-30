import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('ai_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    const { data: newSettings } = await admin
      .from('ai_settings')
      .insert({ user_id: user.id })
      .select()
      .single()
    return NextResponse.json({ settings: newSettings })
  }

  return NextResponse.json({ settings: data })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { enabled, mode, custom_system_prompt, business_name, business_hours, escalation_phone, escalation_enabled } = body

  const admin = supabaseAdmin()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (typeof enabled === 'boolean') update.enabled = enabled
  if (mode && ['all_messages', 'fallback_only'].includes(mode)) update.mode = mode
  if (custom_system_prompt !== undefined) update.custom_system_prompt = custom_system_prompt
  if (business_name !== undefined) update.business_name = business_name
  if (business_hours !== undefined) update.business_hours = business_hours
  if (escalation_phone !== undefined) update.escalation_phone = escalation_phone
  if (typeof escalation_enabled === 'boolean') update.escalation_enabled = escalation_enabled

  const { data, error } = await admin
    .from('ai_settings')
    .upsert({ user_id: user.id, ...update }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}
