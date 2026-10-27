// When is a transit post due, and how does the scheduled push send it? Pure TypeScript with the database
// and the Make webhook passed in, so vitest can exercise every rule. make-social-bridge wires the real ones.
//
// A transits row is DUE only when ALL of these hold:
//   - status = 'published' and it has not been posted (social_posted_at is null)
//   - its transit window is the NEXT one for that sign that has not ended (moon_transitions: first window for
//     the sign whose end_time is still in the future), so a row approved days early waits for its own window
//   - the post time has passed: the row's power hour (clock time, America/New_York) on the first New York
//     calendar day of that window
//   - the window has not ended (a transit that is over is never posted late)

export const POST_ZONE = "America/New_York";

export interface TransitRow {
  id: string;
  sign?: string | null;
  status?: string | null;
  power_hour?: string | null;
  social_posted_at?: string | null;
  [key: string]: unknown;
}

export interface TransitWindow {
  sign: string;
  start_time: string;
  end_time: string;
}

function zoneOffsetMinutes(tz: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(at).map((x) => [x.type, x.value])) as Record<string, string>;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, p.hour === "24" ? 0 : +p.hour, +p.minute, +p.second);
  return Math.round((asUTC - at.getTime()) / 60000);
}

/** The New York calendar date (y, m, d) of an instant. */
export function zoneDateParts(ms: number, tz: string = POST_ZONE): { y: number; m: number; d: number } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date(ms)).map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  return { y: +p.year, m: +p.month, d: +p.day };
}

/** UTC instant (ms) of a wall-clock time in a zone, settled across DST changes. */
export function zoneLocalToUtc(y: number, m: number, d: number, hh: number, mm: number, tz: string = POST_ZONE): number {
  const naive = Date.UTC(y, m - 1, d, hh, mm, 0);
  let t = naive - zoneOffsetMinutes(tz, new Date(naive)) * 60000;
  t = naive - zoneOffsetMinutes(tz, new Date(t)) * 60000;
  return t;
}

/** "08:15 AM EST" -> { hh: 8, mm: 15 } (the zone label is ignored: the time is New York clock time). null if unreadable. */
export function parsePowerHour(text: string | null | undefined): { hh: number; mm: number } | null {
  const m = /^\s*(\d{1,2})\s*:\s*(\d{2})\s*([AaPp][Mm])\b/.exec(text ?? "");
  if (!m) return null;
  let hh = +m[1];
  const mm = +m[2];
  if (hh < 1 || hh > 12 || mm > 59) return null;
  const pm = m[3].toLowerCase() === "pm";
  if (hh === 12) hh = pm ? 12 : 0;
  else if (pm) hh += 12;
  return { hh, mm };
}

/** The sign's next window that has not ended yet. */
export function pickWindow(windows: readonly TransitWindow[], sign: string, now: number): TransitWindow | null {
  return (
    windows
      .filter((w) => w.sign.toLowerCase() === sign.toLowerCase() && Date.parse(w.end_time) > now)
      .sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time))[0] ?? null
  );
}

/** When this row should post: its power hour on the first New York day of the window. null if unreadable. */
export function postTimeFor(window: TransitWindow, powerHour: string | null | undefined): number | null {
  const ph = parsePowerHour(powerHour);
  if (!ph) return null;
  const { y, m, d } = zoneDateParts(Date.parse(window.start_time));
  return zoneLocalToUtc(y, m, d, ph.hh, ph.mm);
}

export type DueDecision = "due" | "not_published" | "already_posted" | "no_window" | "bad_power_hour" | "too_early" | "window_over";

export function dueDecision(row: TransitRow, windows: readonly TransitWindow[], now: number): DueDecision {
  if (row.status !== "published") return "not_published";
  if (row.social_posted_at) return "already_posted";
  const sign = row.sign || row.id;
  const window = pickWindow(windows, sign, now);
  if (!window) return "no_window";
  const at = postTimeFor(window, row.power_hour);
  if (at === null) return "bad_power_hour";
  if (now < at) return "too_early";
  if (now >= Date.parse(window.end_time)) return "window_over";
  return "due";
}

export const dueRows = <T extends TransitRow>(rows: readonly T[], windows: readonly TransitWindow[], now: number): T[] =>
  rows.filter((r) => dueDecision(r, windows, now) === "due");

export interface PushDeps<T extends TransitRow> {
  /** Published transits that have no social_posted_at. */
  fetchCandidates(): Promise<T[]>;
  /** Moon windows that have not ended yet. */
  fetchWindows(): Promise<TransitWindow[]>;
  /** POST the payload to the Make webhook; resolves the HTTP status (rejects on network error or timeout). */
  postToWebhook(row: T): Promise<number>;
  /** Set social_posted_at if it is still empty. Throws when the database write fails. */
  markPosted(id: string, at: string): Promise<void>;
  now(): number;
  log(step: string, details?: unknown): void;
}

export interface PushResult {
  checked: number;
  due: number;
  posted: string[];
  failed: Array<{ id: string; reason: string }>;
  /** Posted successfully but the database write kept failing: needs a manual look to avoid a repeat post. */
  markFailed: string[];
}

/** Post every due record once. Only a 2xx response marks a record posted; a failure leaves it unposted so the
 *  next scheduled check retries it. A record is attempted at most once per run, and one failure never stops
 *  the others. */
export async function pushDue<T extends TransitRow>(deps: PushDeps<T>): Promise<PushResult> {
  const now = deps.now();
  const [candidates, windows] = await Promise.all([deps.fetchCandidates(), deps.fetchWindows()]);

  const seen = new Set<string>();
  const due = dueRows(candidates, windows, now).filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  const result: PushResult = { checked: candidates.length, due: due.length, posted: [], failed: [], markFailed: [] };

  for (const row of due) {
    let status: number;
    try {
      status = await deps.postToWebhook(row);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      deps.log("webhook failed, will retry next check", { id: row.id, reason });
      result.failed.push({ id: row.id, reason });
      continue;
    }
    if (status < 200 || status > 299) {
      deps.log("webhook not 2xx, will retry next check", { id: row.id, status });
      result.failed.push({ id: row.id, reason: `HTTP ${status}` });
      continue;
    }
    result.posted.push(row.id);
    // The post is out: record it, retrying briefly, so it is never sent a second time.
    let marked = false;
    for (let attempt = 0; attempt < 3 && !marked; attempt++) {
      try {
        await deps.markPosted(row.id, new Date(deps.now()).toISOString());
        marked = true;
      } catch (err) {
        deps.log("could not mark posted, retrying", { id: row.id, attempt, reason: err instanceof Error ? err.message : String(err) });
      }
    }
    if (!marked) result.markFailed.push(row.id);
  }
  return result;
}
