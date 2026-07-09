
-- Admin role infrastructure
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Node 1: cosmic_weather
CREATE TABLE public.cosmic_weather (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_timestamp timestamptz NOT NULL,
  sun_sign_tropical text,
  sun_sign_sidereal text,
  moon_sign_tropical text,
  moon_sign_sidereal text,
  moon_sign_draconic text,
  is_processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cosmic_weather TO authenticated;
GRANT ALL ON public.cosmic_weather TO service_role;

ALTER TABLE public.cosmic_weather ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view cosmic_weather"
  ON public.cosmic_weather FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert cosmic_weather"
  ON public.cosmic_weather FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cosmic_weather"
  ON public.cosmic_weather FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cosmic_weather"
  ON public.cosmic_weather FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_cosmic_weather_updated_at
  BEFORE UPDATE ON public.cosmic_weather
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Node 2: content_drafts
CREATE TABLE public.content_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cosmic_weather_id uuid NOT NULL REFERENCES public.cosmic_weather(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending_review',
  app_atmospheric_text text,
  app_experiential_text text,
  reddit_payload jsonb,
  substack_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.content_drafts TO authenticated;
GRANT ALL ON public.content_drafts TO service_role;

ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view content_drafts"
  ON public.content_drafts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert content_drafts"
  ON public.content_drafts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update content_drafts"
  ON public.content_drafts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete content_drafts"
  ON public.content_drafts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_content_drafts_cosmic_weather_id ON public.content_drafts(cosmic_weather_id);

CREATE TRIGGER update_content_drafts_updated_at
  BEFORE UPDATE ON public.content_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Node 3: user_natal_profiles
CREATE TABLE public.user_natal_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  natal_moon_tropical text,
  natal_moon_sidereal text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_natal_profiles TO authenticated;
GRANT ALL ON public.user_natal_profiles TO service_role;

ALTER TABLE public.user_natal_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own natal profile"
  ON public.user_natal_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own natal profile"
  ON public.user_natal_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own natal profile"
  ON public.user_natal_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_natal_profiles_updated_at
  BEFORE UPDATE ON public.user_natal_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
