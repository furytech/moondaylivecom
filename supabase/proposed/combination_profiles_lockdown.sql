-- APPLIED 2026-10-20 to project ggrhuhwxbwrfbbcwcrmv (steps 1-5 in one transaction; step 6 checks all passed).
-- Kept here for reference and rollback. Not a migration: do not re-run.
-- Goal: a member can read only the combination_profiles row that matches their own natal Sun + Moon.
-- Anonymous visitors can read nothing. Admins keep full access. Edge functions and scripts use the
-- service role and are unaffected.
--
-- v2: signup saves a computed Moon sign first, and the Moon Cusp Quiz (signup or retake) can replace it
-- with the neighbouring sign. So the Moon lock is not write-once: it allows the first value and its two
-- neighbouring signs, measured from the FIRST value, which the server records itself.

begin;

-- STEP 1: server-recorded first Moon sign (members cannot edit it; see the trigger).
alter table public.user_profiles add column if not exists natal_moon_sign_initial text;

-- STEP 2: backfill natal signs for the two users who have a birthday and a Moon sign but no natal pair.
--   32b12194-f4aa-4722-b610-2ad1ab093e82  born 1963-11-14, Moon Libra     -> Sun Scorpio
--   d0259a03-096d-4c47-9066-efed3ef29aa5  born 1941-06-11, Moon Capricorn -> Sun Gemini
-- (f5a92a8f-... has no birthday and is left alone.)
update public.user_profiles
   set natal_sun_sign = 'Scorpio', natal_moon_sign = 'Libra'
 where user_id = '32b12194-f4aa-4722-b610-2ad1ab093e82'
   and natal_sun_sign is null and natal_moon_sign is null;

update public.user_profiles
   set natal_sun_sign = 'Gemini', natal_moon_sign = 'Capricorn'
 where user_id = 'd0259a03-096d-4c47-9066-efed3ef29aa5'
   and natal_sun_sign is null and natal_moon_sign is null;

-- STEP 3: record today's Moon sign as each member's starting point.
update public.user_profiles
   set natal_moon_sign_initial = natal_moon_sign
 where natal_moon_sign is not null and natal_moon_sign_initial is null;

-- STEP 4: the lock.
--   Sun sign: write-once (it is always the one sign computed from the locked birthday).
--   Moon sign: may change only to the starting sign or the sign next to it on either side, the two
--   answers the Moon Cusp Quiz can offer for a Moon-change birthday. The starting sign is set by the
--   server and cannot be edited by a member.
--   Support corrections go through the service role.
create or replace function public.lock_natal_signs()
returns trigger
language plpgsql
-- Deliberately NOT security definer: inside a definer function current_user is the owner, which would
-- make the service-role exemption below always true. As a normal function it sees the real caller role.
set search_path to 'public'
as $$
declare
  claim_role text;
  zodiac text[] := array['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  base text;
  base_idx int;
  new_idx int;
  gap int;
begin
  begin
    claim_role := current_setting('request.jwt.claims', true)::json->>'role';
  exception when others then
    claim_role := null;
  end;

  if claim_role = 'service_role' or current_user in ('postgres', 'supabase_admin', 'service_role') then
    if new.natal_moon_sign is not null and new.natal_moon_sign_initial is null then
      new.natal_moon_sign_initial := new.natal_moon_sign;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.natal_moon_sign_initial := new.natal_moon_sign;
    return new;
  end if;

  -- UPDATE by a member: the starting sign is never theirs to edit.
  new.natal_moon_sign_initial := old.natal_moon_sign_initial;

  if old.natal_sun_sign is not null and new.natal_sun_sign is distinct from old.natal_sun_sign then
    raise exception 'Natal Sun sign is locked once set. Contact support to correct it.';
  end if;

  if old.natal_moon_sign is not null and new.natal_moon_sign is distinct from old.natal_moon_sign then
    base := coalesce(old.natal_moon_sign_initial, old.natal_moon_sign);
    base_idx := array_position(zodiac, base);
    new_idx := array_position(zodiac, new.natal_moon_sign);
    if base_idx is null or new_idx is null then
      raise exception 'Natal Moon sign is locked once set. Contact support to correct it.';
    end if;
    gap := least((new_idx - base_idx + 12) % 12, (base_idx - new_idx + 12) % 12);
    if gap > 1 then
      raise exception 'Natal Moon sign can only change to the neighbouring sign (Moon-change birthday). Contact support to correct it.';
    end if;
  end if;

  if new.natal_moon_sign is not null and new.natal_moon_sign_initial is null then
    new.natal_moon_sign_initial := new.natal_moon_sign;
  end if;
  return new;
end;
$$;

drop trigger if exists lock_natal_signs_trigger on public.user_profiles;
create trigger lock_natal_signs_trigger
  before insert or update on public.user_profiles
  for each row execute function public.lock_natal_signs();

-- STEP 5: replace the public read policy with an own-row policy; take read access away from anon.
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
-- Hardening: not needed by any role the app uses (RLS does not govern TRUNCATE).
revoke truncate, references, trigger on public.combination_profiles from anon, authenticated;

commit;

-- STEP 6: verify (read-only; each runs in a rolled-back transaction).
--   a) anon sees nothing (expect: permission denied):
--        begin; set local role anon; select count(*) from public.combination_profiles; rollback;
--   b) a member sees exactly one row (expect 1):
--        begin; set local role authenticated;
--        select set_config('request.jwt.claims', '{"sub":"32b12194-f4aa-4722-b610-2ad1ab093e82","role":"authenticated"}', true);
--        select sun_sign, moon_sign from public.combination_profiles; rollback;
--   c) a member cannot jump to a far sign (expect the 'neighbouring sign' error):
--        ... update public.user_profiles set natal_moon_sign = 'Aries' where user_id = '32b12194-...'; rollback;
--   d) a member can move to a neighbour, as the quiz does (expect UPDATE 1): set natal_moon_sign = 'Scorpio'.
--   e) a member cannot change the Sun sign or the starting sign (expect error / unchanged).

-- ROLLBACK (puts things back exactly as they were):
--   drop policy if exists "Members read their own combination" on public.combination_profiles;
--   create policy "Public read access for combination profiles" on public.combination_profiles
--     for select to anon, authenticated using (true);
--   grant select, truncate, references, trigger on public.combination_profiles to anon;
--   grant truncate, references, trigger on public.combination_profiles to authenticated;
--   drop trigger if exists lock_natal_signs_trigger on public.user_profiles;
--   drop function if exists public.lock_natal_signs();
--   alter table public.user_profiles drop column if exists natal_moon_sign_initial;
