-- Add first_name column to user_profiles table
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS first_name text;

-- Update handle_new_user trigger function to capture first_name from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, first_name, birthday, moon_sign, timezone)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'first_name',''),
    NULLIF(NEW.raw_user_meta_data->>'birthday','')::date,
    NULLIF(NEW.raw_user_meta_data->>'moon_sign',''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'timezone',''), 'UTC')
  )
  ON CONFLICT (user_id) DO UPDATE
    SET first_name = COALESCE(public.user_profiles.first_name, EXCLUDED.first_name),
        birthday = COALESCE(public.user_profiles.birthday, EXCLUDED.birthday),
        moon_sign = COALESCE(public.user_profiles.moon_sign, EXCLUDED.moon_sign),
        timezone = COALESCE(NULLIF(public.user_profiles.timezone, 'UTC'), EXCLUDED.timezone);
  RETURN NEW;
END;
$function$;
