-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: August 2026 audit fixes (idempotent)
-- Safe to run on any schema state — guards make every statement a no-op when
-- the target state already exists. New projects created from schema.sql do not
-- need this file.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. subscriptions: align column names with the Stripe webhook
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='subscriptions'
             AND column_name='stripe_sub_id') THEN
    ALTER TABLE public.subscriptions RENAME COLUMN stripe_sub_id TO stripe_subscription_id;
  END IF;
END $$;

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- 2. Widen status CHECK to include Stripe's raw subscription statuses
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (status IN (
  'active','trialing','past_due','cancelled','paused',
  'canceled','incomplete','incomplete_expired','unpaid'
));

-- 3. user_profiles: plan column the webhook syncs
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free','pro','team'));

-- 4. RLS: let the authed checkout route store the caller's own Stripe customer id
DROP POLICY IF EXISTS "subs_insert_own" ON public.subscriptions;
CREATE POLICY "subs_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subs_update_own" ON public.subscriptions;
CREATE POLICY "subs_update_own" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
