-- 036_payment_gate.sql
-- Drops the subscriptions table and moves subscription tracking
-- onto the existing profiles table as a single timestamp column.
-- After login, if subscription_expires_at is null or in the past,
-- the user is forced to a payment screen before entering the dashboard.

DROP TABLE IF EXISTS subscriptions CASCADE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
