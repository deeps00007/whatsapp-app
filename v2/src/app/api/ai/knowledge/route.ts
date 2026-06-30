import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addKnowledgeEntry } from '@/lib/ai/rag'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('ai_knowledge_base')
    .select('id, type, title, content, tags, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: data || [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { type, title, content, tags } = body

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
  }

  const result = await addKnowledgeEntry({
    userId: user.id,
    type: type || 'general',
    title: title.trim(),
    content: content.trim(),
    tags: tags || [],
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Failed to add entry' }, { status: 500 })
  }

  return NextResponse.json({ success: true, chunkCount: result.chunkCount })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing entry id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('ai_knowledge_base')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
