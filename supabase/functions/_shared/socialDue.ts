// The social posting lifecycle of a transit card, and how the scheduled push sends it. Pure TypeScript with the
// database, the Make webhook and the email sender passed in, so vitest can exercise every rule. The edge function
// make-social-bridge wires the real ones, and Mission Control imports the same rule so the screen and the sender
// can never disagree.
//
// Stored value: transits.status stays 'pending' | 'published'. 'published' is a STANDING approval: the admin
// approves a sign once and it carries over every moon cycle. Only Undo (status back to 'pending') ends it.
// The four DISPLAYED states are derived, nothing is migrated:
//   pending   status is not 'published' (the default; only Approve / Approve all leaves it)
//   approved  published, and the sign's current window has not posted yet ("Posts <time>" / "next post <time>")
//   posted    the current window's post went out (social_posted_at >= its scheduled post time)
//   missed    a window ended (within the last few days) without a post
//
// A card's current window is the first window of its sign (moon_transitions) that has not ended. Its post time
// is scheduled_post_utc (below), which is usually BEFORE the window starts. A post counts for a window only if
// social_posted_at >= that window's scheduled_post_utc, so a marker from an earlier cycle can never block a
// later one, and published_at (which a re-stamp may move) takes no part in deciding what is due.
//
// Post time (schedule profile "primary", America/New_York), from the hour the transit STARTS in:
//   10:00 PM - 11:59 PM  -> 8:00 PM the same evening
//   12:00 AM -  6:59 AM  -> 8:00 PM the evening before
//   7:00 AM  - 9:59 PM   -> the top of that hour
// DUE = approved, now >= scheduled_post_utc, window not ended, and (social_posted_at is null OR
// social_posted_at < scheduled_post_utc). The claim and mark-posted writes use the same comparison.

export type ScheduleName = "primary";

export interface ScheduleProfile {
  zone: string;
  /** Short label printed after times, e.g. "8:00 PM ET". */
  label: string;
  /** A start at or after this hour (0-23) is "overnight" ... */
  overnightFrom: number;
  /** ... up to (not including) this hour the next morning. */
  overnightUntil: number;
  /** Overnight starts post at this hour in the evening. */
  eveningHour: number;
}

/** Add a regional profile here later (and pass its name to postTimeFor / socialStatus / pushDue). */
export const SCHEDULES: Record<ScheduleName, ScheduleProfile> = {
  primary: { zone: "America/New_York", label: "ET", overnightFrom: 22, overnightUntil: 7, eveningHour: 20 },
};

export const POST_ZONE = SCHEDULES.primary.zone;

/** A window that ended without a post shows as Missed for this many days, then the card shows the next cycle. */
export const MISSED_SHOW_DAYS = 3;
/** Windows are loaded from this many days back, so a just-ended (possibly Missed) window is still known. */
export const WINDOW_LOOKBACK_DAYS = 5;
/** A Missed alert is only sent for a window that ended this recently (old leftovers stay quiet). */
export const MISSED_ALERT_MAX_AGE_HOURS = 48;
/** A "sending" claim older than this is treated as abandoned. */
export const CLAIM_STALE_MINUTES = 10;

export interface TransitRow {
  id: string;
  sign?: string | null;
  status?: string | null;
  published_at?: string | null;
  social_posted_at?: string | null;
  [key: string]: unknown;
}

export interface TransitWindow {
  sign: string;
  start_time: string;
  end_time: string;
}

export interface ZoneParts { y: number; m: number; d: number; hh: number; mm: number }

function zoneOffsetMinutes(tz: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(at).map((x) => [x.type, x.value])) as Record<string, string>;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, p.hour === "24" ? 0 : +p.hour, +p.minute, +p.second);
  return Math.round((asUTC - at.getTime()) / 60000);
}

/** The wall-clock date and time of an instant in a zone. */
export function zoneParts(ms: number, tz: string = POST_ZONE): ZoneParts {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  return { y: +p.year, m: +p.month, d: +p.day, hh: p.hour === "24" ? 0 : +p.hour, mm: +p.minute };
}

/** UTC instant (ms) of a wall-clock time in a zone, settled across DST changes. */
export function zoneLocalToUtc(y: number, m: number, d: number, hh: number, mm: number, tz: string = POST_ZONE): number {
  const naive = Date.UTC(y, m - 1, d, hh, mm, 0);
  let t = naive - zoneOffsetMinutes(tz, new Date(naive)) * 60000;
  t = naive - zoneOffsetMinutes(tz, new Date(t)) * 60000;
  return t;
}

