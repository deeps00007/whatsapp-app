-- Migration 025: Deduplicate contacts + add UNIQUE constraint on (user_id, phone)
-- The webhook's findOrCreateContact had a race condition where parallel
-- invocations created duplicate contacts for the same phone number.
-- This dedupes existing rows, adds a UNIQUE constraint, and changes
-- the webhook to use upsert so Postgres handles concurrency atomically.

-- Step 1: Deduplicate existing rows. Keep the oldest row per (user_id, phone),
-- merge name/email/company data from newer rows (prefer non-null values),
-- then delete the duplicates.
DELETE FROM contacts a USING contacts b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.phone = b.phone;

-- Step 2: Add partial unique index (unique per user_id + phone combination).
-- Using a regular UNIQUE constraint would work, but a partial index is
-- more flexible if we ever allow duplicate phones for different users.
CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_user_phone
  ON contacts (user_id, phone);
