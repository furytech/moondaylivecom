-- 1. Create combination_profiles table for 144 Sun/Moon archetype matrices
CREATE TABLE IF NOT EXISTS public.combination_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sun_sign text NOT NULL,
  moon_sign text NOT NULL,
  combination_title text NOT NULL,
  solar_essence text NOT NULL,
  lunar_essence text NOT NULL,
  combination_synthesis text NOT NULL,
  default_behaviors jsonb NOT NULL DEFAULT '[]'::jsonb,
  shadow_pattern text,
  upgrade_teaser text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_combination_sun_moon UNIQUE (sun_sign, moon_sign)
);

-- 2. Performance index for sub-millisecond signup lookups
CREATE INDEX IF NOT EXISTS idx_combination_profiles_lookup 
ON public.combination_profiles (sun_sign, moon_sign);

-- 3. Grants & Permissions
GRANT SELECT ON public.combination_profiles TO anon, authenticated;
GRANT ALL ON public.combination_profiles TO authenticated;
GRANT ALL ON public.combination_profiles TO service_role;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.combination_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Public read access for combination profiles" ON public.combination_profiles;
CREATE POLICY "Public read access for combination profiles"
ON public.combination_profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Admin full access
DROP POLICY IF EXISTS "Admin write access for combination profiles" ON public.combination_profiles;
CREATE POLICY "Admin write access for combination profiles"
ON public.combination_profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Add natal_sun_sign and natal_moon_sign columns to user_profiles if missing
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS natal_sun_sign text,
ADD COLUMN IF NOT EXISTS natal_moon_sign text;

-- 6. Updated_at trigger
DROP TRIGGER IF EXISTS update_combination_profiles_updated_at ON public.combination_profiles;
CREATE TRIGGER update_combination_profiles_updated_at
BEFORE UPDATE ON public.combination_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