/** When a card for this window should post. The hour the transit starts in decides (see the header). */
export function postTimeFor(window: TransitWindow, schedule: ScheduleName = "primary"): number {
  const p = SCHEDULES[schedule];
  const t = zoneParts(Date.parse(window.start_time), p.zone);
  if (t.hh >= p.overnightFrom) return zoneLocalToUtc(t.y, t.m, t.d, p.eveningHour, 0, p.zone);
  if (t.hh < p.overnightUntil) {
    const prev = new Date(Date.UTC(t.y, t.m - 1, t.d - 1));
    return zoneLocalToUtc(prev.getUTCFullYear(), prev.getUTCMonth() + 1, prev.getUTCDate(), p.eveningHour, 0, p.zone);
  }
  return zoneLocalToUtc(t.y, t.m, t.d, t.hh, 0, p.zone);
}

const byStart = (a: TransitWindow, b: TransitWindow) => Date.parse(a.start_time) - Date.parse(b.start_time);
const sameSign = (w: TransitWindow, sign: string) => w.sign.toLowerCase() === sign.toLowerCase();

/** The sign's current window: the first one that has not ended (running now, or the next one coming). */
export function currentWindow(windows: readonly TransitWindow[], sign: string, now: number): TransitWindow | null {
  return windows.filter((w) => sameSign(w, sign) && Date.parse(w.end_time) > now).sort(byStart)[0] ?? null;
}

/** The sign's most recent window that has already ended. */
export function lastEndedWindow(windows: readonly TransitWindow[], sign: string, now: number): TransitWindow | null {
  const ended = windows.filter((w) => sameSign(w, sign) && Date.parse(w.end_time) <= now).sort(byStart);
  return ended[ended.length - 1] ?? null;
}

/** Did a post go out for the window whose scheduled post time is `postAt`? Only a marker at or after that time
 *  counts; an earlier one belongs to a previous cycle. A marker that cannot be read counts as posted (never risk
 *  a second post). The database filters in make-social-bridge use this same comparison. */
export function postedSince(row: TransitRow, postAt: number): boolean {
  if (!row.social_posted_at) return false;
  const posted = Date.parse(row.social_posted_at);
  return !Number.isFinite(posted) || posted >= postAt;
}

/** Oldest instant the windows must cover to judge a card now. */
export const windowsSince = (now: number): number => now - WINDOW_LOOKBACK_DAYS * 86400000;

export type SocialState = "pending" | "approved" | "posted" | "missed";

export interface SocialStatus {
  state: SocialState;
  window: TransitWindow | null;
  /** UTC ms of scheduled_post_utc for `window` (the next post, or the one that went out / was missed); null when it has no window. */
  postAt: number | null;
  /** UTC ms the post actually went out; set only in the Posted state. */
  postedAt: number | null;
  /** Approved, post time reached, window running, not yet posted: the next check sends it. */
  due: boolean;
}

export function socialStatus(
  row: TransitRow,
  windows: readonly TransitWindow[],
  now: number,
  schedule: ScheduleName = "primary",
): SocialStatus {
  if (row.status !== "published") return { state: "pending", window: null, postAt: null, postedAt: null, due: false };
  const sign = row.sign || row.id;

  // A window that just ended without a post (approved before it ended) is Missed for a few days.
  const prev = lastEndedWindow(windows, sign, now);
  if (prev && now - Date.parse(prev.end_time) <= MISSED_SHOW_DAYS * 86400000) {
    const prevPostAt = postTimeFor(prev, schedule);
    const approvedAt = row.published_at ? Date.parse(row.published_at) : NaN;
    const approvedInTime = !Number.isFinite(approvedAt) || approvedAt < Date.parse(prev.end_time);
    if (approvedInTime && !postedSince(row, prevPostAt)) {
      return { state: "missed", window: prev, postAt: prevPostAt, postedAt: null, due: false };
    }
  }

  const window = currentWindow(windows, sign, now);
  if (!window) return { state: "approved", window: null, postAt: null, postedAt: null, due: false };
  const postAt = postTimeFor(window, schedule);
  if (postedSince(row, postAt)) {
    const at = row.social_posted_at ? Date.parse(row.social_posted_at) : NaN;
    return { state: "posted", window, postAt, postedAt: Number.isFinite(at) ? at : postAt, due: false };
  }
  return { state: "approved", window, postAt, postedAt: null, due: now >= postAt };
}

export type DueDecision = "due" | "not_published" | "already_posted" | "no_window" | "too_early" | "window_over";

