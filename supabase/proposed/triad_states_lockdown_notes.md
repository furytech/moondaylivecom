# triad_states lockdown: audit, app impact, apply order

Status: PROPOSED. Nothing here has been applied to any database. Project ggrhuhwxbwrfbbcwcrmv only.

Files: `triad_states_lockdown.sql` (apply), `triad_states_lockdown_rollback.sql`, `triad_states_lockdown_tests.sql`,
`scripts/probe-anon-access.ts` (read-only anonymous probe, counts only).

## 1. Audit: what the anon key can read today (2026-10-23, row counts only, no content)

Method: HEAD requests with the public key from the browser bundle and `Prefer: count=exact`, so only the
`Content-Range` header comes back. The API refuses to list tables to anon (401), so the list is every table in the
generated types plus the migrations plus `triad_states_backup_2026_10_21`.

| Table | Anon sees | Meant to be public? |
|---|---|---|
| **triad_states** | **1,728 rows (HTTP 206)** | **No. This is the paid product. The leak.** |
| triad_states_backup_2026_10_21 | refused (401) | No. Already closed to anon; locked explicitly by the script anyway |
| blog_posts | 9 (all `status = published`) | Yes, public blog |
| transits | 10 | Yes (policy "Public can read published transits") |
| moon_transitions | 403 | Yes (the public home page reads it) |
| guest_astrologers | 0 (readable, no rows visible) | Policy-filtered; fine |
| combination_profiles, user_profiles, user_roles, user_natal_profiles | refused | No, correct (combination_profiles was locked 2026-10-20) |
| daily_forecasts, moon_phase_texts, moon_sign_library, doctrine_entries, cosmic_weather | refused | Not public today; unchanged |
| content_drafts, cron_secrets, dispatch_logs, email_send_log, email_send_state, email_unsubscribe_tokens, guest_contributions, mfa_backup_codes, moon_history, moon_ingress_notifications, suppressed_emails, system_errors, system_settings | refused | No, correct |
| signups | 404 (no such table) | n/a |

`triad_states` is the only table that leaks. Writes (answered read-only on 2026-10-23 from the catalog, nothing written): **anon and members cannot write `triad_states`.**
The only policy is `Public read access for triad states` (select, anon + authenticated, `using (true)`), and neither role
holds INSERT, UPDATE or DELETE. They do hold TRUNCATE, REFERENCES and TRIGGER; the REST API cannot issue those and neither
role has a database login, so there is no path, but the lockdown removes them. Only `service_role` can write. The backup table
has no grants at all for anon/authenticated; `service_role` holds only TRUNCATE (not SELECT) on it, and the lockdown leaves that alone.
RLS was already on for both tables, so the leak is the public read policy.

## 2. How the app reads triad_states

Only two places in `src/`, both from the browser with the member's own session. No edge function, `api/` route or doc reads it.
Scripts (`scripts/*.ts`) use the service role.

| Where | Columns | Who gets there |
|---|---|---|
| `src/hooks/useLunarForecast.ts:55` (used by `DailyForecast`, Today tab) | physical, emotional, spiritual, daily_ritual, shadow, integration | **Everyone signed in, free and Luminary.** Free members receive all six columns in the browser and the UI only blurs them. |
| `src/pages/Triad.tsx:314` (Lenses) | combination_title, triad_number, integration_invitation, daily_ritual | Luminary only (`isLuminary` gate) |

Both filter by the member's own `natal_sun_sign`, `natal_moon_sign` and today's transiting Moon sign.

What a free member actually sees (`DailyForecast.tsx`): the first two sentences of `physical_guidance` (rest blurred),
and the first 8 words of `emotional_guidance` as a locked teaser. Everything else is behind `isPro`.

## 3. Design

- **Luminary member**: RLS policy on the table. Own Sun + Moon only (12 of 1,728 rows), all columns. The two existing
  Luminary queries work unchanged.
- **Free member**: no rows from the table. They get `public.get_my_triad_preview(transiting_moon_sign)`, which returns
  only the teaser the UI already shows, cut on the server (two sentences / 8 words). It takes no Sun or Moon argument,
  so it cannot be pointed at another combination.
- **anon**: no grants, no policy, no execute on the function. Same for the backup table.
- **service_role**: unchanged.

This split needs a function because column privileges and RLS cannot express "different columns for different tiers
of the same row".

