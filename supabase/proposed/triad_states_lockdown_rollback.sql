-- NOT RUN (kept ready). Undoes supabase/proposed/triad_states_lockdown.sql, which was APPLIED 2026-10-23.
-- Project ggrhuhwxbwrfbbcwcrmv only.
--
-- What it restores: the state the anonymous probe saw before the lockdown, i.e. anon and signed-in users can
-- read every triad_states row (HTTP 206, 1728 rows). That is the INSECURE state: use it only if the lockdown
-- breaks the app and the fix needs time.
--
-- The state it restores was read from the live project on 2026-10-23 (read-only catalog queries):
--   * triad_states: RLS on, ONE policy "Public read access for triad states" (select, anon + authenticated, using true).
--   * anon and authenticated held SELECT, REFERENCES, TRIGGER, TRUNCATE; never INSERT, UPDATE or DELETE.
--   * triad_states_backup_2026_10_21: RLS on, no policy, no grants for anon/authenticated. The lockdown only
--     re-asserts that, so there is nothing to put back for it.

begin;

drop policy if exists "Luminary members read their own triad rows" on public.triad_states;

create policy "Public read access for triad states"
  on public.triad_states
  for select
  to anon, authenticated
  using (true);

-- exactly the privileges anon and authenticated held on 2026-10-23 (no INSERT/UPDATE/DELETE ever)
grant select, references, trigger, truncate on table public.triad_states to anon, authenticated;

drop function if exists public.get_my_triad_preview(text);

notify pgrst, 'reload schema';

commit;

-- Confirm the old state is back (expect HTTP 206 and 1728):  npx tsx scripts/probe-anon-access.ts triad_states
-- To re-lock afterwards, re-run supabase/proposed/triad_states_lockdown.sql (it is idempotent).
