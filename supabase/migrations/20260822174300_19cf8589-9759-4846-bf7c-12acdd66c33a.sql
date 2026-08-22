ALTER TABLE public.dispatch_logs ADD COLUMN IF NOT EXISTS error_type text;
CREATE INDEX IF NOT EXISTS dispatch_logs_success_idx ON public.dispatch_logs (post_id, channel, status, created_at DESC);