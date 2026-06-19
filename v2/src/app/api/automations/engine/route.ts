import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAutomationsForTrigger } from '@/lib/automations/engine'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import type { AutomationTriggerType } from '@/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.trigger_type) {
    return NextResponse.json({ error: 'trigger_type required' }, { status: 400 })
  }

  if (body.contact_id) {
    const { data } = await supabaseAdmin()
      .from('contacts')
      .select('id')
      .eq('id', body.contact_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!data) {
      return NextResponse.json({ error: 'Invalid contact' }, { status: 400 })
    }
  }

  await runAutomationsForTrigger({
    userId: user.id,
    triggerType: body.trigger_type as AutomationTriggerType,
    contactId: body.contact_id ?? null,
    context: body.context ?? {},
  })

  return NextResponse.json({ ok: true })
}
