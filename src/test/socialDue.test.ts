import { describe, expect, it, vi } from "vitest";
import {
  ALERT_FIELD,
  SCHEDULES,
  dueDecision,
  dueItems,
  dueRows,
  formatPostTime,
  postTimeFor,
  pushDue,
  socialStatus,
  transitTimesLine,
  type PushDeps,
  type TransitRow,
  type TransitWindow,
} from "../../supabase/functions/_shared/socialDue";
import { ALERT_FROM, DEFAULT_ADMIN_EMAIL, sendAdminEmail, socialAlertEmail } from "../../supabase/functions/_shared/adminAlert";

const T = (iso: string) => Date.parse(iso);
const win = (start: string, end = "2026-10-29T20:00:00Z", sign = "Leo"): TransitWindow => ({ sign, start_time: start, end_time: end });

// Leo starts Tue Oct 27 2026, 2:30 PM EDT (18:30Z): a daytime start, so it posts at 2:00 PM EDT = 18:00Z.
const LEO = win("2026-10-27T18:30:00Z", "2026-10-29T20:00:00Z");
// The sign's next cycle, 27 days later.
const NEXT_LEO = win("2026-11-23T12:00:00Z", "2026-11-25T18:00:00Z");

const row = (extra: Partial<TransitRow> = {}): TransitRow => ({
  id: "leo", sign: "Leo", status: "published", published_at: "2026-10-25T14:00:00Z", social_posted_at: null, ...extra,
});

describe("post time: overnight and daytime rules (America/New_York)", () => {
  const at = (startIso: string) => postTimeFor(win(startIso));

  it("daytime start posts at the top of the hour the transit starts in", () => {
    expect(at("2026-10-27T18:30:00Z")).toBe(T("2026-10-27T18:00:00Z")); // 2:30 PM EDT -> 2:00 PM
    expect(at("2026-10-27T11:00:00Z")).toBe(T("2026-10-27T11:00:00Z")); // 7:00 AM exactly -> 7:00 AM
    expect(at("2026-10-27T11:30:00Z")).toBe(T("2026-10-27T11:00:00Z")); // 7:30 AM -> 7:00 AM
    expect(at("2026-10-28T01:59:00Z")).toBe(T("2026-10-28T01:00:00Z")); // 9:59 PM -> 9:00 PM
  });

  it("a start from 10:00 PM to midnight posts at 8:00 PM the same evening", () => {
    expect(at("2026-10-28T02:00:00Z")).toBe(T("2026-10-28T00:00:00Z")); // 10:00 PM exactly
    expect(at("2026-10-28T02:15:00Z")).toBe(T("2026-10-28T00:00:00Z")); // 10:15 PM
    expect(at("2026-10-28T03:59:00Z")).toBe(T("2026-10-28T00:00:00Z")); // 11:59 PM
  });

  it("a start from midnight to 6:59 AM posts at 8:00 PM the evening before", () => {
    expect(at("2026-10-28T04:00:00Z")).toBe(T("2026-10-28T00:00:00Z")); // 12:00 AM -> Oct 27 8 PM
    expect(at("2026-10-27T08:00:00Z")).toBe(T("2026-10-27T00:00:00Z")); // 4:00 AM -> Oct 26 8 PM
    expect(at("2026-10-27T10:45:00Z")).toBe(T("2026-10-27T00:00:00Z")); // 6:45 AM -> Oct 26 8 PM
    expect(at("2026-10-27T10:59:00Z")).toBe(T("2026-10-27T00:00:00Z")); // 6:59 AM still overnight
  });

  it("works across the daylight saving change (clocks go back Nov 1 2026)", () => {
    // 12:18 AM EDT Nov 1 -> the evening before, Oct 31 8:00 PM EDT
    expect(at("2026-11-01T04:18:06Z")).toBe(T("2026-11-01T00:00:00Z"));
    // 1:30 AM EST Nov 1 (after the change) -> still Oct 31 8:00 PM EDT
    expect(at("2026-11-01T06:30:00Z")).toBe(T("2026-11-01T00:00:00Z"));
    // 8:15 AM EST Nov 2 -> 8:00 AM EST = 13:00Z
    expect(at("2026-11-02T13:15:00Z")).toBe(T("2026-11-02T13:00:00Z"));
  });

  it("takes a schedule profile name; only the primary (ET) schedule exists", () => {
    expect(Object.keys(SCHEDULES)).toEqual(["primary"]);
    expect(SCHEDULES.primary.zone).toBe("America/New_York");
    expect(postTimeFor(LEO, "primary")).toBe(T("2026-10-27T18:00:00Z"));
  });

  it("prints the post time the way the admin reads it", () => {
    expect(formatPostTime(T("2026-11-01T00:00:00Z"))).toBe("Sat 8:00 PM ET");
    expect(formatPostTime(T("2026-10-27T18:00:00Z"))).toBe("Tue 2:00 PM ET");
  });
});

