-- PROPOSED TESTS for supabase/proposed/triad_states_lockdown.sql. Run AFTER the lockdown is approved and applied.
-- Project ggrhuhwxbwrfbbcwcrmv only. Every block is one transaction that ends in ROLLBACK, so nothing is changed.
-- Each block is self-checking: it raises "FAIL: ..." on a problem and finishes silently when it passes
-- (the SQL editor shows "Success. No rows returned" for a pass). Run the blocks one at a time.
--
-- Fill in two real members before running blocks B, C and D (look them up with the query in block 0):
--   <FREE_UID>  a member with natal Sun + Moon set, is_subscriber = false, subscription_status = 'free'
--   <PAID_UID>  a member with natal Sun + Moon set and is_subscriber = true (or status sovereign/luminary)
-- Block A (anonymous) and block E (service role) need no member.

-- ---------------------------------------------------------------------------------------------------
-- 0. Find the two test members (read-only; run as the project owner, not as a member).
-- ---------------------------------------------------------------------------------------------------
-- select user_id, natal_sun_sign, natal_moon_sign, is_subscriber, subscription_status
--   from public.user_profiles
--  where natal_sun_sign is not null and natal_moon_sign is not null
--  order by is_subscriber desc, created_at limit 20;

-- ---------------------------------------------------------------------------------------------------
-- A. ANON: nothing, on either table, by any route.
-- ---------------------------------------------------------------------------------------------------
begin;
set local role anon;
do $$
begin
  begin
    perform 1 from public.triad_states limit 1;
    raise exception 'FAIL: anon could select from triad_states';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.triad_states_backup_2026_10_21 limit 1;
    raise exception 'FAIL: anon could select from triad_states_backup_2026_10_21';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.get_my_triad_preview('Aries');
    raise exception 'FAIL: anon could call get_my_triad_preview';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.triad_states set updated_at = updated_at where false;
    raise exception 'FAIL: anon could update triad_states';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.triad_states where false;
    raise exception 'FAIL: anon could delete from triad_states';
  exception when insufficient_privilege then null;
  end;
end
$$;
rollback;

-- ---------------------------------------------------------------------------------------------------
-- B. FREE MEMBER: no rows from the table, own-combination teaser only through the function.
-- ---------------------------------------------------------------------------------------------------
begin;
-- as the owner: remember how long the full text is, to prove the teaser is shorter.
select set_config('t.full_physical',
  (select length(physical_guidance)::text from public.triad_states t
    join public.user_profiles up on up.natal_sun_sign = t.natal_sun_sign and up.natal_moon_sign = t.natal_moon_sign
   where up.user_id = '<FREE_UID>' and t.transiting_moon_sign = 'Aries'), true);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"<FREE_UID>","role":"authenticated"}', true);
do $$
declare
  n int;
  r record;
begin
  select count(*) into n from public.triad_states;
  if n <> 0 then raise exception 'FAIL: free member sees % triad_states rows (expected 0)', n; end if;

  -- the app's exact Luminary query, for the member's own combination: still nothing for a free member
  select count(*) into n from public.triad_states
   where transiting_moon_sign = 'Aries'
     and (natal_sun_sign, natal_moon_sign) = (select natal_sun_sign, natal_moon_sign from public.user_profiles where user_id = '<FREE_UID>');
  if n <> 0 then raise exception 'FAIL: free member read their own combination directly (% rows)', n; end if;

  begin
    insert into public.triad_states (natal_sun_sign, natal_moon_sign, transiting_moon_sign) values ('Aries','Aries','Aries');
    raise exception 'FAIL: free member could insert into triad_states';
  exception when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.triad_states_backup_2026_10_21 limit 1;
    raise exception 'FAIL: free member could select from the backup table';
  exception when insufficient_privilege then null;
  end;

  -- the teaser: exactly one row, previews only
  select * into r from public.get_my_triad_preview('Aries');
  if r.physical_guidance is null or r.emotional_guidance is null then
    raise exception 'FAIL: teaser missing for a free member';
  end if;
  if array_length(regexp_split_to_array(r.emotional_guidance, '\s+'), 1) > 8 then
    raise exception 'FAIL: emotional teaser is longer than 8 words';
  end if;
  if length(r.physical_guidance) > current_setting('t.full_physical')::int then
    raise exception 'FAIL: physical teaser is longer than the full text';
  end if;
  select count(*) into n from public.get_my_triad_preview('Aries');
  if n <> 1 then raise exception 'FAIL: teaser returned % rows (expected 1)', n; end if;
end
$$;
rollback;

-- ---------------------------------------------------------------------------------------------------
-- C. PAID MEMBER: exactly their own 12 rows, every column, nothing else.
-- ---------------------------------------------------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"<PAID_UID>","role":"authenticated"}', true);
do $$
declare
  own_sun text;
  own_moon text;
  n int;
  r record;
