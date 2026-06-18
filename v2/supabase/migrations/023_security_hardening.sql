-- ============================================================
-- Security hardening: RLS policies, view access, function grants
-- ============================================================

-- C-1: Remove the permissive "Service role can insert messages" policy.
-- The service role bypasses RLS entirely and never needs a policy.
-- WITH CHECK (true) allows ANY user to insert messages into ANY
-- conversation — impersonating customers, forging agent replies, etc.
-- The existing "Users can view own messages" FOR ALL policy already
-- provides safe INSERT via conversation-ownership WITH CHECK.
DROP POLICY IF EXISTS "Service role can insert messages" ON messages;

-- C-2: Set security_invoker on the coexistence view so RLS on the
-- underlying tables applies. Without this, the view runs as the
-- postgres owner and any authenticated user querying it sees ALL
-- coexistence users' PII (names, emails, phone_number_ids).
ALTER VIEW v_coexistence_users SET (security_invoker = true);

-- C-3: Revoke PUBLIC/anon/authenticated EXECUTE on SECURITY DEFINER
-- functions that should only be called internally (by triggers or
-- the service role). Without these revokes, any user can call them
-- via PostgREST RPC (/rpc/function_name).
REVOKE ALL ON FUNCTION handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION handle_new_user() FROM authenticated;

REVOKE ALL ON FUNCTION recompute_broadcast_counts(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION recompute_broadcast_counts(UUID) FROM anon;
REVOKE ALL ON FUNCTION recompute_broadcast_counts(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION recompute_broadcast_counts(UUID) TO service_role;

REVOKE ALL ON FUNCTION _bcast_bump(UUID, TEXT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION _bcast_bump(UUID, TEXT, INT) FROM anon;
REVOKE ALL ON FUNCTION _bcast_bump(UUID, TEXT, INT) FROM authenticated;

REVOKE ALL ON FUNCTION broadcast_recipient_aggregate_trigger() FROM PUBLIC;
REVOKE ALL ON FUNCTION broadcast_recipient_aggregate_trigger() FROM anon;
REVOKE ALL ON FUNCTION broadcast_recipient_aggregate_trigger() FROM authenticated;

-- M-5: Add column-name whitelist to _bcast_bump to prevent arbitrary
-- column updates via RPC. Combined with the REVOKE above, this is
-- defense-in-depth.
CREATE OR REPLACE FUNCTION public._bcast_bump(bid UUID, col TEXT, delta INT)
RETURNS VOID AS $$
BEGIN
  IF col NOT IN ('sent_count','delivered_count','read_count','replied_count','failed_count') THEN
    RAISE EXCEPTION 'Invalid column for _bcast_bump: %', col;
  END IF;
  EXECUTE format(
    'UPDATE broadcasts SET %I = GREATEST(0, %I + $1), updated_at = NOW() WHERE id = $2',
    col, col
  ) USING delta, bid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
