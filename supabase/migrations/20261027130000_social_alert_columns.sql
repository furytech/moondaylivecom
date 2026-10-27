-- NOT YET APPLIED. Run in the Supabase SQL editor (project ggrhuhwxbwrfbbcwcrmv).
--
-- Columns make-social-bridge uses to (1) mark a card "sending" so Undo and overlapping runs leave it alone,
-- (2) count failures in a row, and (3) email the admin once per card per event (failed twice in a row, or Missed).
-- Posting works without them: the function skips each feature until its column exists, and Mission Control's
-- Undo drops the "sending" check. Safe to re-run.

alter table public.transits
  add column if not exists social_sending_at      timestamptz,
  add column if not exists social_fail_count      integer not null default 0,
  add column if not exists social_fail_for        text,
  add column if not exists social_last_error      text,
  add column if not exists social_fail_alert_for  text,
  add column if not exists social_missed_alert_for text;

comment on column public.transits.social_sending_at is 'Set while a post is being sent; a mark older than 10 minutes is treated as abandoned.';
comment on column public.transits.social_fail_count is 'Failed post attempts in a row for the current approval (reset on success).';
comment on column public.transits.social_fail_for is 'published_at of the approval social_fail_count belongs to (a new approval starts a new count).';
comment on column public.transits.social_last_error is 'Last post failure reason.';
comment on column public.transits.social_fail_alert_for is 'Window start the "failed twice" email was sent for (once per card per window).';
comment on column public.transits.social_missed_alert_for is 'Window start the "missed" email was sent for (once per card per window).';

-- Check:  select column_name from information_schema.columns where table_name = 'transits' and column_name like 'social_%';
-- Undo:   alter table public.transits drop column social_sending_at, drop column social_fail_count, drop column social_fail_for,
--           drop column social_last_error, drop column social_fail_alert_for, drop column social_missed_alert_for;
