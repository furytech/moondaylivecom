# Substack Auto-Draft Workaround — Build Spec

Substack has **no public write API**. Everything below is the supported-enough
workaround set, in order of reliability. Moonday's side is already done: we POST
a complete JSON payload to an n8n webhook. All remaining work is inside n8n.

---

## 1. What Moonday already sends

**Endpoint (configurable via `SUBSTACK_WEBHOOK_URL` secret):**

```
POST http://192.241.153.228:8055/webhook/substack-post
Content-Type: application/json
```

Fires when: an admin taps **Approve** on the Substack row, or the internal
scheduler reaches `substack_scheduled_at` (inherits the transit's `publish_at`).

**Payload (exact keys, from `_shared/dispatchPayloads.ts`):**

```json
{
  "post_id": "uuid",
  "slug": "the-moon-enters-virgo-...-2026-09-09",
  "title": "The Moon Enters Virgo: What to Feel, Notice, and Release",
  "body": "<markdown newsletter copy>",
  "content": "<same as body>",
  "excerpt": "short teaser",
  "subject": "<same as title>",
  "status": "publish",
  "scheduled_time": "2026-09-09T19:34:56.796Z",
  "scheduled_at": "same",
  "zodiac_sign": "Virgo",
  "image_url": "https://moondaylive.com/assets/signs/Virgo.png",
  "image_html": "<img src=\"...\" width=\"600\" style=\"display:block;margin:0 auto 24px;max-width:100%;height:auto;\" />",
  "source_url": "https://moondaylive.com/blog/transits/<slug>",
  "canonical": "same as source_url"
}
```

**Response contract n8n should return** (we persist it in `dispatch_logs`):

```json
{ "ok": true, "substack_draft_url": "https://moondaylive.substack.com/publish/post/12345", "external_id": "12345" }
```

Non-2xx or `{ "ok": false, "error": "..." }` marks the dispatch failed and the
admin card shows a NOT SENT warning. Duplicate protection already runs on our
side (we check `dispatch_logs` for a prior success before re-firing).

---

## 2. Option A — Unofficial Substack draft API (recommended)

Substack's own web app calls a private JSON API. With a logged-in session cookie
it works from n8n with plain HTTP Request nodes — no browser needed.

**Credential to capture once (manually, from a desktop browser):**
1. Log in to Substack, open DevTools → Application → Cookies for `substack.com`.
2. Copy the values of `substack.sid` (and `substack.lli` if present).
3. Store in n8n as a Header Auth credential:
   `Cookie: substack.sid=<value>; substack.lli=1`
4. Also copy your publication host, e.g. `moondaylive.substack.com`.

**Create draft:**
```
POST https://moondaylive.substack.com/api/v1/drafts
Headers: Cookie: <session>, Content-Type: application/json, Origin/Referer: https://moondaylive.substack.com
Body:
{
  "draft_title": "{{$json.title}}",
  "draft_subtitle": "{{$json.excerpt}}",
  "draft_body": "<ProseMirror JSON string, see §4>",
  "type": "newsletter",
  "audience": "everyone",
  "draft_section_id": null,
  "canonical_url": "{{$json.canonical}}"
}
```
Returns `{ id: <draft_id>, ... }`.

**Optional — schedule instead of leaving as draft:**
```
POST https://moondaylive.substack.com/api/v1/drafts/{{draft_id}}/schedule
{ "post_date": "{{$json.scheduled_time}}", "email": true }
```
Publish immediately instead: `PUT /api/v1/drafts/{{draft_id}}/publish`.

**Fragility notes:** the cookie expires (weeks to months) and Substack can change
the endpoint shape without notice. Mitigate with: a monthly cookie-refresh
reminder, and n8n `continueOnFail` → Telegram alert on any non-2xx so it degrades
to "copy/paste this one manually" rather than silent loss.

---

## 3. Option B — Browser automation fallback

If the private API path gets blocked, run Playwright/Puppeteer (n8n Execute
Command node or a small container) with a saved `storageState.json` session:

1. `goto https://moondaylive.substack.com/publish/post?type=newsletter`
2. Fill title field, paste body HTML into the editor via clipboard event.
3. Editor autosaves → read draft URL from `page.url()`.
4. Return that URL to Moonday as `substack_draft_url`.

Slower and more brittle than A, but it survives API shape changes. Same session
cookie refresh problem applies.

---

## 4. Body formatting (needed for both options)

Substack's editor stores content as **ProseMirror JSON**, not HTML. Two ways to
get there:

- **Simplest:** send `draft_body` as a ProseMirror doc built from our markdown —
  paragraph nodes plus one `image` node for `image_url` at the top, and a final
  paragraph containing a link to `source_url`.
- **Escape hatch:** many accounts accept an HTML string in `draft_body` and
  Substack converts on open. Test both on one throwaway draft and keep whichever
  round-trips cleanly.

Required layout, in order: hero image (`image_url`) → title/subtitle → newsletter
body → divider → "Read the full transit on Moonday Live" linking `source_url`.

Our `image_html` field already carries a ready-to-embed `<img>` so no image
upload step is required — Substack hot-links our CDN copy fine.

---

## 5. Reddit, while API approval is pending

Same architecture, already wired: we POST to
`http://192.241.153.228:8055/webhook/reddit-approval` with `title`, `body`,
`image_url`, `subreddit`, `scheduled_time`. Once the Reddit app is approved, the
n8n side just swaps in the OAuth credential and calls
`POST https://oauth.reddit.com/api/submit` (`kind=image` with `image_url`, then
an OP comment carrying `body` + `source_url`). No Moonday-side change needed.

---

## 6. Definition of done

- Approving a Substack row in Journal admin creates a real Substack draft within ~30s.
- `dispatch_logs` stores the returned draft URL; admin card links straight to it.
- Image renders in the draft without manual upload.
- Any failure sends a Telegram alert and leaves the row NOT SENT (never a silent success).
- Zero copy/paste in the normal path.
