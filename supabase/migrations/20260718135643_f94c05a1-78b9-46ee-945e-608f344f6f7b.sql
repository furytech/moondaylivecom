-- Revoke EXECUTE on SECURITY DEFINER trigger functions from public/authenticated/anon.
-- These functions are only ever invoked by database triggers running as the table owner,
-- so no client role needs the ability to call them directly.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_birthday_update() FROM PUBLIC, anon, authenticated;

-- has_role() must remain executable by authenticated because our RLS policies invoke it.
-- Keep it callable, but drop anon since no policy grants anon a role-gated path.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;