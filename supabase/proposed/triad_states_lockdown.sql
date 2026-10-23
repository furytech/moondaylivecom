-- PROPOSED, NOT APPLIED. Do not run until the owner approves. Project ggrhuhwxbwrfbbcwcrmv only.
-- Not a migration. Rollback: supabase/proposed/triad_states_lockdown_rollback.sql
-- Tests:    supabase/proposed/triad_states_lockdown_tests.sql   (and scripts/probe-anon-access.ts)
-- Notes:    supabase/proposed/triad_states_lockdown_notes.md     (audit, app impact, apply order)
--
-- Problem: the public anon key can read all 1,728 rows of public.triad_states (the whole paid product).
-- The backup table triad_states_backup_2026_10_21 is already refused to anon (HTTP 401), but is locked
-- explicitly below so it does not depend on how it happened to be created.
--
-- Result after this script:
--   anon                      nothing, on both tables (no grants, no policy).
--   free member               NO direct rows. The Luminary row policy below does not match a free profile.
--                             They get the teaser the UI already shows (first two sentences of
--                             physical_guidance, first 8 words of emotional_guidance) through
--                             public.get_my_triad_preview(transiting_moon_sign), for their own Sun/Moon only.
--   Luminary member           select on triad_states, but only the rows whose natal Sun + natal Moon equal the
--                             Sun/Moon on their own user_profiles row (12 of 1,728), every column. The app's
--                             current .from("triad_states").select(...) calls keep working unchanged.
--   service_role (scripts)    unchanged: full access (it also bypasses RLS).
--   authenticated writes      none. Members never insert/update/delete these tables.
--
-- "Luminary" here = the same profile flags the app trusts for the database side:
--   user_profiles.is_subscriber = true, or subscription_status in ('sovereign','luminary') (case-insensitive).
--
-- PRE-FLIGHT (read-only, run first, keep the output; the rollback is built from the "typical" state):
--   select policyname, roles, cmd, qual from pg_policies
--    where schemaname = 'public' and tablename in ('triad_states','triad_states_backup_2026_10_21');
--   select grantee, privilege_type from information_schema.role_table_grants
--    where table_schema = 'public' and table_name in ('triad_states','triad_states_backup_2026_10_21')
--      and grantee in ('anon','authenticated','public') order by 1, 2;
--   select relname, relrowsecurity from pg_class
--    where relnamespace = 'public'::regnamespace and relname in ('triad_states','triad_states_backup_2026_10_21');
--   select * from pg_publication_tables where tablename like 'triad_states%';          -- realtime exposure
--   select classid::regclass, objid, deptype from pg_depend
--    where refobjid = 'public.triad_states'::regclass and deptype = 'n';                  -- views/functions that read it
--   -- members who would find no row because their profile has no natal pair (counts only):
--   select count(*) filter (where natal_sun_sign is null or natal_moon_sign is null) as no_natal_pair, count(*) as members
--     from public.user_profiles;

begin;

-- STEP 1: remove every existing policy on both tables. Their names are not in the repo's migrations
-- (the tables were created outside them), so drop whatever is there, then add only the policy we want.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and tablename in ('triad_states', 'triad_states_backup_2026_10_21')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end
$$;

-- STEP 2: row-level security on, and privileges rebuilt from nothing.
alter table public.triad_states enable row level security;

revoke all on table public.triad_states from public, anon, authenticated;
grant select on table public.triad_states to authenticated;   -- rows are then filtered by the policy in step 3
grant all    on table public.triad_states to service_role;

-- STEP 3: the one policy. Signed-in, paid, own Sun + Moon.
create policy "Luminary members read their own triad rows"
  on public.triad_states
  for select
  to authenticated
  using (
    exists (
      select 1
        from public.user_profiles up
       where up.user_id = (select auth.uid())
         and up.natal_sun_sign  = triad_states.natal_sun_sign
         and up.natal_moon_sign = triad_states.natal_moon_sign
         and (
           up.is_subscriber is true
           or lower(coalesce(up.subscription_status, '')) in ('sovereign', 'luminary')
         )
    )
  );

-- STEP 4: the free member's teaser. SECURITY DEFINER so it can read the table the member cannot, but it
-- keys everything off auth.uid() and the member's own profile: there is no parameter that chooses a
-- Sun or Moon, so it cannot be used to look at another combination. Previews only; never the full text.
-- Same cut the UI makes today: getBodyPreview (two sentences) and getLockedPreview (8 words).
create or replace function public.get_my_triad_preview(p_transiting_moon_sign text)
returns table (physical_guidance text, emotional_guidance text)
language sql
stable
security definer
set search_path = public
as $$
  select
    array_to_string(
      (regexp_split_to_array(btrim(t.physical_guidance), '(?<=[.!?])\s+'))[1:2],
      ' '
    ) as physical_guidance,
    array_to_string(
      (regexp_split_to_array(
         btrim((regexp_split_to_array(btrim(t.emotional_guidance), '(?<=[.!?])\s+'))[1]),
         '\s+'
       ))[1:8],
      ' '
    ) as emotional_guidance
    from public.triad_states t
    join public.user_profiles up
      on up.user_id = (select auth.uid())
     and up.natal_sun_sign  = t.natal_sun_sign
     and up.natal_moon_sign = t.natal_moon_sign
   where t.transiting_moon_sign = p_transiting_moon_sign
   limit 1;
$$;

revoke all on function public.get_my_triad_preview(text) from public, anon;
grant execute on function public.get_my_triad_preview(text) to authenticated, service_role;

-- STEP 5: the backup table: service role only. RLS on and no policy means members get nothing even if a
-- grant is ever added by mistake.
do $$
begin
  if to_regclass('public.triad_states_backup_2026_10_21') is not null then
    alter table public.triad_states_backup_2026_10_21 enable row level security;
    revoke all on table public.triad_states_backup_2026_10_21 from public, anon, authenticated;
    grant all on table public.triad_states_backup_2026_10_21 to service_role;
  end if;
end
$$;

-- STEP 6: make the new function visible to the REST API without waiting for a schema refresh.
notify pgrst, 'reload schema';

commit;

-- VERIFY: run supabase/proposed/triad_states_lockdown_tests.sql, then `npx tsx scripts/probe-anon-access.ts
-- --expect-denied triad_states triad_states_backup_2026_10_21` (expect PASS).
