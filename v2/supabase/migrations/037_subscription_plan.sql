-- 037_subscription_plan.sql
-- Adds subscription_plan to profiles so the dashboard can show
-- the current plan (monthly/quarterly/yearly) and compute renewal alerts.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
COMMENT ON COLUMN profiles.subscription_plan IS 'Plan type: monthly, quarterly, or yearly';
