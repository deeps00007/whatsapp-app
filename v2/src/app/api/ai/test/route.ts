import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { searchKnowledgeBase } from '@/lib/ai/rag'
import { generateBusinessAIResponse, shouldAIRespond } from '@/lib/ai/business-ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    // 1. Check AI settings
    const { data: settings } = await admin
      .from('ai_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!settings) {
      return NextResponse.json({ error: 'AI settings not found. Please configure AI Assistant first.' })
    }

    // 2. Check if AI is enabled
    if (!settings.enabled) {
      return NextResponse.json({ error: 'AI is disabled. Enable it in Settings tab.' })
    }

    // 3. Check paused conversations
    const paused = settings.ai_paused_conversations || []
    if (paused.length > 0) {
      return NextResponse.json({
        warning: 'AI is paused for some conversations',
        paused_count: paused.length,
        paused_conversations: paused,
      })
    }

    // 4. Check usage
    if (settings.monthly_request_count >= 100) {
      return NextResponse.json({ error: 'Monthly limit reached (100)' })
    }

    // 5. Search knowledge base (RAG)
    const { chunks, confidence } = await searchKnowledgeBase(user.id, message)

    // 6. Check confidence
    if (confidence < 0.40 || chunks.length === 0) {
      return NextResponse.json({
        step: 'RAG Search',
        message: 'No relevant knowledge found — would escalate',
        confidence,
        threshold: 0.40,
        chunks_found: chunks.length,
        chunks: chunks.map(c => ({ title: c.title, similarity: c.similarity, content: c.content.slice(0, 100) })),
      })
    }

    // 7. Generate AI response
    const aiResult = await generateBusinessAIResponse({
      userId: user.id,
      conversationId: 'test-conversation',
      contactId: 'test-contact',
      customerMessage: message,
      settings: settings as any,
    })

    return NextResponse.json({
      step: 'Complete',
      customer_message: message,
      confidence: aiResult.confidence,
      confidence_percent: Math.round(aiResult.confidence * 100) + '%',
      escalated: aiResult.escalated,
      ai_reply: aiResult.reply,
      prompt_tokens: aiResult.promptTokens,
      completion_tokens: aiResult.completionTokens,
      latency_ms: aiResult.latencyMs,
      language: aiResult.language,
      retrieved_chunks: chunks.map(c => ({ title: c.title, similarity: Math.round(c.similarity * 100) + '%', content: c.content.slice(0, 100) })),
    })
  } catch (err: any) {
    console.error('[ai/test] error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
