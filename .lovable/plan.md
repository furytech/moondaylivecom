# Admin Panel Simplification + 4-Channel Share-Intent Model

## 30,000-foot view

Five moving pieces, in this order:

1. **Backup** — snapshot every file we're about to touch into `.backup/admin-rewrite-2026-09-01/` so there's a file-level rollback point on top of editor version history.
2. **Channel model change** — Blog, Reddit, Facebook/Instagram, Pinterest. Substack and the automated Reddit/Facebook API publishers are retired from the panel.
3. **Content engine** — four genuinely distinct drafts per transit, each written for its own audience, each wrapped in a MoondayLive CTA at top and bottom.
4. **Admin panel declutter** — same Midnight Luxe card/grid look, far fewer buttons: per-channel block with copy, share intent, image thumbnail, verification warning.
5. **Review email + timing valve** — the review email mirrors the panel exactly (4 blocks, each with Copy Text + Share Intent + thumbnail), and never lands outside 07:00–16:00.

## Piece 1 — Backup

Copy the current versions of `ChannelMatrix.tsx`, `BlogAdmin.tsx`, `transitContent.ts`, `dispatchPayloads.ts`, the review email template and the notify function into `.backup/admin-rewrite-2026-09-01/` before any edit. Nothing is deleted; retired code stays on disk in the backup folder.

## Piece 2 — Channels

| Channel | Panel block | Publishing method |
| --- | --- | --- |
| Moonday Blog | yes | stays automated (publish / schedule) |
| Reddit | yes | Web Share Intent → `https://reddit.com` (clean window, native community picker) |
| Facebook / Instagram | yes | Web Share Intent (Facebook sharer with prefilled quote + image) |
| Pinterest | yes | Web Share Intent (Pinterest pin-create with image + description) |
| Substack | removed from panel | retired |

Database: add `facebook_post` and `pinterest_post` text columns to `blog_posts`. Existing Substack/Reddit columns stay untouched so nothing breaks and rollback is clean.

Buttons removed from the panel: Publish now / Approve / Mark posted / Preview JSON per channel, Post to Facebook (API), all Substack rows, unschedule-channel controls. What remains per transit card: Edit, Get Image, Delete, plus one block per channel holding text preview, thumbnail, Copy Text and Share.

## Piece 3 — Four personalized drafts

The generator returns four keys instead of three, each with its own prompt and its own audience:

- **Blog** — educational deep-dive: exact degrees, ingress timing, sidereal/tropical framework note, concluding on material scarcity and growth blockages.
- **Reddit** — open-ended community discussion, no marketing tone, body-tracking angle (gut / heart / head), ends on a question.
- **Facebook / Instagram** — clean daily atmospheric forecast, relatable emotional trend, subscribe CTA.
- **Pinterest** — high-hook pin description: keyword phrases, bulleted transit themes, alignment-tracking CTA.

Every block is wrapped with the MoondayLive CTA line/button at top and bottom by the same shared helper, so the copy is identical in panel, clipboard and email.

## Piece 4 — Image verification and parity

- Each channel block resolves the transit's constellation asset from `zodiac_sign_tag` (`src/assets/zodiac/<Sign>.png` → public path), the same path in all four blocks and in the email.
- Verification rule: the asset must be registered as carrying the zodiac name typeset beneath the constellation. This is checked against a manifest of verified assets; anything missing, unmapped, or not marked verified renders an amber validation warning block on the card and in the email.
- A small thumbnail of the verified image sits inside each channel block and beside each email block.

Note: an automated pixel-level OCR check of the PNG at runtime isn't practical inside the panel. The manifest approach gives the same guarantee, verified once per asset, with the warning block firing for anything unverified.

## Piece 5 — Review email + delivery window

- The review email is rebuilt as four independent blocks: title, thumbnail, full copy, **Copy Text** link and a **Share to <platform>** intent link. Reddit's link goes to the clean `https://reddit.com` submission window.
- One **Edit on MoondayLive Admin Panel** link at the bottom. Nothing else.
- Timing valve: the scheduler computes the send instant for each upcoming ingress. If the natural pre-transit send falls outside 07:00–16:00, the payload is held and delivered in the last preceding 07:00–16:00 bracket, so overnight transits arrive the afternoon before.

## Technical notes

- `src/lib/channels.ts` (new): channel definitions, CTA wrapper, share-intent URL builders, zodiac asset resolution + verification manifest. Shared by panel and email builders.
- `src/components/admin/ChannelMatrix.tsx`: rewritten around the four-channel block; keeps existing card shell, borders, pills and tokens.
- `src/pages/admin/BlogAdmin.tsx`: drops the retired handlers and props; keeps edit/schedule/delete/image.
- `supabase/functions/_shared/transitContent.ts`: four-key JSON contract and four prompts.
- `supabase/functions/_shared/transactional-email-templates/transit-review.tsx` (new): the four-block review email; `substack-draft` stays registered but unused.
- Scheduling window logic lives beside the notify function so both the cron and manual sends respect it.

## Open questions

1. Copy for a "Copy Text" button in email: HTML email can't run clipboard JS, so each block's Copy control will be a link that opens the admin panel scrolled to that block's text (one tap, select-free). Acceptable, or prefer the raw text shown inline only?
2. Timing window 07:00–16:00 — in UTC, or in your New York local time?
