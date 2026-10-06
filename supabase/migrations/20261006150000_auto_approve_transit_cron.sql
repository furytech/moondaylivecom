-- ======================================================================
-- Migration: 20261006150000_auto_approve_transit_cron.sql
-- Description: Configure auto-approve-transit edge function pg_cron schedule
-- 1. Ensure moon_transitions table columns (start_time, end_time, sign) and permissions
-- 2. Configure cron secret for auto-approve-transit
-- 3. Schedule pg_cron job to call auto-approve-transit edge function every 30 minutes
-- ======================================================================

-- 1. Ensure moon_transitions table has start_time, end_time, and sign columns
ALTER TABLE public.moon_transitions
  ADD COLUMN IF NOT EXISTS start_time timestamptz,
  ADD COLUMN IF NOT EXISTS end_time timestamptz,
  ADD COLUMN IF NOT EXISTS sign text;

-- Grant permissions for service_role and public readers
GRANT ALL ON public.moon_transitions TO service_role;
GRANT SELECT ON public.moon_transitions TO anon, authenticated;

-- Backfill start_time and sign from transition_at and to_sign where unset
UPDATE public.moon_transitions
SET
  start_time = COALESCE(start_time, transition_at),
  sign = COALESCE(sign, to_sign)
WHERE start_time IS NULL OR sign IS NULL;

-- Backfill end_time based on next transition instant
WITH next_transitions AS (
  SELECT id, LEAD(transition_at) OVER (ORDER BY transition_at) AS next_transition_at
  FROM public.moon_transitions
)
UPDATE public.moon_transitions m
SET end_time = COALESCE(m.end_time, nt.next_transition_at, m.transition_at + interval '2.5 days')
FROM next_transitions nt
WHERE m.id = nt.id AND m.end_time IS NULL;

-- Index for fast time-window queries: where now() is between start_time and end_time
CREATE INDEX IF NOT EXISTS idx_moon_transitions_window
ON public.moon_transitions(start_time, end_time);

-- 2. Configure cron secret for auto-approve-transit
INSERT INTO public.cron_secrets (name, secret_value)
VALUES ('auto-approve-transit', gen_random_uuid()::text)
ON CONFLICT (name) DO NOTHING;

-- 3. Remove existing cron job if previously scheduled
DO $$
BEGIN
  PERFORM cron.unschedule('auto-approve-transit');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. Schedule pg_cron job to invoke auto-approve-transit edge function every 30 minutes
SELECT cron.schedule(
  'auto-approve-transit',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/functions/v1/auto-approve-transit',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Cron-Secret', (SELECT secret_value FROM public.cron_secrets WHERE name = 'auto-approve-transit')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
