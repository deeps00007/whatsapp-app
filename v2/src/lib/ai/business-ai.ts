import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { searchKnowledgeBase } from './rag'

const SARVAM_API_URL = 'https://api.sarvam.ai/v1/chat/completions'

interface AISettings {
  enabled: boolean
  mode: string
  custom_system_prompt: string | null
  business_name: string | null
  business_hours: string | null
  escalation_phone: string | null
  escalation_enabled: boolean
  ai_paused_conversations: string[]
  monthly_request_count: number
}

interface ConversationMessage {
  sender_type: string
  content_text: string
}

interface AIResponse {
  reply: string | null
  escalated: boolean
  confidence: number
  chunks: Array<{ title: string; content: string; similarity: number }>
  promptTokens: number
  completionTokens: number
  latencyMs: number
  language: string
  skipped: boolean
  skipReason?: string
}

/**
 * Check if AI should respond to this conversation.
 * Also lazily resets monthly usage if the reset date has passed.
 */
export async function shouldAIRespond(
  userId: string,
  conversationId: string,
): Promise<{ respond: boolean; settings: AISettings | null }> {
  const admin = supabaseAdmin()

  const { data: settings } = await admin
    .from('ai_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!settings || !settings.enabled) {
    return { respond: false, settings: null }
  }

  // Lazy monthly usage reset — if reset_at has passed, zero the counters
  const now = new Date()
  const resetAt = settings.reset_at ? new Date(settings.reset_at) : null
  if (resetAt && resetAt < now) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    await admin.from('ai_settings').update({
      monthly_request_count: 0,
      monthly_prompt_tokens: 0,
      monthly_completion_tokens: 0,
      reset_at: nextReset.toISOString().split('T')[0],
      updated_at: now.toISOString(),
    }).eq('user_id', userId)

    settings.monthly_request_count = 0
    settings.monthly_prompt_tokens = 0
    settings.monthly_completion_tokens = 0
  }

  // Check if AI is paused for this conversation (human handoff)
  const paused = settings.ai_paused_conversations || []
  if (paused.includes(conversationId)) {
    return { respond: false, settings: null }
  }

  // Check monthly usage (100 free per month)
  if (settings.monthly_request_count >= 100) {
    return { respond: false, settings: null }
  }

  return { respond: true, settings: settings as AISettings }
}

/**
 * Generate AI response for a customer message using RAG + Sarvam.
 */
export async function generateBusinessAIResponse(args: {
  userId: string
  conversationId: string
  contactId: string
  customerMessage: string
  settings: AISettings
}): Promise<AIResponse> {
  const startTime = Date.now()
  const admin = supabaseAdmin()

  // 1. Search knowledge base (RAG)
  const { chunks, confidence } = await searchKnowledgeBase(
    args.userId,
    args.customerMessage,
  )

  // 2. Confidence check — escalate if too low (0.40 threshold for short queries)
  if (confidence < 0.40 || chunks.length === 0) {
    const latency = Date.now() - startTime
    return {
      reply: null,
      escalated: true,
      confidence,
      chunks,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: latency,
      language: 'unknown',
      skipped: false,
    }
  }

  // 3. Fetch conversation memory (last 10 messages)
  const { data: recentMessages } = await admin
    .from('messages')
    .select('sender_type, content_text')
    .eq('conversation_id', args.conversationId)
    .order('created_at', { ascending: false })
    .limit(10)

  const conversationHistory: ConversationMessage[] = (recentMessages || [])
    .reverse()
    .filter((m: { content_text: string | null }) => m.content_text)
    .map((m: { sender_type: string; content_text: string }) => ({
      sender_type: m.sender_type,
      content_text: m.content_text,
    }))

  // 4. Build system prompt
  const businessName = args.settings.business_name || 'this business'
  const businessHours = args.settings.business_hours || 'Not specified'
  const customPrompt = args.settings.custom_system_prompt || ''

  const systemPrompt = `You are the AI assistant for ${businessName}.
Current time: ${new Date().toISOString()}
Business hours: ${businessHours}

Rules:
- Only answer based on the provided knowledge base information
- Never invent information not in the knowledge base
- If you are unsure, say: "I'm not sure about that. Let me connect you with our team. Please hold while I notify them."
- Always respond in the same language the customer is using (Hindi, English, Tamil, Telugu, etc.)
- Keep responses concise and helpful (2-4 sentences unless giving step-by-step instructions)
- Be polite and professional at all times
${customPrompt ? `\nAdditional instructions:\n${customPrompt}` : ''}`

  // 5. Build knowledge context from retrieved chunks
  const knowledgeContext = chunks
    .map((c, i) => `[${i + 1}] ${c.title}:\n${c.content}`)
    .join('\n\n')

  // 6. Build conversation history with proper role mapping
  const conversationContext = conversationHistory
    .slice(-10)
    .map((m) => {
      let role: string
      if (m.sender_type === 'customer') {
        role = 'Customer'
      } else if (m.sender_type === 'agent') {
        role = 'Agent'
      } else {
        role = 'AI'
      }
      return `${role}: ${m.content_text}`
    })
    .join('\n')

  // 7. Build full message list for Sarvam
  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'system',
      content: `Knowledge Base:\n${knowledgeContext}\n\nRecent Conversation:\n${conversationContext}`,
    },
    { role: 'user', content: args.customerMessage },
  ]

  // 8. Call Sarvam AI
  const sarvamKey = process.env.SARVAM_API_KEY
  if (!sarvamKey) {
    console.error('[business-ai] SARVAM_API_KEY not configured')
    // Don't escalate on technical failure — just return a fallback
    return {
      reply: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
      escalated: false,
      confidence,
      chunks,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: Date.now() - startTime,
      language: detectLanguage(args.customerMessage),
      skipped: false,
    }
  }

  try {
    const res = await fetch(SARVAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': sarvamKey,
        Authorization: `Bearer ${sarvamKey}`,
      },
      body: JSON.stringify({
        model: 'sarvam-30b',
        messages,
        temperature: 0.5,
        reasoning_effort: null,
      }),
    })

    const latency = Date.now() - startTime

    if (!res.ok) {
      const text = await res.text()
      console.error('[business-ai] Sarvam API error:', res.status, text)
      // Technical failure — DON'T escalate or pause AI, just return fallback
      return {
        reply: "I'm sorry, I'm having trouble right now. Could you please try again?",
        escalated: false,
        confidence,
        chunks,
        promptTokens: 0,
        completionTokens: 0,
        latencyMs: latency,
        language: detectLanguage(args.customerMessage),
        skipped: false,
      }
    }

    const data = await res.json()
    const aiReply = data.choices?.[0]?.message?.content || null
    const promptTokens = data.usage?.prompt_tokens || 0
    const completionTokens = data.usage?.completion_tokens || 0

    // 9. Detect if AI is unsure (contains escalation phrase)
    // ONLY escalate if the AI itself says it can't answer — NOT on technical failures
    const isUnsure = aiReply?.toLowerCase().includes('connect you with our team') ||
      aiReply?.toLowerCase().includes("i'm not sure") ||
      aiReply?.toLowerCase().includes("i don't know") ||
      aiReply?.toLowerCase().includes("i am not sure")

    // If AI returned null/empty response, don't escalate — return fallback
    if (!aiReply) {
      return {
        reply: "I'm sorry, I couldn't process that. Could you rephrase your question?",
        escalated: false,
        confidence,
        chunks,
        promptTokens,
        completionTokens,
        latencyMs: latency,
        language: detectLanguage(args.customerMessage),
        skipped: false,
      }
    }

    return {
      reply: aiReply,
      escalated: isUnsure,
      confidence,
      chunks,
      promptTokens,
      completionTokens,
      latencyMs: latency,
      language: detectLanguage(args.customerMessage),
      skipped: false,
    }
  } catch (err) {
    console.error('[business-ai] Sarvam request failed:', err)
    // Network/timeout error — DON'T escalate or pause AI
    return {
      reply: "I'm sorry, I'm having trouble connecting right now. Please try again.",
      escalated: false,
      confidence,
      chunks,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: Date.now() - startTime,
      language: detectLanguage(args.customerMessage),
      skipped: false,
    }
  }
}

