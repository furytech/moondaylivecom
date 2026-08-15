# Journal Automation: Telegram In, Twilio & Reddit Out

## 30,000 feet

Three moves, in order:

1. **Subtract** — strip Reddit and Twilio out of the publishing pipeline so the admin dashboard stops reporting on channels we don't actually run.
2. **Replace** — a free Telegram bot becomes the notification spine: it pings you when a post publishes or needs approval, with a tap-through link straight to the right row in the journal admin.
3. **Polish** — rebuild the journal admin so every control that exists on desktop also exists, and is thumb-friendly, on a phone.

After this, the channel picture is: **Moonday Blog** (automated) and **Substack** (manual copy-paste, nudged by Telegram). Nothing else claims to be scheduled.

---

## Puzzle piece 1 — Remove Reddit and Twilio

- Delete the Reddit row from the Channel Matrix, the Reddit editor panel, Reddit copy/mark-posted actions, and the Reddit draft builder.
- Drop Reddit from draft generation (`transitContent`, `generate-blog-draft`, `fill-transit-schedule`, `publish-transit-draft`) so new drafts no longer carry Reddit copy.
- Remove Reddit from the "not sent" / missed-delivery accounting — no more false alarms.
- No Twilio code was ever written, so this is only about dropping it from the plan and docs. No SMS credentials will be requested.
- **Database columns stay in place** (`reddit_post`, `reddit_status`, `reddit_scheduled_at`, `reddit_posted_at`). They go dormant rather than deleted, so historical Reddit copy isn't destroyed and the decision is reversible.

## Puzzle piece 2 — Telegram notification bot

**What you do once (2 minutes, free, no billing):**
1. In Telegram, message `@BotFather` → `/newbot` → name it *Moonday Live* → it hands you a bot token.
2. Message your new bot once (say "hi") so it's allowed to message you back.
3. Connect it here, and save your admin chat ID.

**What gets built:**
- A `telegram-notify` backend function that sends a formatted message through the Telegram connector.
- Two triggers:
  - **Published** — when the hourly publisher takes a post live, you get "🌙 Moon in Libra is live" with a link to the post.
  - **Needs approval** — when a draft is created for an upcoming transit, or a Substack edition is due, you get a nudge with a deep link to `/admin/blog?post=<id>` that opens straight into that post's editor.
- A **Test Telegram** button in the journal admin so you can confirm delivery without waiting for a transit.
- Failures are logged to the existing `system_errors` table, so a silent bot surfaces on `/admin/errors`.

## Puzzle piece 3 — Mobile parity for the journal admin

- The post editor moves into a **responsive shell**: modal dialog on desktop, bottom drawer on mobile — full height, scrollable, with a sticky Save/Cancel bar always in reach.
- The Channel Matrix table collapses into **stacked cards** below the tablet breakpoint: channel name, status pill, UTC time, and actions as full-width tap targets (min 44px), not cramped text links.
- The filter chips and search bar become a horizontally scrollable strip so all filters stay reachable without wrapping into a wall.
- The schedule picker and Substack preview get the same drawer treatment.
- Everything keeps the existing dark UI, current button styles, and the deep-navy/lilac tokens — no new visual language.

---

## Technical notes

- Telegram goes through the Lovable connector gateway; the bot token is never in app code. Admin chat ID stored as a backend secret.
- New function: `supabase/functions/telegram-notify/index.ts`, invoked server-side from `auto-publish-posts` and `fill-transit-schedule`.
- New component: `src/components/ui/responsive-modal.tsx` — a Dialog/Drawer switch driven by the existing `useIsMobile` hook, reused by the editor, scheduler and Substack preview.
- `ChannelMatrix.tsx` gains a card layout branch; `Channel` type narrows to `"blog" | "substack"`.
- `BlogAdmin.tsx` reads a `?post=` query param on mount to open the editor for the linked post.
- No schema migration is required.

## Deliberately not doing

- No Reddit API posting, now or in this pass.
- No SMS. Telegram fully replaces it.
- No destructive database changes.