describe("the four states, derived from the stored row", () => {
  it("Pending is the default and anything not approved stays Pending", () => {
    const s = socialStatus(row({ status: "pending", published_at: null }), [LEO], T("2026-10-27T20:00:00Z"));
    expect(s).toMatchObject({ state: "pending", due: false });
    expect(socialStatus(row({ status: null }), [LEO], T("2026-10-27T20:00:00Z")).state).toBe("pending");
  });

  it("Approved: approved, not posted, window not ended; due only once the post time has passed", () => {
    const early = socialStatus(row(), [LEO], T("2026-10-27T17:59:00Z"));
    expect(early).toMatchObject({ state: "approved", due: false, postAt: T("2026-10-27T18:00:00Z") });
    expect(socialStatus(row(), [LEO], T("2026-10-27T18:00:00Z"))).toMatchObject({ state: "approved", due: true });
    expect(socialStatus(row(), [LEO], T("2026-10-29T19:59:00Z"))).toMatchObject({ state: "approved", due: true });
  });

  it("Posted: the current window's post went out (social_posted_at is at or after its post time)", () => {
    const s = socialStatus(row({ social_posted_at: "2026-10-27T18:05:00Z" }), [LEO], T("2026-10-28T00:00:00Z"));
    expect(s).toMatchObject({ state: "posted", due: false, postedAt: T("2026-10-27T18:05:00Z"), postAt: T("2026-10-27T18:00:00Z") });
  });

  it("Missed: a window ended without a post (it never posts late); after a few days the card shows the next cycle", () => {
    expect(socialStatus(row(), [LEO], T("2026-10-29T20:00:00Z"))).toMatchObject({ state: "missed", due: false, window: LEO });
    expect(socialStatus(row(), [LEO, NEXT_LEO], T("2026-10-31T00:00:00Z"))).toMatchObject({ state: "missed", due: false });
    expect(socialStatus(row(), [LEO, NEXT_LEO], T("2026-11-05T00:00:00Z"))).toMatchObject({ state: "approved", window: NEXT_LEO, due: false });
  });

  it("approved after the window ended is for the sign's next window, and waits for it", () => {
    const late = row({ published_at: "2026-10-30T00:00:00Z" });
    const s = socialStatus(late, [LEO, NEXT_LEO], T("2026-10-30T12:00:00Z"));
    expect(s.state).toBe("approved");
    expect(s.window).toEqual(NEXT_LEO);
    expect(s.due).toBe(false);
  });

  it("Approved after its post time with the window still running is due right away (next check)", () => {
    const s = socialStatus(row({ published_at: "2026-10-28T10:00:00Z" }), [LEO], T("2026-10-28T11:00:00Z"));
    expect(s).toMatchObject({ state: "approved", due: true });
  });

  it("an early approval is NOT due days before its transit", () => {
    expect(dueDecision(row(), [LEO], T("2026-10-25T15:00:00Z"))).toBe("too_early");
  });

  it("standing approval: there is no rollover to Pending; a finished cycle goes back to Approved for the next window", () => {
    const posted = row({ social_posted_at: "2026-10-27T18:05:00Z" });
    expect(socialStatus(posted, [LEO, NEXT_LEO], T("2026-10-28T00:00:00Z")).state).toBe("posted");
    for (const at of ["2026-11-10T00:00:00Z", "2026-11-21T00:00:00Z"]) {
      expect(socialStatus(posted, [LEO, NEXT_LEO], T(at))).toMatchObject({ state: "approved", window: NEXT_LEO, postAt: T("2026-11-23T12:00:00Z"), due: false });
    }
  });

  it("a card with no window yet is Approved but not due", () => {
    const s = socialStatus(row(), [], T("2026-10-27T20:00:00Z"));
    expect(s).toMatchObject({ state: "approved", due: false, postAt: null, postedAt: null });
    expect(dueDecision(row(), [], T("2026-10-27T20:00:00Z"))).toBe("no_window");
  });

  it("matches the sign by id when sign is missing, and dueRows keeps only due rows", () => {
    const rows = [row(), row({ id: "virgo", sign: "Virgo" }), { id: "leo", status: "published", published_at: "2026-10-25T14:00:00Z" } as TransitRow];
    expect(dueRows(rows, [LEO], T("2026-10-28T00:00:00Z")).map((r) => r.id)).toEqual(["leo", "leo"]);
    const items = dueItems([row()], [LEO], T("2026-10-28T00:00:00Z"));
    expect(items[0]).toMatchObject({ window: LEO, postAt: T("2026-10-27T18:00:00Z") });
  });
});

