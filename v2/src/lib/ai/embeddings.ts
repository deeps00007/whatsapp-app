const JINA_API_URL = 'https://api.jina.ai/v1/embeddings'

/**
 * Generate embedding for a text using Jina AI jina-embeddings-v3.
 * Multilingual — supports Hindi, Tamil, Telugu, Bengali, English, Hinglish, etc.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.JINA_API_KEY
  if (!apiKey) {
    console.error('[jina] JINA_API_KEY not configured')
    return null
  }

  try {
    const res = await fetch(JINA_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v3',
        input: [text.slice(0, 8000)],
        tasks: ['text-matching'],
        dimensions: 1024,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[jina] Embedding API error:', res.status, text)
      return null
    }

    const data = await res.json()
    if (data.data?.[0]?.embedding) {
      return data.data[0].embedding as number[]
    }

    return null
  } catch (err) {
    console.error('[jina] Embedding request failed:', err)
    return null
  }
}

/**
 * Generate embeddings for multiple texts in a single API call.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][] | null> {
  const apiKey = process.env.JINA_API_KEY
  if (!apiKey) {
    console.error('[jina] JINA_API_KEY not configured')
    return null
  }

  try {
    const res = await fetch(JINA_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v3',
        input: texts.map(t => t.slice(0, 8000)),
        tasks: texts.map(() => 'text-matching'),
        dimensions: 1024,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[jina] Batch embedding API error:', res.status, errText)
      return null
    }

    const data = await res.json()
    if (data.data) {
      return data.data.map((d: { embedding: number[] }) => d.embedding as number[])
    }

    return null
  } catch (err) {
    console.error('[jina] Batch embedding request failed:', err)
    return null
  }
}
