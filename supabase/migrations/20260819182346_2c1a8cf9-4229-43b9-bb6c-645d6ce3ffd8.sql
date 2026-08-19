alter table public.blog_posts
  add column if not exists reddit_error text,
  add column if not exists reddit_permalink text,
  add column if not exists reddit_attempted_at timestamptz,
  add column if not exists substack_error text;