// What the database does for markPosted: set the marker only if it is empty or older than the window's post time.
const markLikeDb = (rows: TransitRow[]) => async (id: string, at: string, postAt: number) => {
  const r = rows.find((x) => x.id === id)!;
  if (!r.social_posted_at || Date.parse(r.social_posted_at) < postAt) r.social_posted_at = at;
};

// A runner that moves the clock, so consecutive hourly checks can be replayed.
const hourly = (rows: TransitRow[], windows: TransitWindow[]) => {
  let clock = 0;
  const calls: Array<{ id: string; at: number; postAt: number }> = [];
  const deps: PushDeps<TransitRow> = {
    fetchCandidates: async () => rows.filter((r) => r.status === "published"),
    fetchWindows: async () => windows,
    postToWebhook: vi.fn(async (r: TransitRow, ctx) => (calls.push({ id: r.id, at: clock, postAt: ctx.postAt }), 200)),
    markPosted: markLikeDb(rows),
    now: () => clock,
    log: vi.fn(),
  };
  const run = async (from: string, to: string, restamp?: (at: number) => void) => {
    for (let t = T(from); t <= T(to); t += 3600000) {
      clock = t;
      await pushDue(deps);
      restamp?.(t);
    }
  };
  return { deps, calls, run };
};

describe("standing approval: every moon cycle posts once, an old marker never blocks", () => {
  // Cycle 1 (LEO) posted Oct 27 18:05Z. Cycle 2 (NEXT_LEO, Nov 23 12:00Z = 7:00 AM EST, posts 7:00 AM ET = 12:00Z).
  const OLD = "2026-10-27T18:05:00Z";
  const W = [LEO, NEXT_LEO];

  it("a card posted last cycle is Approved for the new window (no re-approval) and due at its post time", () => {
    const r = row({ social_posted_at: OLD });
    expect(socialStatus(r, W, T("2026-11-22T00:00:00Z"))).toMatchObject({ state: "approved", due: false, window: NEXT_LEO });
    expect(socialStatus(r, W, T("2026-11-23T12:00:00Z"))).toMatchObject({ state: "approved", due: true });
    expect(dueDecision(r, W, T("2026-11-23T12:00:00Z"))).toBe("due");
  });

  it("a post made at or after the new window's post time counts as Posted", () => {
    const r = row({ social_posted_at: "2026-11-23T12:03:00Z" });
    expect(socialStatus(r, W, T("2026-11-23T13:00:00Z"))).toMatchObject({ state: "posted", postedAt: T("2026-11-23T12:03:00Z") });
  });

  it("push posts the second cycle, and a repeat check does not post it again", async () => {
    const rows = [row({ social_posted_at: OLD })];
    const posted: string[] = [];
    const deps: PushDeps<TransitRow> = {
      fetchCandidates: async () => rows,
      fetchWindows: async () => W,
      postToWebhook: vi.fn(async (r: TransitRow) => (posted.push(r.id), 200)),
      markPosted: markLikeDb(rows),
      now: () => T("2026-11-23T13:00:00Z"),
      log: vi.fn(),
    };
    await pushDue(deps);
    await pushDue(deps);
    expect(posted).toEqual(["leo"]);
    expect(rows[0].social_posted_at).toBe("2026-11-23T13:00:00.000Z");
  });

  it("claim and mark receive the window's post time, the value the database compares the marker with", async () => {
    const rows = [row({ social_posted_at: OLD })];
    const claim = vi.fn(async () => true);
    const markPosted = vi.fn(async () => undefined);
    await pushDue({
      fetchCandidates: async () => rows, fetchWindows: async () => W, postToWebhook: async () => 200,
      claim, markPosted, now: () => T("2026-11-23T13:00:00Z"), log: vi.fn(),
    });
    expect(claim).toHaveBeenCalledWith("leo", T("2026-11-23T13:00:00Z"), T("2026-11-23T12:00:00Z"));
    expect(markPosted).toHaveBeenCalledWith("leo", expect.any(String), T("2026-11-23T12:00:00Z"));
  });

  it("a post made BEFORE the window starts is never re-sent (overnight start posts the evening before)", async () => {
    // Moon enters Taurus Fri Oct 30 12:18 AM EDT (04:18Z); the post goes out Thu 8:00 PM EDT (00:00Z), before it starts.
    const TAURUS = win("2026-10-30T04:18:00Z", "2026-11-01T10:00:00Z", "Taurus");
    const rows = [row({ id: "taurus", sign: "Taurus" })];
    const { calls, run } = hourly(rows, [TAURUS]);
    await run("2026-10-29T23:00:00Z", "2026-10-29T23:00:00Z");
    expect(calls).toHaveLength(0); // one hour early
    await run("2026-10-30T00:00:00Z", "2026-11-01T12:00:00Z");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ at: T("2026-10-30T00:00:00Z"), postAt: T("2026-10-30T00:00:00Z") });
    expect(Date.parse(rows[0].social_posted_at!)).toBeLessThan(T(TAURUS.start_time));
  });

  it("consecutive hourly checks never double-post, even when the approval time is re-stamped between runs", async () => {
    const rows = [row()];
    const { calls, run } = hourly(rows, [LEO]);
    await run("2026-10-27T10:00:00Z", "2026-10-29T21:00:00Z", (t) => { rows[0].published_at = new Date(t + 60000).toISOString(); });
    expect(calls).toHaveLength(1);
    expect(calls[0].postAt).toBe(T("2026-10-27T18:00:00Z"));
  });

  it("a second cycle posts once, with no re-approval and the first cycle's marker still on the row", async () => {
    const rows = [row()];
    const { calls, run } = hourly(rows, [LEO, NEXT_LEO]);
    await run("2026-10-27T10:00:00Z", "2026-11-26T00:00:00Z");
    expect(calls.map((c) => c.postAt)).toEqual([T("2026-10-27T18:00:00Z"), T("2026-11-23T12:00:00Z")]);
  });

  it("a cycle approved after its window ended is skipped, and the next cycle still posts once", async () => {
    const rows = [row({ published_at: "2026-10-30T00:00:00Z" })];
    const { calls, run } = hourly(rows, [LEO, NEXT_LEO]);
    await run("2026-10-30T00:00:00Z", "2026-11-26T00:00:00Z");
    expect(calls.map((c) => c.postAt)).toEqual([T("2026-11-23T12:00:00Z")]);
  });
});

