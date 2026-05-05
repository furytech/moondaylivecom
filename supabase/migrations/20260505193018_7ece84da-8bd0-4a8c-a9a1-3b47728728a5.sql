
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, birthday, moon_sign)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'birthday','')::date,
    NULLIF(NEW.raw_user_meta_data->>'moon_sign','')
  )
  ON CONFLICT (user_id) DO UPDATE
    SET birthday = COALESCE(public.user_profiles.birthday, EXCLUDED.birthday),
        moon_sign = COALESCE(public.user_profiles.moon_sign, EXCLUDED.moon_sign);
  RETURN NEW;
END;
$function$;

-- Backfill existing users whose metadata has birthday/moon_sign but profile doesn't
UPDATE public.user_profiles p
SET birthday = NULLIF(u.raw_user_meta_data->>'birthday','')::date,
    moon_sign = NULLIF(u.raw_user_meta_data->>'moon_sign','')
FROM auth.users u
WHERE p.user_id = u.id
  AND p.moon_sign IS NULL
  AND u.raw_user_meta_data->>'moon_sign' IS NOT NULL;
