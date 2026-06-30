import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { generateEmbedding, generateEmbeddings } from './embeddings'

const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 50

/**
 * Split a long text into chunks of ~500 words with 50-word overlap.
 */
export function chunkText(text: string): string[] {
  const words = text.split(/\s+/)
  if (words.length <= CHUNK_SIZE) return [text]

  const chunks: string[] = []
  for (let i = 0; i < words.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(' ')
    chunks.push(chunk)
    if (i + CHUNK_SIZE >= words.length) break
  }
  return chunks
}

interface RetrievedChunk {
  id: string
  title: string
  content: string
  type: string
  similarity: number
}

/**
 * Search the knowledge base using vector similarity.
 * Returns top 5 most relevant chunks with confidence scores.
 */
export async function searchKnowledgeBase(
  userId: string,
  query: string,
): Promise<{ chunks: RetrievedChunk[]; confidence: number }> {
  const queryEmbedding = await generateEmbedding(query)
  if (!queryEmbedding) {
    return { chunks: [], confidence: 0 }
  }

  const admin = supabaseAdmin()

  // pgvector cosine similarity search
  const { data, error } = await admin.rpc('match_knowledge_base', {
    query_embedding: queryEmbedding,
    match_user_id: userId,
    match_count: 5,
  })

  if (error) {
    console.error('[rag] Vector search error:', error.message)
    return { chunks: [], confidence: 0 }
  }

  const chunks: RetrievedChunk[] = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    type: row.type as string,
    similarity: row.similarity as number,
  }))

  const confidence = chunks.length > 0 ? chunks[0].similarity : 0

  return { chunks, confidence }
}

/**
 * Add a knowledge base entry with embedding.
 * For long documents, splits into chunks and creates multiple rows.
 */
export async function addKnowledgeEntry(args: {
  userId: string
  type: 'faq' | 'policy' | 'product' | 'document' | 'general'
  title: string
  content: string
  tags?: string[]
}): Promise<{ success: boolean; error?: string; chunkCount?: number }> {
  const admin = supabaseAdmin()

  // For FAQs, store as single entry (question + answer combined)
  if (args.type === 'faq') {
    const combinedContent = `Question: ${args.title}\nAnswer: ${args.content}`
    const embedding = await generateEmbedding(combinedContent)

    const { error } = await admin.from('ai_knowledge_base').insert({
      user_id: args.userId,
      type: args.type,
      title: args.title,
      content: args.content,
      tags: args.tags || [],
      embedding: embedding ? `[${embedding.join(',')}]` : null,
      chunk_index: 0,
    })

    if (error) return { success: false, error: error.message }
    return { success: true, chunkCount: 1 }
  }

  // For documents/policies/products: embed title + first chunk together
  // so the title context is preserved in the vector search
  const chunks = chunkText(args.content)

  // Prepend title to first chunk for better semantic matching
  if (chunks.length > 0) {
    chunks[0] = `${args.title}\n\n${chunks[0]}`
  }

  const embeddings = await generateEmbeddings(chunks)

  const rows = chunks.map((chunk, i) => ({
    user_id: args.userId,
    type: args.type,
    title: i === 0 ? args.title : `${args.title} (Part ${i + 1})`,
    content: i === 0 ? args.content : chunk, // store original content for first chunk
    tags: args.tags || [],
    embedding: embeddings && embeddings[i] ? `[${embeddings[i].join(',')}]` : null,
    chunk_index: i,
  }))

  const { error } = await admin.from('ai_knowledge_base').insert(rows)

  if (error) return { success: false, error: error.message }
  return { success: true, chunkCount: chunks.length }
}