begin
  select natal_sun_sign, natal_moon_sign into own_sun, own_moon from public.user_profiles where user_id = '<PAID_UID>';

  select count(*) into n from public.triad_states;
  if n <> 12 then raise exception 'FAIL: paid member sees % rows (expected 12, one per transiting Moon sign)', n; end if;

  select count(*) into n from public.triad_states where natal_sun_sign <> own_sun or natal_moon_sign <> own_moon;
  if n <> 0 then raise exception 'FAIL: paid member sees % rows of other combinations', n; end if;

  -- Triad.tsx query (Lenses)
  select combination_title, triad_number, integration_invitation, daily_ritual into r
    from public.triad_states
   where natal_sun_sign = own_sun and natal_moon_sign = own_moon and transiting_moon_sign = 'Aries';
  if r.triad_number is null then raise exception 'FAIL: Lenses query returned no row for the paid member'; end if;

  -- useLunarForecast query (Today), all six columns
  select physical_guidance, emotional_guidance, spiritual_guidance, daily_ritual, shadow_activation, integration_invitation into r
    from public.triad_states
   where natal_sun_sign = own_sun and natal_moon_sign = own_moon and transiting_moon_sign = 'Aries';
  if r.physical_guidance is null or r.emotional_guidance is null or r.spiritual_guidance is null
     or r.daily_ritual is null or r.shadow_activation is null or r.integration_invitation is null then
    raise exception 'FAIL: a paid column came back empty for the paid member';
  end if;

  begin
    update public.triad_states set daily_ritual = daily_ritual where false;
    raise exception 'FAIL: paid member could update triad_states';
  exception when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.triad_states_backup_2026_10_21 limit 1;
    raise exception 'FAIL: paid member could select from the backup table';
  exception when insufficient_privilege then null;
  end;
end
$$;
rollback;

-- ---------------------------------------------------------------------------------------------------
-- D. A MEMBER READING ANOTHER COMBINATION: paid and free, by filter, by id and through the teaser.
-- ---------------------------------------------------------------------------------------------------
begin;
-- as the owner: pick one row that belongs to a DIFFERENT combination than the paid member's.
select set_config('t.other_id',
  (select t.id::text from public.triad_states t
    where (t.natal_sun_sign, t.natal_moon_sign) <> (select natal_sun_sign, natal_moon_sign from public.user_profiles where user_id = '<PAID_UID>')
    limit 1), true);
select set_config('t.other_sun',
  (select natal_sun_sign from public.triad_states where id::text = current_setting('t.other_id')), true);
select set_config('t.other_moon',
  (select natal_moon_sign from public.triad_states where id::text = current_setting('t.other_id')), true);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"<PAID_UID>","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.triad_states where id::text = current_setting('t.other_id');
  if n <> 0 then raise exception 'FAIL: paid member read another combination by id'; end if;

  select count(*) into n from public.triad_states
   where natal_sun_sign = current_setting('t.other_sun') and natal_moon_sign = current_setting('t.other_moon');
  if n <> 0 then raise exception 'FAIL: paid member read another combination by Sun/Moon filter'; end if;
end
$$;
-- the same attempt as the free member: still nothing, and the teaser takes no Sun/Moon argument at all.
select set_config('request.jwt.claims', '{"sub":"<FREE_UID>","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.triad_states
   where natal_sun_sign = current_setting('t.other_sun') and natal_moon_sign = current_setting('t.other_moon');
  if n <> 0 then raise exception 'FAIL: free member read another combination'; end if;
end
$$;
rollback;

-- ---------------------------------------------------------------------------------------------------
-- E. SERVICE ROLE: unchanged, full access (generate-triads, regen-flagged-triads and the audit scripts use it).
-- ---------------------------------------------------------------------------------------------------
begin;
set local role service_role;
do $$
declare n int;
begin
  select count(*) into n from public.triad_states;
  if n <> 1728 then raise exception 'FAIL: service role sees % triad_states rows (expected 1728)', n; end if;
  update public.triad_states set updated_at = updated_at where false;   -- write privilege still present
  -- (the backup table is not tested here: service_role has never had SELECT on it, and the lockdown leaves that as is)
end
$$;
rollback;

-- ---------------------------------------------------------------------------------------------------
-- F. THE ANONYMOUS PROBE, from outside the database, exactly as an attacker would (read-only, counts only).
--    Before the lockdown this prints HTTP 206 and 1728 for triad_states. After it, expect "denied" and PASS.
--
--      npx tsx scripts/probe-anon-access.ts --expect-denied triad_states triad_states_backup_2026_10_21
--
--    The same check without the script (HEAD request, so only the count header comes back, never a row):
--      curl.exe -s -I "https://ggrhuhwxbwrfbbcwcrmv.supabase.co/rest/v1/triad_states?select=id" ^
--        -H "apikey: <VITE_SUPABASE_PUBLISHABLE_KEY>" -H "Authorization: Bearer <VITE_SUPABASE_PUBLISHABLE_KEY>" ^
--        -H "Prefer: count=exact" -H "Range: 0-0"
--    Pass = HTTP 401/403 (permission denied) or a Content-Range ending in /0. Fail = a Content-Range ending in /1728.
--
--    Public content must stay public: blog_posts (9), transits (10) and moon_transitions (403) should still count
--    for anon, and guest_astrologers stays at 0:
--      npx tsx scripts/probe-anon-access.ts blog_posts transits moon_transitions guest_astrologers
-- ---------------------------------------------------------------------------------------------------
