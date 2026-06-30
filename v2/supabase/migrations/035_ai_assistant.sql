-- 035_ai_assistant.sql
-- Multilingual RAG AI Assistant with pgvector

-- Knowledge base table with vector embeddings
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('faq', 'policy', 'product', 'document', 'general')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  embedding vector(1024),
  chunk_index INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES ai_knowledge_base(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HNSW index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_ai_kb_embedding ON ai_knowledge_base USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX IF NOT EXISTS idx_ai_kb_user_id ON ai_knowledge_base(user_id);

ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own knowledge base" ON ai_knowledge_base FOR ALL USING (auth.uid() = user_id);

-- AI settings table
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  mode TEXT NOT NULL DEFAULT 'fallback_only' CHECK (mode IN ('all_messages', 'fallback_only')),
  custom_system_prompt TEXT,
  business_name TEXT,
  business_hours TEXT,
  escalation_phone TEXT,
  escalation_enabled BOOLEAN NOT NULL DEFAULT true,
  ai_paused_conversations UUID[] DEFAULT '{}',
  monthly_request_count INTEGER NOT NULL DEFAULT 0,
  monthly_prompt_tokens INTEGER NOT NULL DEFAULT 0,
  monthly_completion_tokens INTEGER NOT NULL DEFAULT 0,
  reset_at DATE NOT NULL DEFAULT (DATE_TRUNC('month', now())::date + INTERVAL '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own AI settings" ON ai_settings FOR ALL USING (auth.uid() = user_id);

-- Auto-create settings row when a new user signs up
INSERT INTO ai_settings (user_id) 
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM ai_settings)
ON CONFLICT DO NOTHING;

-- AI conversation logs
CREATE TABLE IF NOT EXISTS ai_conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  customer_message TEXT NOT NULL,
  ai_response TEXT,
  confidence_score FLOAT,
  retrieved_chunks JSONB,
  escalated BOOLEAN NOT NULL DEFAULT false,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  language_detected TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_conversation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_conversation_id ON ai_conversation_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_escalated ON ai_conversation_logs(escalated) WHERE escalated = true;

ALTER TABLE ai_conversation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own AI logs" ON ai_conversation_logs FOR SELECT USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE ai_knowledge_base;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_conversation_logs;
