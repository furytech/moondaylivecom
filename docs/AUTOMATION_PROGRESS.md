# Moonday Live — Publishing Automation Progress Log

Last updated: 22 Aug 2026

## Where we are

| Channel | Dispatch | Scheduling | Retry | Status |
| --- | --- | --- | --- | --- |
| Moonday Blog | `auto-publish-posts` (cron) | `publish_at` | n/a | Fully automatic |
| Reddit | n8n webhook `/webhook/reddit-approval` | inherits transit time | `reddit-auto-post` (force) | Automatic via webhook; official Reddit API pending approval |
| Substack | n8n webhook `/webhook/substack-post` | inherits transit time | `substack-auto-post` (force) | Automatic hand-off; final placement depends on n8n nodes |

## Done

- Unified transit card: Blog, Reddit and Substack share one layout, status pills, yellow SCHEDULED badge and countdowns.
- Per-channel date pickers removed — Reddit and Substack inherit the transit's `publish_at`; one-tap **Approve**.
- Distinct copy per channel (blog long-form, Substack newsletter, Reddit TL;DR ≤140 words) with per-channel regenerate buttons.
- `image_url` (falls back to `constellation_graphic_path`) included in every outgoing webhook payload; verified for the Capricorn transit.
- Channel Audit page (`/admin/channel-audit`) showing per-channel health, timestamps and errors.
- Telegram alerts on publish, failure and overdue posts.
- Substack email-to-draft bridge as a manual fallback (`substack-bridge-send`).
- **Fixed 22 Aug:** Channel Audit "Retry now" for Substack called `substack-bridge-send` (email only), so a Failed row could never clear. It now calls `substack-auto-post` with `force`, the same real webhook dispatch Reddit uses, and the toast reports the actual outcome (including skips).

## Next up

1. **Reddit official API** — waiting on Reddit app approval. Once approved, store `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REFRESH_TOKEN`; the webhook path stays as the fallback.
2. **Substack n8n nodes** — confirm the downstream nodes consume `image_url` and place the edition as a draft/scheduled post rather than silently 200-ing.
3. **Webhook response capture** — n8n currently returns an empty 200; have it echo the created permalink/URL so the audit page can link straight to the live post.
4. **Move the webhook host to HTTPS** — plain HTTP is intentional for now, revisit before wider rollout.
5. **Auto-retry** — schedule one automatic retry for failed dispatches before falling back to a Telegram nudge.

## Verification checklist (run before each transit)

- Card shows copy present for all three channels (Substack disabled = empty newsletter body → Regenerate newsletter).
- Reddit and Substack rows read Approved for the transit time.
- `image_url` resolves (200, image/png).
- After the transit, Channel Audit shows all three green; retry any Failed row from that page.
