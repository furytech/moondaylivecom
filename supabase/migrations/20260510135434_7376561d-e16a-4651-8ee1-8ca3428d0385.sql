
-- 1. Prevent privilege escalation on user_profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only the postgres/service_role bypasses RLS; this trigger fires for everyone.
  -- Block changes to privileged columns unless invoked by service_role.
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    IF NEW.is_subscriber IS DISTINCT FROM OLD.is_subscriber THEN
      RAISE EXCEPTION 'Not allowed to modify is_subscriber';
    END IF;
    IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
      RAISE EXCEPTION 'Not allowed to modify subscription_status';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Not allowed to modify user_id';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Not allowed to modify email';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trigger ON public.user_profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trigger
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2. Explicitly block SELECT on signups for anon/authenticated (defense-in-depth).
-- No SELECT policy already denies, but add a restrictive policy to make intent explicit.
CREATE POLICY "No client read access to signups"
ON public.signups
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (false);

-- 3. Revoke EXECUTE on SECURITY DEFINER helper functions from public roles.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;
