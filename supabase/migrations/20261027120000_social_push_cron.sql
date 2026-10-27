-- NOT YET APPLIED. Run in the Supabase SQL editor (project ggrhuhwxbwrfbbcwcrmv) after you have:
--   1. set the function secrets  MAKE_SOCIAL_WEBHOOK_URL  (the Make "Custom webhook" URL)  and  MAKE_SOCIAL_SECRET
--   2. stored the same secret value in Vault (step A below) so the cron job can send it
--   3. deployed make-social-bridge (already done in the same change)
--
-- What it does: at minute 0 of every hour pg_cron asks make-social-bridge to push. The function finds DUE
-- transits (approved, unposted, post time reached, transit not over), POSTs each to the Make webhook, and marks
-- social_posted_at only on a 2xx. Failures retry on the next hourly check.
--
-- Post time (America/New_York): a transit that starts 10:00 PM - 6:59 AM posts at 8:00 PM (the same evening for
-- 10 PM - midnight, otherwise the evening before); any other start posts at the top of the hour it starts in.
--
-- "Posted" is recorded in transits.social_posted_at (blog_posts has the same column). The failure/alert columns
-- are in 20261027130000_social_alert_columns.sql (also NOT YET APPLIED); posting works without them.

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
  if exists (select 1 from cron.job where jobname = 'social-push-hourly') then
    perform cron.unschedule('social-push-hourly');
  end if;
end $$;

select cron.schedule(
  'social-push-hourly',
  '0 * * * *',
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

-- Check it:   select jobid, jobname, schedule, active from cron.job where jobname = 'social-push-hourly';
-- Last runs:  select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
-- Responses:  select id, status_code, content from net._http_response order by created desc limit 5;
-- Pause:      select cron.unschedule('social-push-hourly');
