# Database backup (manual)

A manual backup of the live Supabase project `ggrhuhwxbwrfbbcwcrmv`, run from Windows PowerShell. It never touches the
legacy project.

## One-time setup

The database runs PostgreSQL 17, so the script needs the **version 17 client tools** (`pg_dump` and `psql`). No Docker.

```powershell
winget install PostgreSQL.PostgreSQL.17
```

In the installer you can untick everything except **Command Line Tools** (you do not need the server). If you install
them somewhere unusual, pass `-PgBin "C:\path\to\PostgreSQL\17\bin"`.

You also need the **database password**: Supabase dashboard > Project Settings > Database. It is not the same as an API
key. If you do not have it, reset it there (this changes the password the app uses only if you also store it elsewhere;
the app itself uses API keys, not this password).

## Run it

From the repo root in the WebStorm terminal:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\backup-db.ps1
```

With a second copy (a cloud-synced folder or external drive):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\backup-db.ps1 -CopyTo "D:\MoondayBackups"
```

To check the tools and folders first without a password or any connection, add `-CheckOnly`.

The script asks for the database password with a hidden prompt. The password is only held in that process while the dump
runs. It is not saved, printed, or passed on a command line.

## What you get

A dated folder, `C:\Backups\moonday\YYYY-MM-DD_HHMM\` (the script refuses any folder inside the repo):

| File | Contents |
|---|---|
| `public.sql` | The public schema: tables, functions, row-level-security policies, grants, and all the data |
| `auth-data.sql` | `auth.users` and `auth.identities` (data only): the accounts and how they sign in |
| `cron-jobs.sql` | The pg_cron job definitions as `cron.schedule(...)` statements |
| `manifest.json` | File sizes, SHA-256 hashes, the pg_dump version. No secrets |

The folder contains personal data (emails, hashed passwords). Keep it private: never in the repo, never in a shared
folder. The cron commands can also contain keys or URLs, so treat `cron-jobs.sql` as secret too.

The script checks that each dump finished and that a `-CopyTo` copy matches the hashes. If it prints `BACKUP FAILED`,
do not rely on that folder.

## How often

- **Before any database change**: a migration, a data fix, a bulk edit, a policy change.
- **Weekly**, even when nothing changed. Supabase's own backups depend on your plan; this is the copy you control.

## Restore into a fresh Supabase project

> **Warning: restoring overwrites and duplicates data.** Restore only into a new, empty project, never into the live
> one. To get a few rows back from a backup, restore into a scratch project and copy those rows out. Restoring into the
> live project can overwrite current data and cannot be undone.

1. Create a new Supabase project (same region if you can). Note its project ref and database password.
2. Database > Extensions: enable `pg_cron` and `pg_net` (the cron jobs need both).
3. Restore, in this order. Use the new project's pooler details (Project Settings > Database > Connection string,
   "Session pooler"). `psql` asks for the password itself.

   ```powershell
   $conn = "host=aws-0-us-east-1.pooler.supabase.com port=5432 dbname=postgres user=postgres.NEWPROJECTREF sslmode=require"
   $dir  = "C:\Backups\moonday\2026-11-01_0900"

   # 1. accounts first, because the public tables point at auth.users
   psql $conn -c "set session_replication_role = replica" -f "$dir\auth-data.sql"

   # 2. the public schema and its data
   psql $conn -c "set session_replication_role = replica" -f "$dir\public.sql"
   ```

   "already exists" messages on the `public` schema itself are harmless. Read any other errors before going on.
4. Open `cron-jobs.sql`, replace the old project URL (`ggrhuhwxbwrfbbcwcrmv`) with the new one, then run it with
   `psql $conn -f "$dir\cron-jobs.sql"`. Re-create the Vault secrets first (below), because some jobs read them.
5. Re-create everything in the next section, redeploy the Edge Functions
   (`supabase functions deploy <name> --project-ref NEWPROJECTREF`), re-apply the auth email templates, and point Vercel
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) and the Stripe webhook endpoint at the new project.
6. Check a sign-in, a Blueprint load and `select count(*)` on the main tables before treating it as good.

## NOT in the backup

| Not included | Where it lives | What to do |
|---|---|---|
| **Storage files** (for example the `transit-images` bucket) | Supabase dashboard > Storage | Download them, or `supabase storage cp -r ss:///bucket ./folder --experimental`. The images can also be regenerated with `scripts/populate-transit-images.ts` if the sources are in the repo |
| **Edge Function secrets** | Supabase dashboard > Edge Functions > Secrets. Values cannot be read back | Keep every value in your password manager. Names the code reads: `ADMIN_ALERT_EMAIL`, `ALERT_EMAIL`, `CRON_SECRET`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`, `GEMINI_API_KEY`, `LOVABLE_API_KEY`, `LOVABLE_SEND_URL`, `MAKE_SOCIAL_SECRET`, `MAKE_SOCIAL_WEBHOOK_KEY`, `MAKE_SOCIAL_WEBHOOK_URL`, `N8N_SUBSTACK_WEBHOOK_URL`, `REDDIT_DEFAULT_SUBREDDIT`, `REDDIT_WEBHOOK_URL`, `RESEND_API_KEY`, `SEND_BLUEPRINT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUBSTACK_DRAFT_EMAIL`, `SUBSTACK_WEBHOOK_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TRANSIT_REVIEW_RECIPIENT`, `TURNSTILE_SECRET_KEY` (the `SUPABASE_*` ones are set by Supabase) |
| **Vault secrets** (for example `make_social_secret`) | Supabase dashboard > Database > Vault. Not dumped, and the stored values are encrypted with the project's own key | Keep the values in your password manager and re-create them in the new project |
| Edge Function code, migrations, auth email templates | This repo (git) | Redeploy from git |
| Other `auth` tables (sessions, MFA factors, refresh tokens), auth settings (providers, redirect URLs, SMTP) | Supabase dashboard > Authentication | Members sign in again after a restore. Re-check the auth settings by hand |
| Stripe customers, subscriptions, prices | Stripe (live mode) | Nothing to restore; the app re-syncs access from Stripe events |

Backed up in `public.sql` even though it looks secret-like: `public.cron_secrets` and `public.mfa_backup_codes`. That is
one more reason to keep the backup folder private.
