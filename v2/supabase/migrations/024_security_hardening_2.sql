-- ============================================================
-- Security hardening round 2
-- ============================================================

-- Atomic unread_count increment via RPC (replaces read-modify-write
-- in the webhook that lost counts under concurrency).
CREATE OR REPLACE FUNCTION increment_unread(conv_id UUID)
RETURNS void AS $$
  UPDATE conversations
  SET unread_count = unread_count + 1,
      updated_at = NOW()
  WHERE id = conv_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION increment_unread(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION increment_unread(UUID) FROM anon;
REVOKE ALL ON FUNCTION increment_unread(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION increment_unread(UUID) TO service_role;

-- Contact notes RLS: verify the referenced contact belongs to the
-- same user, preventing notes attached to other users' contacts.
DROP POLICY IF EXISTS "Users can manage own notes" ON contact_notes;
CREATE POLICY "Users can manage own notes" ON contact_notes FOR ALL
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_notes.contact_id
      AND contacts.user_id = auth.uid()
    )
  );
