# Moonday Live — Automation Architecture

Source of truth for every scheduled/automated job. Update this file whenever a
cron job, edge function, or n8n workflow changes.

_Last verified: 2026-07-31_

---

## 1. Scheduled jobs living in Lovable Cloud (pg_cron)

| Job name | Schedule (UTC) | Calls | Purpose |
|---|---|---|---|
| `generate-blog-draft-every-2-days` | `0 12 */2 * *` | `generate-blog-draft` | AI writes a blog draft + a ready-to-paste Reddit post, `status: 'draft'`, `publish_at` ≈ +2.5 days |
| `auto-publish-blog-posts` | `0 */12 * * *` | `auto-publish-posts` | Flips `approved` → `published` once `publish_at` has passed |
| `notify-moon-ingress` | `*/15 * * * *` | `notify-moon-ingress` | Emails Sovereign members ~2h before a moon sign change |

All three are authenticated with an `X-Cron-Secret` header checked against the
`cron_secrets` table.

---

## 2. The n8n workflow (external, DigitalOcean)

> This section is written from screenshots, not introspection. Keep it current
> by hand, or paste the exported workflow JSON into
> `src/docs/n8n/moonday-transit-approval.json`.

**Node chain:** `Schedule Trigger` → `HTTP Request` → `Code (JavaScript)` →
`Wait` → `Gmail: Send message and wait for response` → `If`

| Node | What it does |
|---|---|
| Schedule Trigger | Fires on a clock (own schedule, unrelated to pg_cron) |
| HTTP Request | `GET https://moondaylive.com/...` — pulls transit/ingress data from the site |
| Code (JavaScript) | Builds the blog + Reddit copy payload |
| Wait | Holds until the pre-transit send window |
| Gmail (send & wait) | Emails **you** the draft and waits for your approve/reject reply |
| If | Branches on your answer |

**Dependency risk:** the HTTP Request node points at a live endpoint on this
site. If that route or its JSON shape changes, the workflow fails silently.
Any change to the endpoint it calls must be noted here.

---

## 3. The duplication

There are **two independent content engines** producing the same kind of
artifact (a Moonday blog post + a Reddit post about a moon transit), on two
different clocks, with no awareness of each other:

```text
              ┌─ pg_cron every 2 days ──► generate-blog-draft ──► blog_posts (draft)
transit copy ─┤                                                        │
              └─ n8n Schedule Trigger ──► HTTP + Code ──► Gmail ──► you approve
```

Concretely:

- **Same topic.** `generate-blog-draft` picks a rotating moon sign and titles
  the post "The Moon Enters {Sign}…". The n8n workflow is also transit-driven.
  On overlapping days you get two posts about the same ingress.
- **Different clocks.** pg_cron runs every 48h at 12:00 UTC. n8n runs on its
  own trigger tied to the transit. They drift in and out of collision.
- **Different approval paths.** pg_cron drafts sit silently in `/admin/blog`
  until you remember to open it. n8n emails you. Same decision, two inboxes.
- **Only one writes to the DB.** `generate-blog-draft` inserts into
  `blog_posts`. The n8n path ends in your email — approved copy still has to be
  pasted somewhere.

### The intended split (decided 2026-07-31)

| Engine | Owns | Trigger |
|---|---|---|
| **n8n** | Transit content — the moon-sign-change posts | Transit-driven, pre-ingress |
| **Gem / `generate-blog-draft`** | Evergreen content — guides, offers, non-transit filler | Its own slower clock |

To make that real, `generate-blog-draft` should stop titling every post
"The Moon Enters {Sign}" and instead pull from an evergreen topic pool. That is
the one code change the split requires; it is **not yet made**.

---

## 4. Content lifecycle

```text
draft ──(you approve in /admin/blog)──► approved ──(auto-publish-posts, publish_at reached)──► published
```

- Unapproved drafts older than 7 days: safe to delete (no cleanup job exists yet).
- Published posts: keep forever.

---

## 5. Known gaps

- No admin approval email from the Lovable Cloud side (n8n covers this for transits only).
- No cleanup job for stale drafts.
- No failure alerting if `generate-blog-draft` errors.
- n8n workflow JSON is not stored in the repo.