describe("the times line sent to Make", () => {
  it("lists the start in ET, UK, India and China", () => {
    // 2:00 AM EDT = 06:00Z on Oct 20; the UK is still on summer time then
    expect(transitTimesLine(T("2026-10-20T06:00:00Z"))).toBe("2:00 AM ET · 7:00 AM UK · 11:30 AM India · 2:00 PM China");
  });
  it("marks a zone whose day differs from New York", () => {
    expect(transitTimesLine(T("2026-10-29T01:00:00Z"))).toBe("9:00 PM ET · 1:00 AM UK (+1) · 6:30 AM India (+1) · 9:00 AM China (+1)");
  });
});

const makeDeps = (
  rows: TransitRow[],
  opts: {
    statuses?: Record<string, number | Error>;
    markError?: boolean;
    now?: string;
    windows?: TransitWindow[];
    alerts?: boolean;
    claimed?: string[];
    notifyError?: boolean;
  } = {},
) => {
  const posted: Record<string, string> = {};
  const calls: string[] = [];
  const failures: Record<string, number> = {};
  const sent: Array<{ kind: string; id: string }> = [];
  const deps: PushDeps<TransitRow> = {
    fetchCandidates: async () => rows.filter((r) => r.status === "published"),
    fetchWindows: async () => opts.windows ?? [LEO],
    postToWebhook: vi.fn(async (r: TransitRow) => {
      calls.push(r.id);
      const s = opts.statuses?.[r.id] ?? 200;
      if (s instanceof Error) throw s;
      return s;
    }),
    markPosted: vi.fn(async (id: string, at: string, postAt: number) => {
      if (opts.markError) throw new Error("db down");
      posted[id] = at;
      await markLikeDb(rows)(id, at, postAt);
    }),
    now: () => T(opts.now ?? "2026-10-28T12:00:00Z"),
    log: vi.fn(),
  };
  if (opts.claimed) deps.claim = vi.fn(async (id: string) => !opts.claimed!.includes(id));
  if (opts.claimed) deps.release = vi.fn(async () => undefined);
  if (opts.alerts) {
    deps.recordFailure = vi.fn(async (r: TransitRow) => (failures[r.id] = (failures[r.id] ?? 0) + 1));
    deps.notify = vi.fn(async (a) => {
      if (opts.notifyError) throw new Error("resend down");
      sent.push({ kind: a.kind, id: a.row.id });
    });
    deps.markAlerted = vi.fn(async (id, kind, key) => {
      const target = rows.find((r) => r.id === id)!;
      target[ALERT_FIELD[kind]] = key;
    });
  }
  return { deps, posted, calls, sent };
};

