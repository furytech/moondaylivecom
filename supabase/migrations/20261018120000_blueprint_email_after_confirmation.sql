-- ======================================================================
-- Migration: 20261018120000_blueprint_email_after_confirmation.sql
-- Description: Send the Blueprint email only after the user confirms their
-- email address, exactly once per user.
--   * user_profiles.blueprint_email_sent_at = once-only guard
--   * trigger on auth.users fires when email_confirmed_at goes NULL -> value
--     (or a user is created already confirmed) and calls send-blueprint-email
-- ======================================================================

-- 1. Once-only guard column
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS blueprint_email_sent_at timestamptz;

-- Everyone who exists today has either already received the email or is
-- covered by the legacy flow; never send retroactively.
UPDATE public.user_profiles
SET blueprint_email_sent_at = now()
WHERE blueprint_email_sent_at IS NULL;

-- 2. Shared secret between the trigger and the edge function
INSERT INTO public.cron_secrets (name, secret_value)
VALUES ('send-blueprint-email', gen_random_uuid()::text)
ON CONFLICT (name) DO NOTHING;

-- 3. Trigger function: runs on email confirmation, never blocks auth
CREATE OR REPLACE FUNCTION public.notify_blueprint_email_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.email_confirmed_at IS NULL) THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/functions/v1/send-blueprint-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Cron-Secret', (SELECT secret_value FROM public.cron_secrets WHERE name = 'send-blueprint-email')
        ),
        body := jsonb_build_object(
          'type', 'EMAIL_CONFIRMED',
          'user_id', NEW.id,
          'email', NEW.email
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'send-blueprint-email trigger failed for %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed
AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.notify_blueprint_email_on_confirm();
