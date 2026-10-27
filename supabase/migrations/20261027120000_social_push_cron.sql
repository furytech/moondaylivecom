-- NOT YET APPLIED. Run in the Supabase SQL editor (project ggrhuhwxbwrfbbcwcrmv) after you have:
--   1. set the function secrets  MAKE_SOCIAL_WEBHOOK_URL  (the Make "Custom webhook" URL)  and  MAKE_SOCIAL_SECRET
--   2. stored the same secret value in Vault (step A below) so the cron job can send it
--   3. deployed make-social-bridge (already done in the same change)
--
-- What it does: every 15 minutes pg_cron asks make-social-bridge to push. The function finds DUE transits
-- (published, unposted, power hour on the first New York day of the transit has passed, transit not over),
-- POSTs each to the Make webhook, and marks social_posted_at only on a 2xx. Failures retry on the next check.
--
-- No new column is needed: "posted" is recorded in transits.social_posted_at (blog_posts has the same column).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- A. One-time: put the bridge secret in Vault (replace the value; it is the same string as MAKE_SOCIAL_SECRET).
--    Run this line by itself, once, and do not commit the value.
-- select vault.create_secret('PASTE_THE_SAME_VALUE_AS_MAKE_SOCIAL_SECRET', 'make_social_secret');

-- B. The schedule. Re-running replaces the job instead of duplicating it.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'social-push-every-15-min') then
    perform cron.unschedule('social-push-every-15-min');
  end if;
end $$;

select cron.schedule(
  'social-push-every-15-min',
  '*/15 * * * *',
  $job$
  select net.http_post(
    url := 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/functions/v1/make-social-bridge',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Make-Secret', (select decrypted_secret from vault.decrypted_secrets where name = 'make_social_secret')
    ),
    body := '{"mode":"push"}'::jsonb,
    timeout_milliseconds := 60000
  );
  $job$
);

-- Check it:   select jobid, jobname, schedule, active from cron.job where jobname = 'social-push-every-15-min';
-- Last runs:  select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
-- Responses:  select id, status_code, content from net._http_response order by created desc limit 5;
-- Pause:      select cron.unschedule('social-push-every-15-min');
