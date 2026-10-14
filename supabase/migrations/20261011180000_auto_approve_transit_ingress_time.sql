-- ======================================================================
-- Migration: 20261011180000_auto_approve_transit_ingress_time.sql
-- Description: Ensure ingress_time column, indexes, and triggers on moon_transitions
-- for auto-approve-transit edge function, and pg_cron schedule.
-- ======================================================================

-- 1. Ensure ingress_time column exists on public.moon_transitions
ALTER TABLE public.moon_transitions
  ADD COLUMN IF NOT EXISTS ingress_time timestamptz;

-- 2. Backfill ingress_time from transition_at or start_time
UPDATE public.moon_transitions
SET ingress_time = COALESCE(ingress_time, transition_at, start_time)
WHERE ingress_time IS NULL;

-- 3. Index for fast queries: ingress_time <= now() ORDER BY ingress_time DESC
CREATE INDEX IF NOT EXISTS idx_moon_transitions_ingress_time
ON public.moon_transitions(ingress_time DESC);

-- 4. Trigger to ensure any newly inserted transition rows automatically populate ingress_time and sign
CREATE OR REPLACE FUNCTION public.sync_moon_transitions_ingress_time()
RETURNS trigger AS $$
BEGIN
  IF NEW.ingress_time IS NULL THEN
    NEW.ingress_time := COALESCE(NEW.transition_at, NEW.start_time);
  END IF;
  IF NEW.sign IS NULL THEN
    NEW.sign := COALESCE(NEW.to_sign, NEW.sign);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_moon_transitions_ingress_time ON public.moon_transitions;

CREATE TRIGGER trg_moon_transitions_ingress_time
BEFORE INSERT OR UPDATE ON public.moon_transitions
FOR EACH ROW
EXECUTE FUNCTION public.sync_moon_transitions_ingress_time();

-- 5. Ensure pg_cron schedule for auto-approve-transit (every 30 minutes)
-- Invokes edge function via pg_net http_post
DO $$
BEGIN
  PERFORM cron.unschedule('auto-approve-transit');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

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
