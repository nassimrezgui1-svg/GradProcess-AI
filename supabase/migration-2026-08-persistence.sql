-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: cloud persistence for module results, gamification and tracker
-- Self-contained and idempotent — safe to run more than once, and safe on a
-- database that predates schema.sql (it creates any helpers it relies on).
--
-- Replaces the browser-local stores (gradprocess_scores, gradprocess_psych_log,
-- gradprocess_gamification, gradprocess_tracker, gradprocess_profile) so a
-- user's history follows their account across devices.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Helper: updated_at maintenance (older databases never had this) ──────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ── One row per completed activity, across every practice module ─────────────
CREATE TABLE IF NOT EXISTS public.module_results (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module     TEXT NOT NULL CHECK (module IN ('cv','star','video','psychometric')),
  score      INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  label      TEXT,                            -- competency, topic or test name
  detail     JSONB NOT NULL DEFAULT '{}',     -- full module-specific payload
  -- Stable client-generated id so a replayed sync updates rather than duplicates.
  client_id  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
-- Full (not partial) unique index: PostgREST/Supabase upsert with
-- onConflict "user_id,client_id" cannot target a partial index (SQLSTATE 42P10).
-- NULL client_ids never collide, so rows without one are unaffected.
DROP INDEX IF EXISTS public.module_results_client_unique;
CREATE UNIQUE INDEX IF NOT EXISTS module_results_client_unique
  ON public.module_results (user_id, client_id);
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
DROP TRIGGER IF EXISTS t_gamification_updated_at ON public.user_gamification;
CREATE TRIGGER t_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Tracker table (created here if this database never had it) ───────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company          TEXT NOT NULL,
  role             TEXT NOT NULL,
  sector           TEXT,
  department       TEXT,
  location         TEXT,
  work_type        TEXT CHECK (work_type IN ('Remote','Hybrid','On-site')),
  salary           TEXT,
  deadline         DATE,
  url              TEXT,
  job_description  TEXT,
  stage            TEXT NOT NULL DEFAULT 'saved' CHECK (stage IN (
    'saved','interested','preparing','applied','online_assessment',
    'psychometric','video_interview','first_interview','assessment_centre',
    'final_interview','offer','rejected','withdrawn'
  )),
  readiness_score  INTEGER CHECK (readiness_score BETWEEN 0 AND 100),
  ats_match        INTEGER CHECK (ats_match BETWEEN 0 AND 100),
  notes            TEXT DEFAULT '',
  recruiter_name   TEXT,
  recruiter_email  TEXT,
  following        BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS t_applications_updated_at ON public.applications;
CREATE TRIGGER t_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Carry the client-side fields the typed columns don't model (skills,
-- requirements, stage history, AI role breakdown, interview dates).
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS detail JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS client_id TEXT;
DROP INDEX IF EXISTS public.applications_client_unique;
CREATE UNIQUE INDEX IF NOT EXISTS applications_client_unique
  ON public.applications (user_id, client_id);

-- The tracker writes and deletes its own rows; the base schema only granted SELECT.
DROP POLICY IF EXISTS "applications_own" ON public.applications;
CREATE POLICY "applications_own" ON public.applications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Profile fields the onboarding form collects ──────────────────────────────
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS graduation_year_text TEXT;
