-- PROPOSED, NOT RUN. Project ggrhuhwxbwrfbbcwcrmv only. Review, then run the steps in order.
-- Goal: a member can read only the combination_profiles row that matches their own natal Sun + Moon.
-- Anonymous visitors can read nothing. Admins keep full access. Edge functions and scripts use the
-- service role and are unaffected.

-- STEP 0 (check before): the two users to backfill, and the third (no birthday, nothing to backfill).
--   32b12194-f4aa-4722-b610-2ad1ab093e82  born 1963-11-14, moon_sign Libra      -> Sun Scorpio
--   d0259a03-096d-4c47-9066-efed3ef29aa5  born 1941-06-11, moon_sign Capricorn  -> Sun Gemini
--   f5a92a8f-9368-4780-b077-40249506b6fb  no birthday: left alone

-- STEP 1: backfill natal signs (must run BEFORE step 2, while nothing locks the columns).
update public.user_profiles
   set natal_sun_sign = 'Scorpio', natal_moon_sign = 'Libra'
 where user_id = '32b12194-f4aa-4722-b610-2ad1ab093e82'
   and natal_sun_sign is null and natal_moon_sign is null;

update public.user_profiles
   set natal_sun_sign = 'Gemini', natal_moon_sign = 'Capricorn'
 where user_id = 'd0259a03-096d-4c47-9066-efed3ef29aa5'
   and natal_sun_sign is null and natal_moon_sign is null;

-- STEP 2: write-once natal signs. Today any member can edit these two columns, which would let them
-- point the own-row policy at any combination. Same pattern as the existing birthday lock.
create or replace function public.lock_natal_signs()
returns trigger
language plpgsql
security definer
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

  -- Support corrections go through the service role.
  if claim_role = 'service_role' or current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if old.natal_sun_sign is not null and new.natal_sun_sign is distinct from old.natal_sun_sign then
    raise exception 'Natal Sun sign is locked once set. Contact support to correct it.';
  end if;
  if old.natal_moon_sign is not null and new.natal_moon_sign is distinct from old.natal_moon_sign then
    raise exception 'Natal Moon sign is locked once set. Contact support to correct it.';
  end if;
  return new;
end;
$$;

drop trigger if exists lock_natal_signs_trigger on public.user_profiles;
create trigger lock_natal_signs_trigger
  before update of natal_sun_sign, natal_moon_sign on public.user_profiles
  for each row execute function public.lock_natal_signs();

-- STEP 3: replace the public read policy with an own-row policy; take read access away from anon.
-- (The existing "Admin write access" FOR ALL policy keeps covering admins, including reads.)
drop policy if exists "Public read access for combination profiles" on public.combination_profiles;

create policy "Members read their own combination"
  on public.combination_profiles
  for select
  to authenticated
  using (
    exists (
      select 1
        from public.user_profiles up
       where up.user_id = auth.uid()
         and up.natal_sun_sign  = combination_profiles.sun_sign
         and up.natal_moon_sign = combination_profiles.moon_sign
    )
  );

revoke select on public.combination_profiles from anon;
-- Hardening: these privileges are not needed by any role the app uses (RLS does not govern TRUNCATE).
revoke truncate, references, trigger on public.combination_profiles from anon, authenticated;

-- STEP 4: verify (read-only; each runs in a rolled-back transaction).
--   a) anon sees nothing (expect an error: permission denied):
--        begin; set local role anon; select count(*) from public.combination_profiles; rollback;
--   b) a member sees exactly one row (expect 1), using a real member's id:
--        begin; set local role authenticated;
--        select set_config('request.jwt.claims', '{"sub":"32b12194-f4aa-4722-b610-2ad1ab093e82","role":"authenticated"}', true);
--        select sun_sign, moon_sign from public.combination_profiles; rollback;
--   c) a member cannot move their own natal sign (expect the 'locked' error):
--        begin; set local role authenticated;
--        select set_config('request.jwt.claims', '{"sub":"32b12194-f4aa-4722-b610-2ad1ab093e82","role":"authenticated"}', true);
--        update public.user_profiles set natal_moon_sign = 'Aries' where user_id = '32b12194-f4aa-4722-b610-2ad1ab093e82'; rollback;

-- ROLLBACK (puts things back exactly as they are today):
--   drop policy if exists "Members read their own combination" on public.combination_profiles;
--   create policy "Public read access for combination profiles" on public.combination_profiles
--     for select to anon, authenticated using (true);
--   grant select, truncate, references, trigger on public.combination_profiles to anon;
--   grant truncate, references, trigger on public.combination_profiles to authenticated;
--   drop trigger if exists lock_natal_signs_trigger on public.user_profiles;
--   drop function if exists public.lock_natal_signs();