describe("push mode", () => {
  it("posts each due record once, with its window and post time, and marks it posted on a 2xx", async () => {
    const { deps, posted, calls } = makeDeps([row()]);
    const res = await pushDue(deps);
    expect(res).toMatchObject({ checked: 1, due: 1, posted: ["leo"], failed: [] });
    expect(calls).toEqual(["leo"]);
    expect(deps.postToWebhook).toHaveBeenCalledWith(expect.objectContaining({ id: "leo" }), { window: LEO, postAt: T("2026-10-27T18:00:00Z") });
    expect(posted.leo).toBe("2026-10-28T12:00:00.000Z");
  });

  it("does not post records that are not due yet", async () => {
    const { deps, calls } = makeDeps([row(), row({ id: "aries", sign: "Aries" })], { now: "2026-10-27T17:00:00Z" });
    const res = await pushDue(deps);
    expect(res.due).toBe(0);
    expect(calls).toEqual([]);
  });

  it("never posts a Pending card", async () => {
    const { deps, calls } = makeDeps([row({ status: "pending", published_at: null })]);
    await pushDue(deps);
    expect(calls).toEqual([]);
  });

  it("no double post: a second check right after posts nothing, and duplicate rows in one run post once", async () => {
    const { deps, calls } = makeDeps([row(), row()]);
    await pushDue(deps);
    expect(calls).toEqual(["leo"]);
    const second = await pushDue(deps);
    expect(second.due).toBe(0);
    expect(calls).toEqual(["leo"]);
  });

  it("a record already marked posted is never sent", async () => {
    const { deps, calls } = makeDeps([row({ social_posted_at: "2026-10-27T18:10:00Z" })]);
    await pushDue(deps);
    expect(calls).toEqual([]);
  });

  it("a card another run is already sending is skipped (no double post from overlapping runs)", async () => {
    const { deps, calls } = makeDeps([row()], { claimed: ["leo"] });
    const res = await pushDue(deps);
    expect(calls).toEqual([]);
    expect(res.posted).toEqual([]);
  });

  it("retry on failure: a non-2xx or network error leaves it unposted, and the next check posts it", async () => {
    for (const failure of [500, 404, new Error("timeout")]) {
      const { deps, posted, calls } = makeDeps([row()], { statuses: { leo: failure } });
      const first = await pushDue(deps);
      expect(first.posted).toEqual([]);
      expect(first.failed).toHaveLength(1);
      expect(posted.leo).toBeUndefined();
      expect(deps.markPosted).not.toHaveBeenCalled();

      (deps.postToWebhook as any).mockImplementation(async (r: TransitRow) => {
        calls.push(r.id);
        return 200;
      });
      const retry = await pushDue(deps);
      expect(retry.posted).toEqual(["leo"]);
      expect(posted.leo).toBeDefined();
    }
  });

  it("releases the sending mark after a failed attempt", async () => {
    const { deps } = makeDeps([row()], { statuses: { leo: 500 }, claimed: [] });
    await pushDue(deps);
    expect(deps.release).toHaveBeenCalledWith("leo");
  });

  it("one failing record does not stop the others", async () => {
    const rows = [row(), row({ id: "leo2", sign: "Leo" })];
    const { deps, posted } = makeDeps(rows, { statuses: { leo: 500 } });
    const res = await pushDue(deps);
    expect(res.failed.map((f) => f.id)).toEqual(["leo"]);
    expect(res.posted).toEqual(["leo2"]);
    expect(posted.leo2).toBeDefined();
  });

  it("a 2xx whose database mark keeps failing is reported, and the record is not sent twice in the run", async () => {
    const { deps, calls } = makeDeps([row()], { markError: true });
    const res = await pushDue(deps);
    expect(res.posted).toEqual(["leo"]);
    expect(res.markFailed).toEqual(["leo"]);
    expect(deps.markPosted).toHaveBeenCalledTimes(3);
    expect(calls).toEqual(["leo"]);
  });

  it("never posts after the window ended: the card is Missed instead", async () => {
    const { deps, calls } = makeDeps([row()], { now: "2026-10-29T20:00:00Z" });
    const res = await pushDue(deps);
    expect(calls).toEqual([]);
    expect(res.missed).toEqual(["leo"]);
  });
});

