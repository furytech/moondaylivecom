CREATE TABLE public.system_errors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source text NOT NULL,
  severity text NOT NULL DEFAULT 'error' CHECK (severity IN ('warning','error','critical')),
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  fingerprint text NOT NULL,
  affects_subscribers boolean NOT NULL DEFAULT true,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  alerted_at timestamptz,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX system_errors_fingerprint_idx ON public.system_errors (fingerprint, occurred_at DESC);
CREATE INDEX system_errors_occurred_idx ON public.system_errors (occurred_at DESC);

GRANT SELECT, UPDATE ON public.system_errors TO authenticated;
GRANT ALL ON public.system_errors TO service_role;

ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system errors"
  ON public.system_errors FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can resolve system errors"
  ON public.system_errors FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_alert_emails()
RETURNS TABLE(email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.email
  FROM public.user_profiles p
  JOIN public.user_roles r ON r.user_id = p.user_id
  WHERE r.role = 'admin' AND p.email IS NOT NULL
$$;

REVOKE EXECUTE ON FUNCTION public.admin_alert_emails() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_alert_emails() TO service_role;