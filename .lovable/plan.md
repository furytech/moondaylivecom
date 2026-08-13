# Onboarding Your Astrologer: Admin Access + Sovereign Access

## 30,000 Feet

Two separate doors, two separate keys:

```text
   DOOR 1 — Admin (Journal)          DOOR 2 — Sovereign (Member)
   /admin/login                      /pricing -> Stripe checkout
   role = admin in user_roles        100%-off forever coupon
   edit + schedule posts             full member experience
```

They are independent: giving him admin does NOT give him Sovereign, and
Sovereign does not give him admin. He needs both, and both hang off the
same account/email.

## 10,000 Feet — The Five Puzzle Pieces

1. Account exists — he signs up normally at the site with his email.
2. Admin role — we grant `admin` to his user ID in the roles table.
3. Sovereign access — he checks out with the forever 100%-off coupon.
4. Verify — confirm admin panel loads and his profile shows Sovereign.
5. Hand-off — send him a short instruction note with both steps.

## Ground Level — The Detailed Steps

### Piece 1: He creates the account (his action)
- Go to the site, Sign Up, enter email + password + birthday.
- Confirm the verification email.
- Reason we don't create it for him: the password should be his, and the
  birthday drives his personal moon data.

### Piece 2: Grant admin (my action, ~1 minute)
- Look up his user ID by email.
- Insert a row granting the `admin` role for that user.
- Nothing is hardcoded and no client-side flag is used — the gate checks
  the server-side role function on every visit.
- Result: `/admin/login` accepts him and the Journal admin loads.

### Piece 3: Sovereign via coupon (his action, my instructions)
- Do we need a coupon? Yes — Stripe checkout always runs, so the clean
  way to give lifetime access is a 100%-off forever coupon rather than
  editing the database (subscription state re-syncs from Stripe and would
  overwrite a manual edit).
- Existing forever coupon: `TsGOsFVS` (case-sensitive, 100% off forever).
  I will confirm it is still active and, if it has usage limits, create a
  fresh single-use forever coupon reserved for him.
- He goes to Pricing, starts Sovereign checkout, clicks "Add promotion
  code", enters the code, and completes checkout. Total shows $0.00.
- A real card may still be requested by Stripe for verification; it is
  never charged while the coupon is applied.

### Piece 4: Verification (my action)
- Confirm the admin role row exists and the role check returns true.
- Confirm his subscription record reads active/Sovereign after checkout.
- Confirm the Journal admin screens render for his account.

### Piece 5: Hand-off note
- A short copy-paste message for him: sign-up link, the coupon code,
  where the admin login lives, and what he can safely edit.

## Technical Notes

- Admin gating is unchanged: `AdminRoute` calls the server-side
  `has_role(uid, 'admin')` check; roles live in the dedicated roles table,
  never on the profile record.
- No schema changes and no new code are required for admin access — this
  is a data grant plus verification.
- No changes to the Stripe integration; only a coupon is used.

## What I Need From You

- His email address (the exact one he will sign up with).
- Confirmation of when he has finished signing up, so I can grant the role.
