import { describe, expect, it, vi } from "vitest";
import {
  dueDecision,
  dueRows,
  parsePowerHour,
  postTimeFor,
  pushDue,
  type PushDeps,
  type TransitRow,
  type TransitWindow,
} from "../../supabase/functions/_shared/socialDue";

// Leo's next window: starts Nov 1 2026 04:18Z (Nov 1, 12:18 AM New York), ends Nov 3. Noon EST on Nov 1 = 17:00Z
// (daylight saving ends the same morning).
const LEO: TransitWindow = { sign: "Leo", start_time: "2026-11-01T04:18:06Z", end_time: "2026-11-03T08:27:39Z" };
const NEXT_LEO: TransitWindow = { sign: "Leo", start_time: "2026-11-28T10:00:00Z", end_time: "2026-11-30T14:00:00Z" };
const leoRow = (extra: Partial<TransitRow> = {}): TransitRow => ({
  id: "leo", sign: "Leo", status: "published", power_hour: "12:00 PM EST", social_posted_at: null, ...extra,
});
const T = (iso: string) => Date.parse(iso);

describe("power hour parsing", () => {
  it("reads 12-hour clock times and ignores the zone label", () => {
    expect(parsePowerHour("08:15 AM EST")).toEqual({ hh: 8, mm: 15 });
    expect(parsePowerHour("12:00 PM EST")).toEqual({ hh: 12, mm: 0 });
    expect(parsePowerHour("12:30 AM")).toEqual({ hh: 0, mm: 30 });
    expect(parsePowerHour("10:05 PM EDT")).toEqual({ hh: 22, mm: 5 });
  });
  it("returns null for anything unreadable", () => {
    for (const bad of [null, undefined, "", "noon", "25:00 PM", "13:00 AM"]) expect(parsePowerHour(bad as any)).toBeNull();
  });
});

describe("due-time rule", () => {
  it("post time is the power hour on the first New York day of the window", () => {
    expect(postTimeFor(LEO, "12:00 PM EST")).toBe(T("2026-11-01T17:00:00Z"));
    // 03:00Z on Sep 10 is still Sep 9 in New York; 9:40 AM EDT = 13:40Z
    expect(postTimeFor({ sign: "Virgo", start_time: "2026-09-10T03:00:00Z", end_time: "2026-09-12T10:00:00Z" }, "09:40 AM EST"))
      .toBe(T("2026-09-09T13:40:00Z"));
  });

  it("an approved-early sign is NOT due days before its transit (the Libra/Virgo/Leo bug)", () => {
    expect(dueDecision(leoRow(), [LEO], T("2026-10-27T12:00:00Z"))).toBe("too_early");
    expect(dueDecision(leoRow(), [LEO], T("2026-11-01T16:59:00Z"))).toBe("too_early");
  });

  it("becomes due at the power hour on the first day and stays due until the transit ends", () => {
    expect(dueDecision(leoRow(), [LEO], T("2026-11-01T17:00:00Z"))).toBe("due");
    expect(dueDecision(leoRow(), [LEO], T("2026-11-02T20:00:00Z"))).toBe("due");
  });

  it("is never due once the transit is over: a stale approval waits for the next window instead of posting late", () => {
    expect(dueDecision(leoRow(), [LEO], T("2026-11-03T08:27:39Z"))).toBe("no_window");
    expect(dueDecision(leoRow(), [LEO, NEXT_LEO], T("2026-11-04T12:00:00Z"))).toBe("too_early");
  });

  it("needs status published, no posted marker, a window and a readable power hour", () => {
    const now = T("2026-11-02T00:00:00Z");
    expect(dueDecision(leoRow({ status: "pending" }), [LEO], now)).toBe("not_published");
    expect(dueDecision(leoRow({ social_posted_at: "2026-11-01T17:05:00Z" }), [LEO], now)).toBe("already_posted");
    expect(dueDecision(leoRow(), [], now)).toBe("no_window");
    expect(dueDecision(leoRow({ power_hour: "soon" }), [LEO], now)).toBe("bad_power_hour");
  });

  it("dueRows keeps only due rows, matching the sign by id when sign is missing", () => {
    const rows = [leoRow(), leoRow({ id: "virgo", sign: "Virgo" }), { id: "leo", status: "published", power_hour: "12:00 PM EST" } as TransitRow];
    expect(dueRows(rows, [LEO], T("2026-11-02T00:00:00Z")).map((r) => r.id)).toEqual(["leo", "leo"]);
  });
});

