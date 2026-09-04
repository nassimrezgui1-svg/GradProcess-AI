-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: repair signup on databases missing public.user_settings
--
-- handle_new_user() inserts into user_profiles, user_settings and
-- subscriptions. On the resumed production project user_settings had never
-- been created, so every INSERT INTO auth.users aborted and signup failed with
-- "Database error saving new user".
--
-- Two fixes: create the missing table, and make the trigger resilient so a
-- failure in any single ancillary insert can never block account creation
-- again — it warns in the Postgres log instead.
--
-- Idempotent and self-contained.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.user_settings (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
DROP POLICY IF EXISTS "settings_own" ON public.user_settings;
CREATE POLICY "settings_own" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS t_settings_updated_at ON public.user_settings;
CREATE TRIGGER t_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill rows for accounts created while the table was missing.
INSERT INTO public.user_settings (user_id)
SELECT u.id FROM auth.users u
LEFT JOIN public.user_settings s ON s.user_id = u.id
WHERE s.user_id IS NULL;

-- Resilient trigger: account creation must never fail because of a
-- supporting row. Each insert is isolated so one failure warns rather
-- than aborting the whole auth.users insert.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.user_profiles (user_id, name, email)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), NEW.email),
      NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: user_profiles insert failed: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO public.user_settings (user_id) VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: user_settings insert failed: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO public.subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: subscriptions insert failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
