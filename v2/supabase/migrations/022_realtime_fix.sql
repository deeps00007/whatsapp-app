-- ============================================================
-- Fix Supabase Realtime for webhook-inserted rows
-- ============================================================
-- REPLICA IDENTITY FULL ensures every Realtime event carries the
-- complete row, not just changed columns. This fixes:
--   - Message status updates wiping content_text
--   - Conversation updates missing contact join data
--   - Broadcast recipient updates missing error_message
--
-- On Supabase Cloud, the Realtime role grants are managed
-- automatically — no manual GRANT needed. The REPLICA IDENTITY
-- change is the critical fix for partial payload issues.

DO $$
BEGIN
  ALTER TABLE messages REPLICA IDENTITY FULL;
  ALTER TABLE conversations REPLICA IDENTITY FULL;
  ALTER TABLE contacts REPLICA IDENTITY FULL;
  ALTER TABLE whatsapp_config REPLICA IDENTITY FULL;
  ALTER TABLE message_templates REPLICA IDENTITY FULL;
  ALTER TABLE broadcasts REPLICA IDENTITY FULL;
  ALTER TABLE broadcast_recipients REPLICA IDENTITY FULL;
  ALTER TABLE message_reactions REPLICA IDENTITY FULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'REPLICA IDENTITY change skipped: %', SQLERRM;
END
$$;
