import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { runAutomationsForTrigger } from '@/lib/automations/engine'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.contact_id || !body?.tag_id) {
    return NextResponse.json({ error: 'contact_id and tag_id required' }, { status: 400 })
  }

  const admin = supabaseAdmin()

  const { data: contact, error: cErr } = await admin
    .from('contacts')
    .select('id, user_id')
    .eq('id', body.contact_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (cErr || !contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  const { data: tagCheck } = await admin
    .from('tags')
    .select('id')
    .eq('id', body.tag_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!tagCheck) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
  }

  const { error: upsertErr } = await admin
    .from('contact_tags')
    .upsert(
      { contact_id: body.contact_id, tag_id: body.tag_id },
      { onConflict: 'contact_id,tag_id', ignoreDuplicates: true },
    )

  if (upsertErr) return NextResponse.json({ error: 'Tag assignment failed' }, { status: 500 })

  runAutomationsForTrigger({
    userId: user.id,
    triggerType: 'tag_added',
    contactId: body.contact_id,
    context: {
      tag_id: body.tag_id,
    },
  }).catch((err) => console.error('[automations] tag_added dispatch failed:', err))

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.contact_id || !body?.tag_id) {
    return NextResponse.json({ error: 'contact_id and tag_id required' }, { status: 400 })
  }

  const admin = supabaseAdmin()

  const { error } = await admin
    .from('contact_tags')
    .delete()
    .eq('contact_id', body.contact_id)
    .eq('tag_id', body.tag_id)

  if (error) return NextResponse.json({ error: 'Tag removal failed' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
