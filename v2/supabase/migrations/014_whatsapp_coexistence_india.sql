-- ============================================================
-- Migration 014: WhatsApp Business App + API Coexistence (India)
--
-- Purpose:
--   Adds support for Meta's India-specific "Coexistence" feature
--   that allows a single WhatsApp Business number to operate on
--   both the mobile App and the Cloud API simultaneously.
--
--   This is critical for SMBs who start on the mobile app and
--   migrate to CRM automation without losing historical data or
--   voice/video calling capability.
--
-- What changes:
--   1. whatsapp_config.coexistence_mode — boolean flag
--   2. whatsapp_config.coexistence_region — tracks region (e.g. 'india')
--   3. whatsapp_config.app_history_synced_at — when historical import ran
--   4. app_migration_imports table — tracks per-contact import status
--   5. messages.source — tracks whether message came from 'webhook' or 'app_import'
--
-- Idempotent — safe to run multiple times.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Extend whatsapp_config
-- ------------------------------------------------------------

-- coexistence_mode: is this number running in App+API parallel mode?
ALTER TABLE whatsapp_config
  ADD COLUMN IF NOT EXISTS coexistence_mode BOOLEAN NOT NULL DEFAULT FALSE;

-- coexistence_region: which regional pilot / policy applies
ALTER TABLE whatsapp_config
  ADD COLUMN IF NOT EXISTS coexistence_region TEXT DEFAULT NULL;

-- app_history_synced_at: timestamp of the last historical data import
ALTER TABLE whatsapp_config
  ADD COLUMN IF NOT EXISTS app_history_synced_at TIMESTAMPTZ DEFAULT NULL;

-- ------------------------------------------------------------
-- 2. Track message source (webhook vs manual import)
-- ------------------------------------------------------------

-- Add a source column to messages so the UI can distinguish
-- real-time webhook messages from imported App history.
-- Default existing rows to 'webhook' so nothing breaks.
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'webhook'
  CHECK (source IN ('webhook', 'app_import', 'manual'));

-- Index for filtering imported vs live messages efficiently
CREATE INDEX IF NOT EXISTS idx_messages_source ON messages(source);

-- ------------------------------------------------------------
-- 3. App migration imports tracking table
--
-- When a user migrates from the WhatsApp Business App,
-- they export their chat history (via Google Drive backup,
-- iTunes backup, or BSP-provided sync). This table tracks
-- which contacts / conversations have been imported so we
-- can resume interrupted imports and avoid duplicates.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app_migration_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The phone number of the contact whose history was imported
  contact_phone TEXT NOT NULL,
  -- Number of messages imported for this contact
  messages_imported INTEGER NOT NULL DEFAULT 0,
  -- Earliest message timestamp in the import batch
  import_start_date TIMESTAMPTZ,
  -- Latest message timestamp in the import batch
  import_end_date TIMESTAMPTZ,
  -- Status: pending / in_progress / completed / failed
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  -- Error message if failed
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- A user should not have duplicate imports for the same contact phone
  UNIQUE(user_id, contact_phone)
);

CREATE INDEX IF NOT EXISTS idx_app_migration_imports_user_id
  ON app_migration_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_app_migration_imports_status
  ON app_migration_imports(status);

ALTER TABLE app_migration_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own app imports" ON app_migration_imports;
CREATE POLICY "Users can manage own app imports"
  ON app_migration_imports FOR ALL
  USING (auth.uid() = user_id);

-- Apply updated_at trigger (idempotent — already defined in migration 001)
DROP TRIGGER IF EXISTS set_updated_at ON app_migration_imports;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON app_migration_imports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 4. Helper view: show which users have coexistence enabled
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW v_coexistence_users AS
SELECT
  p.id AS profile_id,
  p.user_id,
  p.full_name,
  p.email,
  wc.phone_number_id,
  wc.coexistence_mode,
  wc.coexistence_region,
  wc.app_history_synced_at,
  wc.status AS whatsapp_status,
  wc.connected_at
FROM profiles p
LEFT JOIN whatsapp_config wc ON wc.user_id = p.user_id
WHERE wc.coexistence_mode = TRUE;

-- ------------------------------------------------------------
-- 5. Comment/documentation on the table
-- ------------------------------------------------------------

COMMENT ON COLUMN whatsapp_config.coexistence_mode IS
  'When TRUE, this number operates on both WhatsApp Business App (mobile) and Cloud API simultaneously. Currently supported in India (2026). Calls remain on the App; automation runs through the API.';

COMMENT ON COLUMN whatsapp_config.coexistence_region IS
  'Region code for the coexistence pilot (e.g. "india"). Used to show region-specific UI help and handle regional policy differences.';

COMMENT ON COLUMN whatsapp_config.app_history_synced_at IS
  'Timestamp when the last historical Business App chat history import completed. NULL if never imported.';

COMMENT ON COLUMN messages.source IS
  'Origin of the message row: webhook (real-time API event), app_import (historical import from Business App backup), or manual (user-created in CRM).';

COMMENT ON TABLE app_migration_imports IS
  'Tracks per-contact historical chat imports when a user migrates their WhatsApp Business App data into the CRM. Prevents duplicate imports and allows resuming interrupted batches.';
