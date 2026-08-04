ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, birthday, moon_sign, timezone)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'birthday','')::date,
    NULLIF(NEW.raw_user_meta_data->>'moon_sign',''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'timezone',''), 'UTC')
  )
  ON CONFLICT (user_id) DO UPDATE
    SET birthday = COALESCE(public.user_profiles.birthday, EXCLUDED.birthday),
        moon_sign = COALESCE(public.user_profiles.moon_sign, EXCLUDED.moon_sign),
        timezone = COALESCE(NULLIF(public.user_profiles.timezone, 'UTC'), EXCLUDED.timezone);
  RETURN NEW;
END;
$function$;