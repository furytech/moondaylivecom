ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS review_email_sent_at timestamptz;

INSERT INTO public.cron_secrets (name, secret_value)
VALUES ('send-transit-review', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;