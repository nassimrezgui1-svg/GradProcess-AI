-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: give every application a stable client_id
--
-- The tracker round-trips rows by client_id. Rows written before that column
-- existed have client_id = NULL, so pulling one down yields the database UUID
-- as its id, and pushing it back inserts a *second* row keyed by that UUID —
-- the same application then renders as two identical cards.
--
-- Backfilling client_id from the primary key makes the round-trip stable, and
-- the duplicates it already produced are removed below (oldest row wins).
--
-- Idempotent — safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Remove rows that duplicate an existing application for the same user.
--    Keeps the earliest created row of each (user, company, role, stage) group.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, LOWER(TRIM(company)), LOWER(TRIM(role)), stage
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.applications
)
DELETE FROM public.applications a
USING ranked r
WHERE a.id = r.id AND r.rn > 1;

-- 2. Give any remaining row without a client_id a stable one.
UPDATE public.applications
SET client_id = id::text
WHERE client_id IS NULL;
