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
| 2026-10-26 | check-subscription | v21 | Adds cancel_at_period_end and a correct end date to the response; access rules unchanged | v20 (sha 979c758f0016...) |

## make-social-bridge: due-time rule and push mode (2026-10-27)
Before: v25, ezbr_sha256 20d6fc3c8037162125f4b21300918755f7bf406f21d35628ac39671d2ad08868. Then v26 (commit c0e814c: power-hour due rule, push mode).
Rollback to the old behavior (returns every published, unposted transit, no due rule):
```powershell
git checkout 4112b5e -- supabase/functions/make-social-bridge
supabase functions deploy make-social-bridge --no-verify-jwt --project-ref ggrhuhwxbwrfbbcwcrmv
git checkout main -- supabase/functions/make-social-bridge
```

## make-social-bridge: four-state lifecycle, start-time schedule, failure emails (2026-10-27)
Before: v26 (commit c0e814c). Now: v27, ezbr_sha256 256888f5c70280aa4df846c20a3fa0d580a457a139523291e0326be2cbe16703.
Rollback to v26 (power-hour rule, no emails). The `_shared` files are bundled with the function, so check out the shared folder too:
```powershell
git checkout c0e814c -- supabase/functions/make-social-bridge supabase/functions/_shared/socialDue.ts
supabase functions deploy make-social-bridge --no-verify-jwt --project-ref ggrhuhwxbwrfbbcwcrmv
git checkout main -- supabase/functions/make-social-bridge supabase/functions/_shared/socialDue.ts
```
Migrations, both NOT YET APPLIED: 20261027120000_social_push_cron.sql (hourly job `social-push-hourly`), 20261027130000_social_alert_columns.sql (sending / failure / alert columns; the function works without them).
Pause the cron with `select cron.unschedule('social-push-hourly');`
