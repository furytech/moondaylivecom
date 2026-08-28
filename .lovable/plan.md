# Admin Panel + Distribution Refactor

## 30,000-foot view

Four moving pieces, in this order:

1. **Declutter the Journal admin** — one card per transit, one distribution pill, everything granular behind a drawer.
2. **Substack goes hands-off** — drafts pushed automatically at each ingress, no copy/paste.
3. **Reddit gets smart routing** — the sign of the ingress decides the subreddit, and the copy is written for that room.
4. **Backup** — a rollback point preserved before anything ships.

## Piece 1 — Admin interface cleanup

Today each transit card stacks three near-identical channel rows (Blog / Substack / Reddit), each with its own buttons. Replacing that with:

- **One status pill per card:** `Distribution: Ready · 2/3 sent`, colour-coded (all sent = champagne, partial = amber, failure = red).
- **A "Distribution" drawer:** tapping the pill opens a modal holding the per-channel rows exactly as they work now — publish, schedule, approve, copy, preview JSON, retry, dispatch history. Nothing is removed, only relocated.
- **Card face keeps only:** title, sign, transit date/time, approval pill, and Edit / Get image / Delete.
- **Midnight Luxe tokens applied consistently:** `sov-obsidian` surfaces, champagne hairlines, ivory type, the existing 0.05 noise overlay, uniform card height and justified body text. No new colours invented; all pulled from `src/index.css` tokens.

Result: the feed reads as a list of transits, not a wall of channel buttons — and it works the same on phone as desktop.

## Piece 2 — Substack automated pipeline

The scheduler already fires at each ingress and already builds the exact Substack payload. Changes:

- On ingress publish, the draft is pushed straight into Substack through the n8n Substack endpoint, with title, subtitle, body HTML, image and CTA already assembled.
- A single system setting decides the landing state: **review-ready draft** (default) or **auto-publish**. Switchable from the admin without a code change.
- Every push is written to the dispatch log with its response, so the audit page shows success/failure per transit.
- The duplicate guard stays: a transit can never be pushed twice without an explicit confirm.

Note: Substack has no public write API. The push runs through the existing n8n workflow using the session-cookie draft endpoint described in the Substack workaround spec. That workflow must hold a valid session cookie; if it expires, the dispatch log records the failure and the admin shows it rather than silently dropping.

## Piece 3 — Dynamic Reddit routing

- A sign-to-subreddit map lives in the content engine: e.g. Capricorn / Saturn-flavoured ingresses route to the technical rooms (r/astrology, r/AdvancedAstrology), water-sign ingresses route to the reflective rooms, and a default fallback catches everything else.
- The chosen subreddit is stamped into the Reddit payload automatically, so no channel picking during a transit shift.
- Reddit copy generation shifts register: peer-to-peer technical tracking breakdown — degrees, timing, aspect condition — written for readers who already know the vocabulary, ending with a natural invitation to track the cycle live on moondaylive.com.
- The subreddit is visible in the admin preview before approval, and overridable per post.

## Piece 4 — Safety and backup

Before deploy: confirm the current state is committed and synced so there is a clean rollback point, then ship. Version history in the editor gives instant revert if anything looks wrong.

## Technical notes

- `src/components/admin/ChannelMatrix.tsx`: card face slims to header + actions; channel rows move into a new `DistributionDrawer` component reusing the existing action handlers unchanged.
- `src/pages/admin/BlogAdmin.tsx`: passes the same handlers to the drawer; adds distribution-state derivation (`sentCount / 3`).
- `supabase/functions/_shared/dispatchPayloads.ts`: adds subreddit resolution from `zodiac_sign_tag`; `buildRedditPayload` stops returning a static default subreddit.
- New `supabase/functions/_shared/subredditRouting.ts` holding the map.
- `supabase/functions/_shared/transitContent.ts`: Reddit prompt rewritten for technical peer register.
- Substack auto-state stored as a row in a small settings table (or reused `email_send_state` pattern) and read by `substackPublish.ts`.

## Open question

For Substack default landing state — draft for your review, or straight to publish?
