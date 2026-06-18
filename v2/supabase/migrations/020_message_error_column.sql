ALTER TABLE messages ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE broadcast_recipients ALTER COLUMN error_message DROP NOT NULL;