## 4. What the app would break on (and the fix)

1. **Free members' Today tab (the real change). DONE, commit 76a7a3f, live and safe before the SQL.** Without a patch their
   direct read would return nothing and they would fall through to the generic forecast. The patch below calls the function
   and falls back to the old read (narrowed to the two teaser columns) while the function does not exist. Shape of the change:

   ```ts
   // useLunarForecast(birthMoonSign, currentMoon, natalSunSign, isPro = true)  and  DailyForecast passes isPro
   let dbTriad: Partial<TriadData> | null = null;
   if (isPro) {
     ({ data: dbTriad } = await supabase.from("triad_states").select(SIX_COLUMNS)
       .eq("natal_sun_sign", natalSunSign).eq("natal_moon_sign", birthMoonSign)
       .eq("transiting_moon_sign", currentMoon.sign).maybeSingle());
   } else {
     const { data, error } = await supabase.rpc("get_my_triad_preview", { p_transiting_moon_sign: currentMoon.sign });
     if (error) { /* function not there yet: old read */ ... } else dbTriad = data?.[0] ?? null;
   }
   ```
   plus an update to `src/test/useLunarForecast.test.ts` (it asserts the six-column select for a member). The other four
   `TriadData` fields stay `""` for free members, which the UI already treats as locked.
2. **Members whose profile has no natal pair.** The policy matches `user_profiles.natal_sun_sign/natal_moon_sign`. The page
   itself falls back to a Sun computed from the birthday and to the legacy `moon_sign` (`Blueprint.tsx:86-87`). Anyone with
   a null natal column finds no row and sees the generic forecast (tested for both free and Luminary paths). Pre-flight,
   2026-10-23: 21 members, **1 with no natal pair (no birthday on file), 0 of them paid**; 0 members whose natal Moon differs
   from the legacy `moon_sign`; the 2 paid members both have a natal pair. `Triad.tsx` (Lenses) already treats "no row" as the generic panel.
3. **"Paid" is judged by profile flags in the database, but the app also trusts a live Stripe check** (`subscription.subscribed`
   in `isLuminaryMember`). Someone just subscribed whose flags have not been written yet sees the generic Triad for those
   moments. The stripe-webhook and check-subscription functions write the flags with the service role.
4. **Scripts that run without a service key** (`generate-triads.ts`, `fix-missing-triads.ts`) fall back to the anon key and
   would stop working (and could not have written anyway: anon has no write privilege). `.env.local` has a valid service-role key
   for this project, so they use it. `regen-flagged-triads.ts` has no anon fallback at all: it exits without the service key.
5. Nothing else reads the table. `BlueprintFixture.tsx` and the Vitest suites mock the client, so they are unaffected.

## 5. Order to apply (when you give the go)

0. Wait until the Triad rewrite session has finished writing rows (the lockdown does not touch the service role, but wait anyway).
1. Run `triad_states_lockdown_preflight.sql` (read-only, one result); save the output.
2. The app patch from section 4.1 is already shipped.
3. Apply `triad_states_lockdown.sql` (one transaction; idempotent; it also runs `notify pgrst, 'reload schema'`).
4. Run `triad_states_lockdown_tests.sql` blocks A to E with a real free and paid member, then the anonymous probe:
   `npx tsx scripts/probe-anon-access.ts --expect-denied triad_states triad_states_backup_2026_10_21` (expect PASS) and
   `npx tsx scripts/probe-anon-access.ts blog_posts transits moon_transitions guest_astrologers` (public content unchanged).
5. Open the Today tab as a free and a Luminary member.
6. If anything is wrong: `triad_states_lockdown_rollback.sql` (puts the public read back, i.e. the insecure state).

## 6. How the draft was checked

The apply, tests and rollback scripts were run against a throwaway in-memory Postgres (PGlite) holding a stub of the
roles, `auth.uid()`, `user_profiles` and a 1,728-row `triad_states` stand-in with a stray pre-existing policy.
Before the lockdown the tests failed (the hole is detected); after it all five blocks passed; re-applying passed again;
the rollback restored anonymous read; re-locking closed it. A stub is not Supabase: the first real run should be
the pre-flight plus the tests, on the project, in your hands.

Also: no key needs rotating (the anon key is public by design), but treat the 1,728 rows as already copied. Anyone who
ran the probe has the text; the lockdown stops new reads, it cannot recall old ones.
