-- ─────────────────────────────────────────────────────────────────────────────
-- GradProcess AI — Production Database Schema with Row Level Security
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- USER PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  university      TEXT,
  degree          TEXT,
  graduation_year INTEGER CHECK (graduation_year BETWEEN 2020 AND 2040),
  target_sector   TEXT,
  target_role     TEXT,
  target_companies TEXT[],
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  avatar_url      TEXT,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE TRIGGER t_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "profiles_own" ON public.user_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- USER SETTINGS & PRIVACY PREFERENCES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  save_recordings        BOOLEAN DEFAULT true,
  save_transcripts       BOOLEAN DEFAULT true,
  save_ai_reports        BOOLEAN DEFAULT true,
  allow_personalization  BOOLEAN DEFAULT true,
  allow_analytics        BOOLEAN DEFAULT false,
  email_reminders        BOOLEAN DEFAULT true,
  prep_email_digest      BOOLEAN DEFAULT false,
  cookie_consent         TEXT DEFAULT 'essential' CHECK (cookie_consent IN ('essential','all','custom')),
  cookie_consent_at      TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at             TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE TRIGGER t_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "settings_own" ON public.user_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONSENT RECORDS (append-only)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consent_records (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'recording','transcription','ai_analysis','body_language_beta',
    'marketing_emails','analytics','data_personalization','terms'
  )),
  granted      BOOLEAN NOT NULL,
  version      TEXT NOT NULL DEFAULT '1.0',
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent_select_own" ON public.consent_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "consent_insert_own" ON public.consent_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SUBSCRIPTIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id  TEXT,
  stripe_sub_id       TEXT,
  plan                TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','team')),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','trialing','past_due','cancelled','paused')),
  current_period_end  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE TRIGGER t_subs_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "subs_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CVs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cvs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  content_text  TEXT,
  version       INTEGER DEFAULT 1,
  is_primary    BOOLEAN DEFAULT false,
  file_size     INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE TRIGGER t_cvs_updated_at BEFORE UPDATE ON public.cvs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "cvs_own" ON public.cvs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- APPLICATION TRACKER
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE OR REPLACE TRIGGER t_apps_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "apps_own" ON public.applications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.application_stage_history (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage          TEXT NOT NULL,
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.application_stage_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stage_hist_own" ON public.application_stage_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.role_breakdowns (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  breakdown_json JSONB NOT NULL,
  model_version  TEXT DEFAULT 'claude-sonnet-4-6',
  generated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.role_breakdowns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "breakdowns_own" ON public.role_breakdowns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- INTERVIEW SESSIONS & RECORDINGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sector               TEXT,
  role                 TEXT,
  mode                 TEXT,
  difficulty           TEXT,
  question_count       INTEGER,
  overall_score        INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  content_score        INTEGER,
  star_score           INTEGER,
  delivery_score       INTEGER,
  commercial_score     INTEGER,
  communication_score  INTEGER,
  filler_words         INTEGER DEFAULT 0,
  avg_wpm              INTEGER,
  duration_secs        INTEGER,
  report_json          JSONB,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE TRIGGER t_iv_sessions_updated_at BEFORE UPDATE ON public.interview_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "iv_sessions_own" ON public.interview_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.interview_answers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_no INTEGER NOT NULL,
  question    TEXT NOT NULL,
  transcript  TEXT,
  analysis    JSONB,
  score       INTEGER CHECK (score BETWEEN 0 AND 100),
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iv_answers_own" ON public.interview_answers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SENSITIVE: interview recordings — signed URLs only, never public links
CREATE TABLE IF NOT EXISTS public.interview_recordings (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id           UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path         TEXT NOT NULL,
  file_size            INTEGER,
  duration_secs        INTEGER,
  mime_type            TEXT,
  recording_consent_at TIMESTAMPTZ NOT NULL,
  deleted_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.interview_recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recordings_own" ON public.interview_recordings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PSYCHOMETRIC RESULTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.psychometric_results (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_name  TEXT NOT NULL,
  score      INTEGER CHECK (score BETWEEN 0 AND 100),
  percentile INTEGER CHECK (percentile BETWEEN 0 AND 100),
  answers    JSONB,
  feedback   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.psychometric_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psych_own" ON public.psychometric_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT LOGS (append-only — no UPDATE or DELETE policy for users)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   UUID,
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select_own"     ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "audit_insert_service" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_applications_user_stage  ON public.applications(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_applications_deadline    ON public.applications(deadline);
CREATE INDEX IF NOT EXISTS idx_iv_sessions_user         ON public.interview_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_iv_answers_session       ON public.interview_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_recordings_user          ON public.interview_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_psych_user               ON public.psychometric_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_created       ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_user_type        ON public.consent_records(user_id, consent_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUTO-PROVISION SETTINGS + FREE SUBSCRIPTION ON SIGNUP
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.subscriptions (user_id, plan, status) VALUES (NEW.id, 'free', 'active') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKET POLICIES (configure in Supabase Dashboard → Storage)
-- ─────────────────────────────────────────────────────────────────────────────
-- Create these buckets as PRIVATE:
--   cvs, interview-recordings, avatars
--
-- For each bucket, add policies so only the file owner can access:
--   INSERT: (auth.uid()::text) = (storage.foldername(name))[1]
--   SELECT: (auth.uid()::text) = (storage.foldername(name))[1]
--   DELETE: (auth.uid()::text) = (storage.foldername(name))[1]
--
-- File paths should follow: {bucket}/{user_id}/{resource_id}/{filename}
-- Generate signed URLs server-side with a short TTL (60-300 seconds).
