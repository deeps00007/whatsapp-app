-- Performance indexes: critical tables that had no user_id index
CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON message_templates (user_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_user_id ON pipelines (user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_user_id ON custom_fields (user_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_conversations_user_status ON conversations (user_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_user_last_message ON conversations (user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_user_phone ON contacts (user_id, phone);
CREATE INDEX IF NOT EXISTS idx_broadcasts_user_status ON broadcasts (user_id, status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_user_scheduled ON broadcasts (user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_flow_runs_user_contact ON flow_runs (user_id, contact_id);

-- Fix: UNIQUE on phone_number_id should be partial (exclude 'pending')
-- Drop the full unique constraint and replace with partial
ALTER TABLE whatsapp_config DROP CONSTRAINT IF EXISTS whatsapp_config_phone_number_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_config_phone_number_id_unique
  ON whatsapp_config (phone_number_id)
  WHERE phone_number_id IS NOT NULL AND phone_number_id != '';

-- Fix: conversations needs unique per user+contact to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_user_contact
  ON conversations (user_id, contact_id);

-- Fix: message_templates needs unique per user+name+language
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_templates_user_name_lang
  ON message_templates (user_id, name, COALESCE(language, 'en_US'));
