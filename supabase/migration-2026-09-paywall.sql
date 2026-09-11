-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: require payment before the product can be used
--
-- New accounts were created with status 'active' on the free plan, and the
-- access check only looks at status — so every free signup passed the paywall
-- and got the full product. New subscriptions now start 'incomplete', which
-- fails that check until Stripe reports a payment.
--
-- Existing rows are deliberately left alone: anyone who signed up before this
-- runs already carries 'active' and keeps their access (grandfathered).
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
    ''
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
    -- 'incomplete' = account created, nothing paid for yet. The access check
    -- treats anything other than active/trialing as no access.
    INSERT INTO public.subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'free', 'incomplete')
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

-- Change the column default too, so a row inserted by any other path is also
-- unpaid until proven otherwise.
ALTER TABLE public.subscriptions ALTER COLUMN status SET DEFAULT 'incomplete';

-- Safety net: an account with no subscription row at all would be blocked by
-- the fail-closed check, which is correct but confusing. Give every existing
-- account a row, marked active so nobody already using the product loses it.
INSERT INTO public.subscriptions (user_id, plan, status)
SELECT u.id, 'free', 'active'
FROM auth.users u
LEFT JOIN public.subscriptions s ON s.user_id = u.id
WHERE s.user_id IS NULL;
