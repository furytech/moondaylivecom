-- PROPOSED, NOT APPLIED. Undoes supabase/proposed/triad_states_lockdown.sql. Project ggrhuhwxbwrfbbcwcrmv only.
--
-- What it restores: the state the anonymous probe saw before the lockdown, i.e. anon and signed-in users can
-- read every triad_states row (HTTP 206, 1728 rows). That is the INSECURE state: use it only if the lockdown
-- breaks the app and the fix needs time.
--
-- What it does not restore, on purpose:
--   * write privileges for anon/authenticated (members never write these tables; the lockdown removed them).
--     If the pre-flight output saved before the lockdown shows the app depended on any, re-grant exactly those.
--   * the original policy names (unknown; the pre-flight output has them). A single public read policy gives the
--     same read behaviour.
--   * RLS stays ON. With the public policy below, behaviour is the same as before for reads.
--   * triad_states_backup_2026_10_21: anon was already refused before the lockdown, so nothing to put back.
--     If the pre-flight shows `authenticated` had a grant on it, re-grant that one privilege.

begin;

drop policy if exists "Luminary members read their own triad rows" on public.triad_states;

create policy "Public read access for triad states"
  on public.triad_states
  for select
  to anon, authenticated
  using (true);

grant select on table public.triad_states to anon, authenticated;

drop function if exists public.get_my_triad_preview(text);

notify pgrst, 'reload schema';

commit;

-- Confirm the old state is back (expect HTTP 206 and 1728):  npx tsx scripts/probe-anon-access.ts triad_states
-- To re-lock afterwards, re-run supabase/proposed/triad_states_lockdown.sql (it is idempotent).