export function dueDecision(row: TransitRow, windows: readonly TransitWindow[], now: number, schedule: ScheduleName = "primary"): DueDecision {
  const s = socialStatus(row, windows, now, schedule);
  if (s.state === "pending") return "not_published";
  if (s.state === "posted") return "already_posted";
  if (s.state === "missed") return "window_over";
  if (!s.window) return "no_window";
  return s.due ? "due" : "too_early";
}

export interface DueItem<T extends TransitRow> { row: T; window: TransitWindow; postAt: number }

export function dueItems<T extends TransitRow>(
  rows: readonly T[],
  windows: readonly TransitWindow[],
  now: number,
  schedule: ScheduleName = "primary",
): Array<DueItem<T>> {
  const out: Array<DueItem<T>> = [];
  for (const row of rows) {
    const s = socialStatus(row, windows, now, schedule);
    if (s.due && s.window && s.postAt !== null) out.push({ row, window: s.window, postAt: s.postAt });
  }
  return out;
}

export const dueRows = <T extends TransitRow>(rows: readonly T[], windows: readonly TransitWindow[], now: number, schedule: ScheduleName = "primary"): T[] =>
  dueItems(rows, windows, now, schedule).map((i) => i.row);

/** "Sat 8:00 PM ET": the post time as the admin reads it. */
export function formatPostTime(ms: number, schedule: ScheduleName = "primary"): string {
  const p = SCHEDULES[schedule];
  const t = zoneParts(ms, p.zone);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: p.zone, weekday: "short" }).format(new Date(ms));
  return `${weekday} ${clock(t)} ${p.label}`;
}

function clock(t: ZoneParts): string {
  return `${t.hh % 12 || 12}:${String(t.mm).padStart(2, "0")} ${t.hh < 12 ? "AM" : "PM"}`;
}

const LINE_ZONES: Array<{ zone: string; label: string }> = [
  { zone: "America/New_York", label: "ET" },
  { zone: "Europe/London", label: "UK" },
  { zone: "Asia/Kolkata", label: "India" },
  { zone: "Asia/Shanghai", label: "China" },
];

/** The transit start as one ready-made line: "2:00 AM ET · 7:00 AM UK · 12:30 PM India · 3:00 PM China".
 *  A zone whose calendar day differs from New York's gets (+1) or (-1). */
export function transitTimesLine(startMs: number): string {
  const et = zoneParts(startMs, LINE_ZONES[0].zone);
  const etDay = Date.UTC(et.y, et.m - 1, et.d);
  return LINE_ZONES.map(({ zone, label }) => {
    const t = zoneParts(startMs, zone);
    const diff = Math.round((Date.UTC(t.y, t.m - 1, t.d) - etDay) / 86400000);
    return `${clock(t)} ${label}${diff === 0 ? "" : ` (${diff > 0 ? "+" : ""}${diff})`}`;
  }).join(" · ");
}

export type AlertKind = "failed" | "missed";

export interface SocialAlert<T extends TransitRow> {
  kind: AlertKind;
  row: T;
  window: TransitWindow;
  detail: string;
}

export const ALERT_FIELD: Record<AlertKind, string> = {
  failed: "social_fail_alert_for",
  missed: "social_missed_alert_for",
};

export interface PushContext { window: TransitWindow; postAt: number }

export interface PushDeps<T extends TransitRow> {
  /** Published (standing-approved) transits. The due rule decides which of them are due. */
  fetchCandidates(): Promise<T[]>;
  /** Moon windows that had not ended at `sinceMs` (windowsSince(now): a just-ended window is still known). */
  fetchWindows(sinceMs: number): Promise<TransitWindow[]>;
  /** POST the payload to the Make webhook; resolves the HTTP status (rejects on network error or timeout). */
  postToWebhook(row: T, ctx: PushContext): Promise<number>;
  /** Set social_posted_at only if it is still empty or older than `postAt` (the window's scheduled post time).
   *  Throws when the database write fails. */
  markPosted(id: string, at: string, postAt: number): Promise<void>;
  /** Mark the card "sending" so Undo and an overlapping run leave it alone. false = someone else is sending it
   *  (or it already posted for this `postAt`). */
  claim?(id: string, nowMs: number, postAt: number): Promise<boolean>;
  /** Drop the sending mark after a failed attempt. */
  release?(id: string): Promise<void>;
  /** Store the failure; resolves how many attempts in a row have failed for this window. */
  recordFailure?(row: T, reason: string, window: TransitWindow): Promise<number>;
  /** Email the admin. Throws if the email could not be sent (it is then retried at the next check). */
  notify?(alert: SocialAlert<T>): Promise<void>;
  /** Remember the alert went out for this window, so it is sent once per card per event. */
  markAlerted?(id: string, kind: AlertKind, windowKey: string): Promise<void>;
  now(): number;
  log(step: string, details?: unknown): void;
  schedule?: ScheduleName;
}

