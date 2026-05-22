-- Trigger function: prevent updates to birthday once it is non-null
CREATE OR REPLACE FUNCTION public.prevent_birthday_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role to correct birthdays via support
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    IF OLD.birthday IS NOT NULL AND NEW.birthday IS DISTINCT FROM OLD.birthday THEN
      RAISE EXCEPTION 'Birthday is locked once set. Contact support to correct birth data.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_birthday_after_set ON public.user_profiles;

CREATE TRIGGER lock_birthday_after_set
BEFORE UPDATE OF birthday ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_birthday_update();