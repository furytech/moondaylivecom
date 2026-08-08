ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS reddit_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS reddit_scheduled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS reddit_posted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS substack_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS substack_scheduled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS substack_sent_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS blog_posts_reddit_schedule_idx
  ON public.blog_posts (reddit_status, reddit_scheduled_at);
CREATE INDEX IF NOT EXISTS blog_posts_substack_schedule_idx
  ON public.blog_posts (substack_status, substack_scheduled_at);