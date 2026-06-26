-- 033_admin_device_tokens.sql
-- FCM device tokens for admin support app push notifications

CREATE TABLE IF NOT EXISTS admin_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  agent_name TEXT NOT NULL DEFAULT 'Support Agent',
  device_info TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_device_tokens_active ON admin_device_tokens(is_active) WHERE is_active = true;
