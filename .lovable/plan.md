# Content Engine Autonomy

Goal: you stop babysitting the journal admin. The system posts what it can, tells you what it can't, and never shows you a status it can't back up.

## 30,000 feet

Today the blog publishes itself. Reddit and Substack do not — they have scheduler fields that nothing reads, which is why the dashboard looked like it was lying. Four moves fix that:

```text
  TRANSIT DRAFT CREATED (already automated, daily 06:00 UTC)
            |
            v
  BLOG AUTO-PUBLISHES  ---> RSS FEED ---> SUBSTACK auto-imports
     (already working)      (NEW)          (no clicks, ever)
            |
            v
  REDDIT DISPATCHER (NEW cron) ---> posts to r/moondaylive via API
            |                        flips status to SENT itself
            v
  IF ANYTHING FAILS OR STALLS ---> SMS to your phone (NEW)
            |
            v
  ADMIN DASHBOARD = read-only truth, works on your phone (NEW)
```

## The four puzzle pieces

### 1. Reddit: real posting, not a decoy
- Store your Reddit script-app credentials as backend secrets.
- New `post-to-reddit` edge function: authenticates, submits the post to r/moondaylive, writes the returned permalink back to the row, sets status to `sent` with the true timestamp.
- New cron every 10 minutes picks up any row whose Reddit time has passed and is still unsent, then dispatches it.
- Failures are recorded and retried up to 3 times before raising an alert.
- New column stores the live Reddit permalink so the dashboard can link straight to the posted thread.

### 2. Substack: RSS auto-import
- New public RSS feed of published journal posts (full content, so Substack imports the whole piece, not a teaser).
- Admin gets a "Copy RSS feed URL" button; you paste it once into Substack's import setting and never think about it again.
- Because Substack now mirrors the blog automatically, the Substack row stops being a scheduled task. It becomes a mirror indicator: "auto-imports from RSS" with a link, no NOT SENT nagging.
- The manual copy-newsletter button stays for one-off pieces that are not blog posts.

### 3. SMS alerts as an alternative to email
- Store Twilio credentials as backend secrets.
- New `send-sms-alert` edge function.
- New notification preferences: choose Email, SMS, or Both, and enter your mobile number, from a new section of the admin dashboard.
- Wired to the three moments that matter: a draft is waiting for approval, a Reddit post failed, and a post is overdue. Nothing else — no noise.

### 4. Journal admin: full mobile parity
- The channel matrix becomes card-based on small screens instead of a table that overflows.
- Filter chips and the sort toggle collapse into a drawer on mobile; all filters stay reachable.
- Edit and schedule screens become bottom sheets on mobile, dialogs on desktop — same fields, same power.
- Every action target sized for thumbs; the existing dark styling and current button designs are preserved exactly.

## What I need from you

- **Reddit**: client ID, client secret, username, password from your script app at reddit.com → preferences → apps. I will request these as secrets when I get there.
- **Twilio**: account SID, auth token, and your Twilio phone number.
- **Substack**: after I ship, one paste of the RSS URL into your publication's import setting. I will show you exactly where to click.

## Technical notes

- Reddit uses the OAuth2 password grant for script apps; token is fetched per dispatch, never stored.
- The RSS feed is served by an edge function and cached, so Substack polling costs nothing.
- The dispatcher is idempotent — a row already marked sent is skipped, so a double cron fire cannot double-post.
- Substack scheduling columns are retired from the UI only; existing data is left untouched.
