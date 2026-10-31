-- PROPOSED, NOT YET APPLIED. Project ggrhuhwxbwrfbbcwcrmv only.
--
-- Why: today a Free member can read their whole combination_profiles row through the API (policy "Members read
-- their own combination"): the full synthesis, both essences, shadow_synthesis and default_behaviors. The app only
-- shows the free parts, but the rest is visible in the browser's Network tab. This is the same fix get_my_triad_preview
-- made for triad_states: Free members get a server-cut preview, Luminary members get the full row.
--
-- Free preview cut (matches what the app shows Free members today):
--   combination_title, sun_sign, moon_sign, luminous_expression  -> whole (free hero + strengths)
--   combination_synthesis -> first two sentences (Blueprint Preview card)
--   solar_essence, lunar_essence -> first sentence only (the faded peek shows its first 8 words)
--   shadow_synthesis, default_behaviors -> null / empty (nothing in the Free UI uses them; check before applying)
--
-- Step 1 (this file): add the function. Safe to apply on its own: nothing calls it until the client is switched.
-- Step 2 (later, separate change): switch Blueprint.tsx / combinationService.ts / Triad.tsx to call it, then
--   tighten the table (drop the broad member policy, or revoke column SELECT on the paid columns) so the API
--   stops returning them. Do not do step 2 first: it would break the Free Blueprint.
-- Rollback: drop function public.get_my_combination_profile();

create or replace function public.get_my_combination_profile()
returns table (
  sun_sign text,
  moon_sign text,
  combination_title text,
  luminous_expression jsonb,
  combination_synthesis text,
  solar_essence text,
  lunar_essence text,
  shadow_synthesis text,
  default_behaviors jsonb
)
language sql
stable
security definer
set search_path to 'public'
as $$
  with me as (
    select up.natal_sun_sign, up.natal_moon_sign,
           (up.is_subscriber is true
            or lower(coalesce(up.subscription_status, '')) in ('sovereign', 'luminary')) as paid
    from public.user_profiles up
    where up.user_id = (select auth.uid())
  )
  select
    c.sun_sign, c.moon_sign, c.combination_title,
    to_jsonb(c.luminous_expression),
    case when me.paid then c.combination_synthesis
         else array_to_string((regexp_split_to_array(btrim(c.combination_synthesis), '(?<=[.!?])\s+'))[1:2], ' ') end,
    case when me.paid then c.solar_essence
         else (regexp_split_to_array(btrim(c.solar_essence), '(?<=[.!?])\s+'))[1] end,
    case when me.paid then c.lunar_essence
         else (regexp_split_to_array(btrim(c.lunar_essence), '(?<=[.!?])\s+'))[1] end,
    case when me.paid then c.shadow_synthesis else null end,
    case when me.paid then to_jsonb(c.default_behaviors) else '[]'::jsonb end
  from public.combination_profiles c
  join me on me.natal_sun_sign = c.sun_sign and me.natal_moon_sign = c.moon_sign
  limit 1;
$$;

revoke all on function public.get_my_combination_profile() from public;
grant execute on function public.get_my_combination_profile() to authenticated;
