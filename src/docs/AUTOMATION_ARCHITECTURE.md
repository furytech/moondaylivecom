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

Exported JSON committed at `src/docs/n8n/moonday-transit-approval.json`
(workflow id `JTI8KnOgrO3sluG1`, name "My workflow"). Re-export and overwrite
that file whenever the workflow changes.

**Node chain:** `Schedule Trigger` → `HTTP Request` → `Code (JavaScript)` →
`Wait` → `Gmail: Send message and wait for response` → `If`

| Node | What it does |
|---|---|
| Schedule Trigger | Cron `0 */6 * * *` — every 6 hours |
| HTTP Request | `GET https://moondaylive.com/api/next-ingress` |
| Code (JavaScript) | Reads `ingress_utc`, `next_sign`, `current_sign`; computes `resumeAt` = 1h pre-ingress, shifted to 18:30 America/New_York if it lands in the 19:00–05:00 quiet window; builds hardcoded `blog_content` and `reddit_content` template strings |
| Wait | Resumes at `resumeAt` |
| Gmail (send & wait) | Emails `mindglimmer@gmail.com`, subject "Review or Edit", double approval, with admin edit links |
| If | Checks `$json.approved == "approve"` — **no nodes connected on either branch** |

**Status: `active: false`. The workflow is not running.**

### Known defects (verified 2026-07-31)

1. ~~**`/api/next-ingress` does not exist.**~~ **FIXED 2026-07-31.** A real
   endpoint is now deployed as the `next-ingress` edge function. Point the n8n
   HTTP Request node at:
   `GET https://hzlpnmvboqhzthvjlves.supabase.co/functions/v1/next-ingress`
   (no auth required, 5-minute cache). Response shape:

   ```json
   {
     "generated_at": "2026-07-31T12:31:32.285Z",
     "source": "moon_transitions",
     "current_sign": "Pisces",
     "current_element": "Water",
     "next_sign": "Aries",
     "next_element": "Fire",
     "from_sign": "Pisces",
     "ingress_utc": "2026-08-02T20:36:43.084Z",
     "ingress_et": "Sunday, August 2, 2026 at 4:36 PM",
     "hours_until": 56.1,
     "minutes_until": 3365,
     "blog_slug": "moon-enters-aries-2026-08-02",
     "sign_image_url": "https://moondaylive.com/assets/signs/aries.png",
     "blueprint_url": "https://moondaylive.com/blueprint"
   }
   ```

   Data comes from `public.moon_transitions` (seeded daily by
   `seed-moon-transitions`). If no future row exists, the function computes the
   ingress live with astronomy-engine, so it can never return fake data.
   `source` tells you which path was used.

2. **Content is not AI-generated.** `blog_content` and `reddit_content` are
   fixed template literals in the Code node with the sign names interpolated.
   No Gemini/LLM call anywhere in the workflow.
3. **`/admin/reddit` does not exist.** Routes are `/admin/blog` and
   `/admin/subscribers` only. The Reddit edit link 404s.
4. **`?sign=` is not read.** `/admin/blog` ignores the query param.
5. **Approval is a dead end.** The `If` node has no outputs wired, and nothing
   ever writes to `blog_posts`. Approving does nothing.
6. **Quiet-hours math bug.** `postTime.setHours()` uses the server's local
   timezone, but `localHour` was computed in America/New_York. On a UTC droplet
   these disagree by 4–5 hours.


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
