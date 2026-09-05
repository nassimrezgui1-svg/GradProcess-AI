-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: stop storing the email address as a user's display name
--
-- handle_new_user() fell back to NEW.email when signup metadata had no "name",
-- so Settings → Full Name showed the account's email. Google SSO also puts the
-- display name under "full_name", which the old COALESCE never looked at.
--
-- Now: try name, then full_name, then the Google "given_name family_name"
-- pair, and otherwise leave the field empty so the UI can prompt for it
-- rather than presenting an email as if it were a name.
--
-- Idempotent — safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  resolved_name TEXT;
BEGIN
  resolved_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(CONCAT_WS(' ',
      NULLIF(TRIM(NEW.raw_user_meta_data->>'given_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'family_name'), '')
    )), ''),
    ''  -- never the email: an empty name lets the UI ask for a real one
  );

  BEGIN
    INSERT INTO public.user_profiles (user_id, name, email)
    VALUES (NEW.id, resolved_name, NEW.email)
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

-- Repair existing rows: where the stored name is just the email, recover a real
-- name from auth metadata if one exists, otherwise blank it so the UI prompts.
UPDATE public.user_profiles p
SET name = COALESCE(
  NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''),
  NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
  NULLIF(TRIM(CONCAT_WS(' ',
    NULLIF(TRIM(u.raw_user_meta_data->>'given_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'family_name'), '')
  )), ''),
  ''
)
FROM auth.users u
WHERE u.id = p.user_id
  AND LOWER(TRIM(p.name)) = LOWER(TRIM(p.email));
