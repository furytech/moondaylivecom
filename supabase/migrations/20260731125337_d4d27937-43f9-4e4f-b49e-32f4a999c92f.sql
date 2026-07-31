-- Dedicated secret for the n8n approval workflow to publish transit drafts.
INSERT INTO public.cron_secrets (name, secret_value)
VALUES ('n8n-transit-publish', 'f8309d25-0abb-4071-b655-95c2f3b8e191')
ON CONFLICT (name) DO UPDATE SET secret_value = excluded.secret_value;

-- Schedule the auto-publish job so posts written as 'approved' with a publish_at
-- timestamp go live automatically when that time is reached.
DO $$
BEGIN
  PERFORM cron.unschedule('auto-publish-posts');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'auto-publish-posts',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://hzlpnmvboqhzthvjlves.supabase.co/functions/v1/auto-publish-posts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Cron-Secret', (select secret_value from public.cron_secrets where name = 'auto-publish')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);