-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: cloud persistence for module results, gamification and tracker
-- Idempotent — safe to run more than once.
--
-- Replaces the browser-local stores (gradprocess_scores, gradprocess_psych_log,
-- gradprocess_gamification, gradprocess_tracker, gradprocess_profile) so a
-- user's history follows their account across devices.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── One row per completed activity, across every practice module ─────────────
CREATE TABLE IF NOT EXISTS public.module_results (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module     TEXT NOT NULL CHECK (module IN ('cv','star','video','psychometric')),
  score      INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  label      TEXT,                            -- competency, topic or test name
  detail     JSONB NOT NULL DEFAULT '{}',     -- full module-specific payload
  -- Stable client-generated id so a replayed sync updates rather than duplicates.
  client_id  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS module_results_client_unique
  ON public.module_results (user_id, client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS module_results_user_module_idx
  ON public.module_results (user_id, module, created_at DESC);

ALTER TABLE public.module_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "module_results_own" ON public.module_results;
CREATE POLICY "module_results_own" ON public.module_results
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── XP, level and streak state (one row per user) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_gamification (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp            INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level         INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  streak_days   INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  last_activity DATE,
  state         JSONB NOT NULL DEFAULT '{}',  -- badges, completed challenges, xpByCategory
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gamification_own" ON public.user_gamification;
CREATE POLICY "gamification_own" ON public.user_gamification
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER t_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Tracker: carry the client-side fields the columns don't model ────────────
-- (skills, responsibilities, requirements, stage history, AI role breakdown,
--  interview dates) without reshaping the existing typed columns.
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS detail JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS client_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS applications_client_unique
  ON public.applications (user_id, client_id) WHERE client_id IS NOT NULL;

-- The tracker writes and deletes its own rows; the base schema only granted SELECT.
DROP POLICY IF EXISTS "applications_own" ON public.applications;
CREATE POLICY "applications_own" ON public.applications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Profile fields the onboarding form collects ──────────────────────────────
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS graduation_year_text TEXT;
