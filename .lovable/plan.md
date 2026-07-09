## 3-Node Matrix Database Plan

Additive-only migration. No existing table, RLS policy, auth setting, or subscription logic is touched. Only new tables and one new role enum are created.

### Node 1 — `cosmic_weather` (The Container + The Trigger)
Stores each Sun/Moon transit tick that will drive forecast generation.

Columns:
- `id` uuid PK (default `gen_random_uuid()`)
- `trigger_timestamp` timestamptz not null
- `sun_sign_tropical` text
- `sun_sign_sidereal` text
- `moon_sign_tropical` text
- `moon_sign_sidereal` text
- `moon_sign_draconic` text
- `is_processed` boolean not null default false
- `created_at`, `updated_at` timestamptz (standard)

Access:
- Authenticated users: read
- Admins: full write
- Anon: no access (respects "Sovereign-only" content posture; public reads can be added later if we surface it on marketing pages)

### Node 2 — `content_drafts` (Generated payloads awaiting review)
Columns:
- `id` uuid PK
- `cosmic_weather_id` uuid FK → `cosmic_weather(id)` on delete cascade
- `status` text not null default `'pending_review'`
- `app_atmospheric_text` text
- `app_experiential_text` text
- `reddit_payload` jsonb
- `substack_payload` jsonb
- `created_at`, `updated_at` timestamptz

Access:
- Admins only (read + write). No end-user exposure until curated content is copied elsewhere.

### Node 3 — `user_natal_profiles` (The Receptor)
Kept intentionally minimal per the Honest Chart Doctrine (moon-only for Free; no birth time collected). Lives alongside `user_profiles`; does not replace it.

Columns:
- `user_id` uuid PK, FK → `auth.users(id)` on delete cascade
- `natal_moon_tropical` text
- `natal_moon_sidereal` text
- `created_at`, `updated_at` timestamptz

Access:
- Each authenticated user: select / insert / update their own row (`auth.uid() = user_id`)
- Admins: read all (for content targeting)
- No delete from client

### Admin role
No `user_roles` table exists yet. This migration adds the standard secure pattern:
- `app_role` enum with value `admin`
- `public.user_roles(user_id, role)` table with RLS
- `public.has_role(_user_id uuid, _role app_role)` security-definer function

Admin grants are assigned manually via SQL — not from the client. This is the only "structural" addition beyond the three requested tables, and it's required to express "administrators can write" safely (never store roles on `user_profiles`).

### GRANTs (mandatory on every new public table)
```sql
GRANT SELECT ON public.cosmic_weather TO authenticated;
GRANT ALL    ON public.cosmic_weather TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.content_drafts TO authenticated; -- gated by RLS to admins
GRANT ALL    ON public.content_drafts TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.user_natal_profiles TO authenticated;
GRANT ALL    ON public.user_natal_profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL    ON public.user_roles TO service_role;
```

### Triggers
`updated_at` auto-touch via the existing `public.update_updated_at_column()` function on all three new tables.

### What will NOT change
- `user_profiles`, `daily_forecasts`, `moon_*`, `mfa_backup_codes` — untouched
- Auth settings, Stripe/subscription flow, `AuthContext`, edge functions — untouched
- No frontend UI changes in this step; wiring the Matrix dashboard comes in a follow-up once tables exist and the Composio cron can populate `cosmic_weather`

### Docs
Append a short "3-Node Matrix Schema" section to `docs/manual.md` describing the three tables and the admin role pattern.

### Delivery
One migration call containing: enum + `user_roles` + `has_role` + three tables + GRANTs + RLS + policies + `updated_at` triggers. Then a small edit to `docs/manual.md`. No code touching existing components.

Approve and I'll run the migration.
