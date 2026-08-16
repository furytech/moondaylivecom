-- 1. Guest astrologer roster
CREATE TABLE public.guest_astrologers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  credentials text,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.guest_astrologers TO authenticated;
GRANT ALL ON public.guest_astrologers TO service_role;
GRANT SELECT ON public.guest_astrologers TO anon;

ALTER TABLE public.guest_astrologers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests can view their own profile"
  ON public.guest_astrologers FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view approved guest profiles"
  ON public.guest_astrologers FOR SELECT TO anon
  USING (approved = true);

CREATE POLICY "Guests can create their own profile"
  ON public.guest_astrologers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guests can update their own profile"
  ON public.guest_astrologers FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete guest profiles"
  ON public.guest_astrologers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_guest_astrologers_updated_at
  BEFORE UPDATE ON public.guest_astrologers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Guests must never flip their own approved flag
CREATE OR REPLACE FUNCTION public.prevent_guest_self_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approved IS DISTINCT FROM OLD.approved
     AND NOT public.has_role(auth.uid(), 'admin')
     AND current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Only an admin can approve a guest astrologer';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_guest_self_approval() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER guest_approval_guard
  BEFORE UPDATE ON public.guest_astrologers
  FOR EACH ROW EXECUTE FUNCTION public.prevent_guest_self_approval();

-- 2. Guest contributions
CREATE TABLE public.guest_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES public.guest_astrologers(id) ON DELETE CASCADE,
  blog_post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  transit_label text,
  transit_at timestamptz,
  input_mode text NOT NULL DEFAULT 'text',
  raw_text text,
  transcript text,
  audio_path text,
  status text NOT NULL DEFAULT 'draft',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX guest_contributions_guest_idx ON public.guest_contributions (guest_id);
CREATE INDEX guest_contributions_post_idx ON public.guest_contributions (blog_post_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_contributions TO authenticated;
GRANT ALL ON public.guest_contributions TO service_role;

ALTER TABLE public.guest_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests can view their own contributions"
  ON public.guest_contributions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR guest_id IN (SELECT id FROM public.guest_astrologers WHERE user_id = auth.uid())
  );

CREATE POLICY "Guests can create their own contributions"
  ON public.guest_contributions FOR INSERT TO authenticated
  WITH CHECK (
    guest_id IN (SELECT id FROM public.guest_astrologers WHERE user_id = auth.uid() AND approved = true)
  );

CREATE POLICY "Guests can edit their own open contributions"
  ON public.guest_contributions FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      status IN ('draft', 'submitted')
      AND guest_id IN (SELECT id FROM public.guest_astrologers WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR guest_id IN (SELECT id FROM public.guest_astrologers WHERE user_id = auth.uid())
  );

CREATE POLICY "Guests can delete their own drafts"
  ON public.guest_contributions FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      status = 'draft'
      AND guest_id IN (SELECT id FROM public.guest_astrologers WHERE user_id = auth.uid())
    )
  );

CREATE TRIGGER update_guest_contributions_updated_at
  BEFORE UPDATE ON public.guest_contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Traditional doctrine library
CREATE TABLE public.doctrine_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  subject text NOT NULL,
  qualifier text,
  tradition text NOT NULL DEFAULT 'hellenistic',
  meaning text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  source text,
  vetted boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX doctrine_entries_key_idx
  ON public.doctrine_entries (category, subject, COALESCE(qualifier, ''), tradition);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctrine_entries TO authenticated;
GRANT ALL ON public.doctrine_entries TO service_role;

ALTER TABLE public.doctrine_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read doctrine"
  ON public.doctrine_entries FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert doctrine"
  ON public.doctrine_entries FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update doctrine"
  ON public.doctrine_entries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete doctrine"
  ON public.doctrine_entries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_doctrine_entries_updated_at
  BEFORE UPDATE ON public.doctrine_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Guest attribution on posts
ALTER TABLE public.blog_posts
  ADD COLUMN guest_contribution_id uuid REFERENCES public.guest_contributions(id) ON DELETE SET NULL,
  ADD COLUMN guest_display_name text,
  ADD COLUMN guest_bio text;