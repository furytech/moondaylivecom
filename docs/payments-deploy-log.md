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
Until it is applied, stripe-webhook logs a warning and processes every event (no dedupe), which
is the same behavior as before. Once applied, dedupe starts with no redeploy.
