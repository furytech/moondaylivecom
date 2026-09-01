ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS facebook_post text,
  ADD COLUMN IF NOT EXISTS pinterest_post text;