/**
 * Simple language detection based on Unicode ranges.
 */
function detectLanguage(text: string): string {
  // Devanagari (Hindi, Marathi)
  if (/[\u0900-\u097F]/.test(text)) return 'hindi'
  // Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) return 'tamil'
  // Telugu
  if (/[\u0C00-\u0C7F]/.test(text)) return 'telugu'
  // Bengali
  if (/[\u0980-\u09FF]/.test(text)) return 'bengali'
  // Kannada
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kannada'
  // Malayalam
  if (/[\u0D00-\u0D7F]/.test(text)) return 'malayalam'
  // Gujarati
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gujarati'
  // Punjabi
  if (/[\u0A00-\u0A7F]/.test(text)) return 'punjabi'
  // Hinglish (Latin script but common Hindi words)
  const lower = text.toLowerCase()
  if (/\b(hai|kya|nahi|haan|bhai|yaar|kaise|kyon|matlab|theek|acha|bro)\b/.test(lower)) return 'hinglish'
  // Default to English
  return 'english'
}

/**
 * Log an AI conversation to the database.
 */
export async function logAIConversation(args: {
  userId: string
  conversationId: string
  contactId: string
  customerMessage: string
  aiResponse: AIResponse
}): Promise<void> {
  const admin = supabaseAdmin()

  await admin.from('ai_conversation_logs').insert({
    user_id: args.userId,
    conversation_id: args.conversationId,
    contact_id: args.contactId,
    customer_message: args.customerMessage,
    ai_response: args.aiResponse.reply,
    confidence_score: args.aiResponse.confidence,
    retrieved_chunks: args.aiResponse.chunks,
    escalated: args.aiResponse.escalated,
    prompt_tokens: args.aiResponse.promptTokens,
    completion_tokens: args.aiResponse.completionTokens,
    latency_ms: args.aiResponse.latencyMs,
    language_detected: args.aiResponse.language,
  })

  // Update usage counter
  await admin.rpc('increment_ai_usage', {
    target_user_id: args.userId,
    p_prompt_tokens: args.aiResponse.promptTokens,
    p_completion_tokens: args.aiResponse.completionTokens,
  })
}

/**
 * Pause AI for a conversation (human handoff).
 */
export async function pauseAIForConversation(userId: string, conversationId: string): Promise<void> {
  const admin = supabaseAdmin()
  await admin.rpc('pause_ai_conversation', {
    target_user_id: userId,
    convo_id: conversationId,
  })
}

/**
 * Resume AI for a conversation.
 */
export async function resumeAIForConversation(userId: string, conversationId: string): Promise<void> {
  const admin = supabaseAdmin()
  await admin.rpc('resume_ai_conversation', {
    target_user_id: userId,
    convo_id: conversationId,
  })
}
