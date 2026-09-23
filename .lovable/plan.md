# Migration Handoff Package for Moonday Live

## Which assistant to hand off to

Claude. Not because Gemini is weaker, but because the blocker yesterday wasn't the model — it was the approach. Claude kept retrying a direct database-to-database copy, which is impossible here: this platform never exposes the database password or service key, so `pg_dump`, the Supabase CLI link command, and the dashboard's "migrate project" flow all dead-end. No amount of retrying changes that.

Hand off with a package that removes the guesswork instead, so the next assistant executes a checklist rather than exploring.

## The 30,000-foot view

```text
  [ This project ]                    [ Your new stack ]

  Repo (GitHub) ──────────────────▶  WebStorm + Vercel
  Schema (63 migration files) ────▶  New Supabase project
  Table data (SQL inserts) ───────▶  New Supabase project
  Accounts + roles ───────────────▶  New Supabase auth (password resets)
  Backend functions (33) ─────────▶  New Supabase functions
  Secrets list (names only) ──────▶  You re-enter values
  Scheduled jobs ─────────────────▶  Recreated on the new project
```

Five things move. The code already moves itself through GitHub. The other four need the package below.

## What I will produce, in order

**1. Schema file** — one consolidated `schema.sql` built from the 63 migration files: tables, columns, enums, functions, triggers, access rules, and the permission grants. Runs top-to-bottom in a fresh Supabase SQL editor.

**2. Data file** — `data.sql` with insert statements for every table's current contents: posts and all their channel drafts, moon transitions, the sign library, phase texts, doctrine entries, profiles, roles, settings. Ordered so parent rows land before child rows.

**3. Accounts file** — `users.csv` listing every account's email, sign-up date and role. Passwords cannot leave this platform in any form, so accounts get recreated on the new project and each person sets a new password on first sign-in. I'll include the SQL that reattaches roles and profiles once accounts exist.

**4. Backend functions** — already in the repo under `supabase/functions`; I'll add a short deploy script plus the list of scheduled jobs and their timing, which do not travel with the code.

**5. Runbook** — `MIGRATION.md`: numbered steps in order, what to paste where, the secret names to re-enter, the Vercel environment variables, the Make.com URL change at cutover, and a verification checklist to confirm the new site behaves identically.

All five land in Files as one collection you can hand to any assistant.

## Verification before I hand it over

I'll run the generated schema and data files against a throwaway parse check so you don't discover a broken statement three hours into the rebuild, and I'll confirm row counts match table by table.

## What stays running

Nothing here gets switched off. Transit automation, review emails, Telegram alerts and the Make.com bridge keep working until you flip the domain over yourself.

## Two things only you can do

- Create the new Supabase project and paste in the files (the password to it is yours, not mine).
- Re-enter secret values — payment keys, Telegram token, AI keys. I can name every one, never read them out.
