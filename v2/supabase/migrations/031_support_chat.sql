-- 031_support_chat.sql
-- Real-time chat support tables for Grow by Chat SaaS

CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'agent_assigned', 'resolved', 'closed')),
  assigned_agent TEXT,
  subject TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'bot')),
  sender_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_id ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_conversations_user_id ON support_conversations(user_id);

ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own support conversations"
  ON support_conversations FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own support conversations"
  ON support_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own support conversations"
  ON support_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_conversations c
      WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR c.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON support_messages FOR INSERT
  WITH CHECK (
    sender_type IN ('user', 'bot') AND
    EXISTS (
      SELECT 1 FROM support_conversations c
      WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR c.user_id IS NULL)
    )
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE support_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
