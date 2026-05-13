DROP POLICY IF EXISTS "Users cannot insert backup codes directly" ON public.mfa_backup_codes;
DROP POLICY IF EXISTS "Users cannot update backup codes directly" ON public.mfa_backup_codes;