describe("failure and missed emails", () => {
  const failing = () => row({ social_fail_alert_for: null, social_missed_alert_for: null });

  it("emails once when a post fails twice in a row, not on the first failure, not again on the third", async () => {
    const rows = [failing()];
    const { deps, sent } = makeDeps(rows, { statuses: { leo: 500 }, alerts: true });
    await pushDue(deps);
    expect(sent).toEqual([]);
    const second = await pushDue(deps);
    expect(sent).toEqual([{ kind: "failed", id: "leo" }]);
    expect(second.alerts).toEqual(["failed:leo"]);
    await pushDue(deps);
    await pushDue(deps);
    expect(sent).toHaveLength(1);
  });

  it("a success resets nothing it should not: no failure email when the retry works", async () => {
    const rows = [failing()];
    const { deps, sent } = makeDeps(rows, { statuses: { leo: 500 }, alerts: true });
    await pushDue(deps);
    (deps.postToWebhook as any).mockImplementation(async () => 200);
    await pushDue(deps);
    expect(sent).toEqual([]);
  });

  it("emails once when a card becomes Missed", async () => {
    const rows = [failing()];
    const { deps, sent } = makeDeps(rows, { now: "2026-10-29T21:00:00Z", alerts: true });
    const first = await pushDue(deps);
    expect(sent).toEqual([{ kind: "missed", id: "leo" }]);
    expect(first.missed).toEqual(["leo"]);
    await pushDue(deps);
    expect(sent).toHaveLength(1);
  });

  it("an old leftover (window ended days ago) stays quiet", async () => {
    const { deps, sent } = makeDeps([failing()], { now: "2026-11-03T00:00:00Z", alerts: true });
    await pushDue(deps);
    expect(sent).toEqual([]);
  });

  it("a new cycle can alert again (the once-only record is per window)", async () => {
    const rows = [row({ social_fail_alert_for: null, social_missed_alert_for: LEO.start_time, published_at: "2026-11-20T00:00:00Z" })];
    const { deps, sent } = makeDeps(rows, { now: "2026-11-25T18:00:00Z", windows: [LEO, NEXT_LEO], alerts: true });
    await pushDue(deps);
    expect(sent).toEqual([{ kind: "missed", id: "leo" }]);
  });

  it("does not email (and does not spam) while the alert columns are not applied", async () => {
    const { deps, sent } = makeDeps([row()], { statuses: { leo: 500 }, now: "2026-10-28T12:00:00Z", alerts: true });
    await pushDue(deps);
    await pushDue(deps);
    expect(sent).toEqual([]);
    expect(deps.markAlerted).not.toHaveBeenCalled();
  });

  it("an email that fails to send is retried at the next check, not recorded as sent", async () => {
    const rows = [failing()];
    const { deps } = makeDeps(rows, { now: "2026-10-29T21:00:00Z", alerts: true, notifyError: true });
    await pushDue(deps);
    expect(deps.markAlerted).not.toHaveBeenCalled();
    expect(rows[0].social_missed_alert_for).toBeNull();
  });
});

describe("admin email through Resend", () => {
  it("sends from noreply@moondaylive.com to the admin with the API key", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    await sendAdminEmail(socialAlertEmail("missed", "Leo", "detail"), { apiKey: "re_key", to: undefined }, fetchMock as any);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_key");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ from: ALERT_FROM, to: [DEFAULT_ADMIN_EMAIL], subject: "Moonday social post for Leo was missed" });
  });
  it("throws when the key is missing or Resend refuses", async () => {
    await expect(sendAdminEmail({ subject: "s", text: "t" }, { apiKey: undefined, to: "a@b.c" })).rejects.toThrow("RESEND_API_KEY");
    const bad = vi.fn(async () => new Response("no", { status: 422 }));
    await expect(sendAdminEmail({ subject: "s", text: "t" }, { apiKey: "k", to: "a@b.c" }, bad as any)).rejects.toThrow("422");
  });
  it("the failed-post email says the post is failing", () => {
    expect(socialAlertEmail("failed", "Leo", "x").subject).toBe("Moonday social post for Leo is failing to post");
  });
});