const makeDeps = (rows: TransitRow[], opts: { statuses?: Record<string, number | Error>; markError?: boolean } = {}) => {
  const posted: Record<string, string> = {};
  const calls: string[] = [];
  const deps: PushDeps<TransitRow> = {
    fetchCandidates: async () => rows.filter((r) => !posted[r.id] && !r.social_posted_at),
    fetchWindows: async () => [LEO],
    postToWebhook: vi.fn(async (row: TransitRow) => {
      calls.push(row.id);
      const s = opts.statuses?.[row.id] ?? 200;
      if (s instanceof Error) throw s;
      return s;
    }),
    markPosted: vi.fn(async (id: string, at: string) => {
      if (opts.markError) throw new Error("db down");
      posted[id] = at;
    }),
    now: () => T("2026-11-02T00:00:00Z"),
    log: vi.fn(),
  };
  return { deps, posted, calls };
};

describe("push mode", () => {
  it("posts each due record once and marks it posted on a 2xx", async () => {
    const { deps, posted, calls } = makeDeps([leoRow()]);
    const res = await pushDue(deps);
    expect(res).toMatchObject({ checked: 1, due: 1, posted: ["leo"], failed: [] });
    expect(calls).toEqual(["leo"]);
    expect(posted.leo).toBe("2026-11-02T00:00:00.000Z");
  });

  it("does not post records that are not due", async () => {
    const { deps, calls } = makeDeps([leoRow(), leoRow({ id: "aries", sign: "Aries" })]);
    const res = await pushDue({ ...deps, now: () => T("2026-10-27T00:00:00Z") });
    expect(res.due).toBe(0);
    expect(calls).toEqual([]);
  });

  it("no double post: a second check right after posts nothing, and duplicate rows in one run post once", async () => {
    const { deps, calls } = makeDeps([leoRow(), leoRow()]);
    await pushDue(deps);
    expect(calls).toEqual(["leo"]);
    const second = await pushDue(deps);
    expect(second.due).toBe(0);
    expect(calls).toEqual(["leo"]);
  });

  it("a record already marked posted is never sent", async () => {
    const { deps, calls } = makeDeps([leoRow({ social_posted_at: "2026-11-01T17:10:00Z" })]);
    await pushDue(deps);
    expect(calls).toEqual([]);
  });

  it("retry on failure: a non-2xx or network error leaves it unposted, and the next check posts it", async () => {
    for (const failure of [500, 404, new Error("timeout")]) {
      const { deps, posted, calls } = makeDeps([leoRow()], { statuses: { leo: failure } });
      const first = await pushDue(deps);
      expect(first.posted).toEqual([]);
      expect(first.failed).toHaveLength(1);
      expect(posted.leo).toBeUndefined();
      expect(deps.markPosted).not.toHaveBeenCalled();

      (deps.postToWebhook as any).mockImplementation(async (row: TransitRow) => {
        calls.push(row.id);
        return 200;
      });
      const retry = await pushDue(deps);
      expect(retry.posted).toEqual(["leo"]);
      expect(posted.leo).toBeDefined();
    }
  });

  it("one failing record does not stop the others", async () => {
    const rows = [leoRow(), leoRow({ id: "leo2", sign: "Leo" })];
    const { deps, posted } = makeDeps(rows, { statuses: { leo: 500 } });
    const res = await pushDue(deps);
    expect(res.failed.map((f) => f.id)).toEqual(["leo"]);
    expect(res.posted).toEqual(["leo2"]);
    expect(posted.leo2).toBeDefined();
  });

  it("a 2xx whose database mark keeps failing is reported, and the record is not sent twice in the run", async () => {
    const { deps, calls } = makeDeps([leoRow()], { markError: true });
    const res = await pushDue(deps);
    expect(res.posted).toEqual(["leo"]);
    expect(res.markFailed).toEqual(["leo"]);
    expect(deps.markPosted).toHaveBeenCalledTimes(3);
    expect(calls).toEqual(["leo"]);
  });
});
