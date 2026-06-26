-- 034_agent_heartbeat.sql
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS agent_last_active_at TIMESTAMPTZ;
