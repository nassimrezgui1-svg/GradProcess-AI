-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: let the subscriptions.plan constraint accept what the code writes
--
-- A real customer paid and was left locked out. The Stripe webhook writes
-- plan = 'pro', but this database's CHECK constraint only allowed
-- ('free','premium') — it predates the repo schema. Every webhook write was
-- rejected, so the payment never reached the app and the account stayed
-- 'incomplete'. This would have happened to every customer.
--
-- 'premium' is kept so any existing row using it stays valid.
--
-- Idempotent — safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'pro', 'team', 'premium'));

-- user_profiles.plan is written by the same webhook; keep the two in step.
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_plan_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_plan_check
  CHECK (plan IN ('free', 'pro', 'team', 'premium'));

-- Repair anyone already paying whose row never received their subscription.
-- Access is decided by status, so this is what actually restores them.
UPDATE public.subscriptions
SET plan = 'pro'
WHERE status IN ('active', 'trialing')
  AND stripe_subscription_id IS NOT NULL
  AND plan = 'free';
