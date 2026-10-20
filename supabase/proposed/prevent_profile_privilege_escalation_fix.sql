-- PROPOSED, NOT RUN. Project ggrhuhwxbwrfbbcwcrmv only.
-- Problem: prevent_profile_privilege_escalation() is SECURITY DEFINER, so inside it current_user is the
-- function owner (postgres), the "service role / postgres" exemption is always true, and a signed-in
-- member can change their own is_subscriber, subscription_status and email.
-- (Confirmed with a rolled-back test: as role "authenticated", flipping is_subscriber succeeded.)
-- Fix: make it a normal (invoker) function so current_user is the real caller. Same rules as before.
--
-- Safe for the app: the only writers of is_subscriber/subscription_status are the stripe-webhook and
-- check-subscription edge functions, which use the service role (exempt). Profile emails currently match
-- auth emails for all 18 profiles, so the member "Save profile" upsert (which sends email) still passes.

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  claim_role text;
begin
  begin
    claim_role := current_setting('request.jwt.claims', true)::json->>'role';
  exception when others then
    claim_role := null;
  end;

  if claim_role = 'service_role'
     or current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if new.is_subscriber is distinct from old.is_subscriber then
    raise exception 'Not allowed to modify is_subscriber';
  end if;
  if new.subscription_status is distinct from old.subscription_status then
    raise exception 'Not allowed to modify subscription_status';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'Not allowed to modify user_id';
  end if;
  if new.email is distinct from old.email then
    raise exception 'Not allowed to modify email';
  end if;

  return new;
end;
$$;

-- VERIFY (each in a rolled-back transaction, as a real member; use any member's id):
--   expect the error "Not allowed to modify is_subscriber":
--     begin; set local role authenticated;
--     select set_config('request.jwt.claims','{"sub":"<user id>","role":"authenticated"}',true);
--     update public.user_profiles set is_subscriber = not is_subscriber where user_id = '<user id>'; rollback;
--   expect success (timezone is not guarded):
--     ... update public.user_profiles set timezone = timezone where user_id = '<user id>'; rollback;
--   expect success as the service role (what the Stripe webhook does):
--     begin; set local role service_role; update public.user_profiles set is_subscriber = is_subscriber
--       where user_id = '<user id>'; rollback;

-- ROLLBACK (restores the exact current definition, bug included):
--   create or replace function public.prevent_profile_privilege_escalation()
--   returns trigger language plpgsql security definer set search_path to 'public' as $$
--   declare claim_role text;
--   begin
--     begin claim_role := current_setting('request.jwt.claims', true)::json->>'role';
--     exception when others then claim_role := null; end;
--     if claim_role = 'service_role' or current_user in ('postgres', 'supabase_admin', 'service_role') then
--       return new; end if;
--     if new.is_subscriber is distinct from old.is_subscriber then raise exception 'Not allowed to modify is_subscriber'; end if;
--     if new.subscription_status is distinct from old.subscription_status then raise exception 'Not allowed to modify subscription_status'; end if;
--     if new.user_id is distinct from old.user_id then raise exception 'Not allowed to modify user_id'; end if;
--     if new.email is distinct from old.email then raise exception 'Not allowed to modify email'; end if;
--     return new;
--   end; $$;
