-- Remove the legacy signup-time Blueprint email trigger. The email is now sent
-- by on_auth_user_email_confirmed (after email confirmation, once per user).
DROP TRIGGER IF EXISTS blueprint_email_on_natal_signs ON public.user_profiles;
DROP FUNCTION IF EXISTS public.trigger_blueprint_email();
