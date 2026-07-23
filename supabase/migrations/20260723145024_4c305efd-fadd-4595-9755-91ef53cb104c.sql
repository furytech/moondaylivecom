ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS reddit_post TEXT;

INSERT INTO public.cron_secrets (name, secret_value)
VALUES ('generate-draft', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;