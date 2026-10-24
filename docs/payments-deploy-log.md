# Payments hardening: deploy log and rollback (2026-10-23)

Project ref: ggrhuhwxbwrfbbcwcrmv. Versions below are what was live **before** this change
(`supabase functions list --project-ref ggrhuhwxbwrfbbcwcrmv`).

| Function | Version before | ezbr_sha256 before | verify_jwt |
|---|---|---|---|
| stripe-webhook | 20 | 0756fd83c4d14bfae89a78c9106124b338a868864f0d5f91efe63c3e2b2daf0d | false |
| check-subscription | 19 | 15d0e599d16467dfa5b9206e94462143b9a2be896447e4535dcccd3b7215e33e | false |
| create-checkout | 20 | 46bfdb7aff86b7be7d3bdda12ea5901092fec0077d55ce9361c260404eae6653 | false |

## Roll back
The previous source is in git at the commit before this change (`git log -- supabase/functions/stripe-webhook`).

```powershell
git checkout <commit-before-payments-hardening> -- supabase/functions
supabase functions deploy stripe-webhook --no-verify-jwt --project-ref ggrhuhwxbwrfbbcwcrmv
supabase functions deploy check-subscription --no-verify-jwt --project-ref ggrhuhwxbwrfbbcwcrmv
supabase functions deploy create-checkout --no-verify-jwt --project-ref ggrhuhwxbwrfbbcwcrmv
```

Always keep `verify_jwt = false` on stripe-webhook, or Stripe's deliveries are rejected.

## Event-ID dedupe table
`supabase/migrations/20261023120000_stripe_webhook_events.sql` creates `stripe_webhook_events`.
APPLIED 2026-10-24 in the Supabase SQL editor (table confirmed live, dedupe active, no redeploy needed).
If the table were ever missing, stripe-webhook logs a warning and processes every event (no dedupe).

## Later deploys (project ggrhuhwxbwrfbbcwcrmv; all with `--no-verify-jwt`)

| Date | Function | Version | Why | Before |
|---|---|---|---|---|
| 2026-10-24 | save-pending-moon-sign | v1, then v2 | New: saves the Moon-change quiz result before email confirmation; v2 checks the sign against the birth date | none (new function) |
| 2026-10-24 | customer-portal | v21 | Profile lookup selected a column that does not exist, so paying members got a 403 | v20, sha 5fff50bc3afbe042d9ffe8eb77ea3a375da1862f9c63efc5501b3cef0466637d |
| 2026-10-24 | create-checkout | v22 | Return URLs use the member's own allowlisted host | v21 (the hardening deploy above) |

Current: stripe-webhook v21, check-subscription v20, create-checkout v22, customer-portal v21, save-pending-moon-sign v2.

### Roll back customer-portal (to v20 source)
The v20 source is the broken lookup (it selects a column that does not exist and locks paying members out),
so roll back only to compare, not to restore service.
```powershell
git checkout a6d73e3 -- supabase/functions/customer-portal
supabase functions deploy customer-portal --no-verify-jwt --project-ref ggrhuhwxbwrfbbcwcrmv
```

### Roll back create-checkout (to v21 source: fixed canonical return host)
```powershell
git checkout a45f156 -- supabase/functions/create-checkout
supabase functions deploy create-checkout --no-verify-jwt --project-ref ggrhuhwxbwrfbbcwcrmv
```
(`_shared/checkoutUrls.ts` can stay; the older source does not import it.)

### Roll back save-pending-moon-sign (to v1: no birth-date check)
```powershell
git checkout 891c2d2 -- supabase/functions/save-pending-moon-sign supabase/functions/_shared/pendingMoonSignRules.ts
supabase functions deploy save-pending-moon-sign --no-verify-jwt --project-ref ggrhuhwxbwrfbbcwcrmv
```
Run `git checkout main -- supabase/functions` afterwards to put the working tree back.
