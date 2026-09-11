-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: record whether a subscription is billed monthly or annually
--
-- Two plans now exist (£19.99/month and £215.88/year). The webhook reads the
-- interval from the Stripe subscription itself, so a plan switched inside the
-- billing portal is recorded correctly; the Billing page uses it to show the
-- right renewal wording.
--
-- Idempotent — safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_interval TEXT
  CHECK (billing_interval IN ('month', 'year'));
