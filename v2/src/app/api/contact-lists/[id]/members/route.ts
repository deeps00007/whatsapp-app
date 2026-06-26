import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: list } = await supabase
    .from('contact_lists')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: members, error } = await supabase
    .from('contact_list_members')
    .select('contact_id')
    .eq('list_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contactIds: (members ?? []).map((m: { contact_id: string }) => m.contact_id) })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.contact_ids || !Array.isArray(body.contact_ids)) {
    return NextResponse.json({ error: 'contact_ids array required' }, { status: 400 })
  }

  const { data: list } = await supabase
    .from('contact_lists')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 })

  const rows = body.contact_ids.map((cid: string) => ({ contact_id: cid, list_id: id }))

  const { error } = await supabase
    .from('contact_list_members')
    .upsert(rows, { onConflict: 'contact_id,list_id', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, added: rows.length })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (body?.contact_ids && Array.isArray(body.contact_ids)) {
    const { error } = await supabase
      .from('contact_list_members')
      .delete()
      .eq('list_id', id)
      .in('contact_id', body.contact_ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, removed: body.contact_ids.length })
  }

  const { error } = await supabase
    .from('contact_list_members')
    .delete()
    .eq('list_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
