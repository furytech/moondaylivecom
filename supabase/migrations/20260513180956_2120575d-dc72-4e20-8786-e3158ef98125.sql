-- Backup codes for MFA recovery (Sovereign Security)
CREATE TABLE public.mfa_backup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mfa_backup_codes_user ON public.mfa_backup_codes(user_id);

ALTER TABLE public.mfa_backup_codes ENABLE ROW LEVEL SECURITY;

-- Users can see metadata about their own codes (count + used status), never the hash content via app — RLS still allows select, but the column is opaque
CREATE POLICY "Users can view their own backup codes"
ON public.mfa_backup_codes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Inserts/deletes go through edge functions using service role; deny direct mutation
CREATE POLICY "Users cannot insert backup codes directly"
ON public.mfa_backup_codes FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Users cannot update backup codes directly"
ON public.mfa_backup_codes FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Users can delete their own backup codes"
ON public.mfa_backup_codes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);