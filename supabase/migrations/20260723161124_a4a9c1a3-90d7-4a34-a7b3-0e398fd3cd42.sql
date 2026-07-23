ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS zodiac_sign_tag TEXT,
  ADD COLUMN IF NOT EXISTS constellation_graphic_path TEXT;