export interface PushResult {
  checked: number;
  due: number;
  posted: string[];
  failed: Array<{ id: string; reason: string }>;
  /** Posted successfully but the database write kept failing: needs a manual look to avoid a repeat post. */
  markFailed: string[];
  /** Cards whose window ended without a post. */
  missed: string[];
  /** Alerts emailed this run, as "<kind>:<id>". */
  alerts: string[];
}

/** Post every due record once. Only a 2xx response marks a record posted; a failure leaves it unposted so the
 *  next scheduled check retries it. A record is attempted at most once per run, and one failure never stops
 *  the others. Emails the admin once per card per event when a post fails twice in a row or a card is Missed. */
export async function pushDue<T extends TransitRow>(deps: PushDeps<T>): Promise<PushResult> {
  const schedule = deps.schedule ?? "primary";
  const now = deps.now();
  const candidates = await deps.fetchCandidates();
  const windows = await deps.fetchWindows(windowsSince(now));

  const seen = new Set<string>();
  const unique = candidates.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  const result: PushResult = { checked: candidates.length, due: 0, posted: [], failed: [], markFailed: [], missed: [], alerts: [] };

  const alert = async (kind: AlertKind, row: T, window: TransitWindow, detail: string) => {
    if (!deps.notify || !deps.markAlerted) return;
    const field = ALERT_FIELD[kind];
    if (!(field in row)) {
      deps.log("alert skipped: the alert columns are not applied yet", { id: row.id, kind });
      return;
    }
    if (row[field] === window.start_time) return;
    try {
      await deps.notify({ kind, row, window, detail });
    } catch (err) {
      deps.log("alert email failed, will retry next check", { id: row.id, kind, reason: err instanceof Error ? err.message : String(err) });
      return;
    }
    result.alerts.push(`${kind}:${row.id}`);
    try {
      await deps.markAlerted(row.id, kind, window.start_time);
    } catch (err) {
      deps.log("could not record the alert", { id: row.id, kind, reason: err instanceof Error ? err.message : String(err) });
    }
  };

  const items: Array<DueItem<T>> = [];
  for (const row of unique) {
    const s = socialStatus(row, windows, now, schedule);
    if (s.state === "missed" && s.window) {
      result.missed.push(row.id);
      if (now - Date.parse(s.window.end_time) <= MISSED_ALERT_MAX_AGE_HOURS * 3600000) {
        await alert("missed", row, s.window, `The ${row.sign ?? row.id} transit ended ${new Date(s.window.end_time).toISOString()} and nothing was posted.`);
      }
    } else if (s.due && s.window && s.postAt !== null) {
      items.push({ row, window: s.window, postAt: s.postAt });
    }
  }
  result.due = items.length;

  for (const { row, window, postAt } of items) {
    if (deps.claim && !(await deps.claim(row.id, now, postAt))) {
      deps.log("already being sent, skipped", { id: row.id });
      continue;
    }

    let failure: string | null = null;
    try {
      const status = await deps.postToWebhook(row, { window, postAt });
      if (status < 200 || status > 299) failure = `HTTP ${status}`;
    } catch (err) {
      failure = err instanceof Error ? err.message : String(err);
    }

    if (failure !== null) {
      deps.log("webhook failed, will retry next check", { id: row.id, reason: failure });
      result.failed.push({ id: row.id, reason: failure });
      await deps.release?.(row.id).catch(() => undefined);
      let count = 1;
      if (deps.recordFailure) {
        try {
          count = await deps.recordFailure(row, failure, window);
        } catch (err) {
          deps.log("could not record the failure", { id: row.id, reason: err instanceof Error ? err.message : String(err) });
        }
      }
      if (count >= 2) await alert("failed", row, window, `Posting the ${row.sign ?? row.id} transit failed ${count} times in a row. Last error: ${failure}`);
      continue;
    }

    result.posted.push(row.id);
    // The post is out: record it, retrying briefly, so it is never sent a second time.
    let marked = false;
    for (let attempt = 0; attempt < 3 && !marked; attempt++) {
      try {
        await deps.markPosted(row.id, new Date(deps.now()).toISOString(), postAt);
        marked = true;
      } catch (err) {
        deps.log("could not mark posted, retrying", { id: row.id, attempt, reason: err instanceof Error ? err.message : String(err) });
      }
    }
    if (!marked) result.markFailed.push(row.id);
  }
  return result;
}
