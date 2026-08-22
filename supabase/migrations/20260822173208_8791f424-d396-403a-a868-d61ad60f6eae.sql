CREATE TABLE public.dispatch_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  channel text NOT NULL,
  webhook_url text,
  status text NOT NULL,
  trigger_source text,
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_status integer,
  response_body text,
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX dispatch_logs_post_idx ON public.dispatch_logs (post_id, created_at DESC);
CREATE INDEX dispatch_logs_created_idx ON public.dispatch_logs (created_at DESC);

GRANT SELECT ON public.dispatch_logs TO authenticated;
GRANT ALL ON public.dispatch_logs TO service_role;

ALTER TABLE public.dispatch_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read dispatch logs"
ON public.dispatch_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));