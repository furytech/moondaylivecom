CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Guides',
  excerpt text,
  content text NOT NULL DEFAULT '',
  keywords text[] DEFAULT '{}',
  read_time int NOT NULL DEFAULT 4,
  author text NOT NULL DEFAULT 'Moonday Live Team',
  status text NOT NULL DEFAULT 'draft',
  publish_at timestamptz,
  published_at timestamptz,
  featured boolean NOT NULL DEFAULT false,
  cta_type text NOT NULL DEFAULT 'none',
  image_url text,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
GRANT SELECT ON public.blog_posts TO anon;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published blog posts"
ON public.blog_posts
FOR SELECT
TO anon
USING (status = 'published');

CREATE POLICY "Authenticated users can read published posts"
ON public.blog_posts
FOR SELECT
TO authenticated
USING (status = 'published');

CREATE POLICY "Admins can manage blog posts"
ON public.blog_posts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();