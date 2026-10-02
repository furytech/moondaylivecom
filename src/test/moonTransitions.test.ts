import { describe, it, expect } from "vitest";
import {
  formatTransitWindow,
  getTransitWindowForSign,
  computeLiveTransitions,
  MoonTransitionRow
} from "@/lib/moonTransitions";

describe("moonTransitions - Dynamic Transit Period Derivation", () => {
  const mockTransitions: MoonTransitionRow[] = [
    {
      transition_at: "2026-09-28T14:40:02Z",
      from_sign: "Aries",
      to_sign: "Taurus",
      transition_date: "2026-09-28"
    },
    {
      transition_at: "2026-09-30T17:26:03Z",
      from_sign: "Taurus",
      to_sign: "Gemini",
      transition_date: "2026-09-30"
    },
    {
      transition_at: "2026-10-02T19:54:06Z",
      from_sign: "Gemini",
      to_sign: "Cancer",
      transition_date: "2026-10-02"
    },
    {
      transition_at: "2026-10-04T22:54:11Z",
      from_sign: "Cancer",
      to_sign: "Leo",
      transition_date: "2026-10-04"
    },
    {
      transition_at: "2026-10-07T02:52:36Z",
      from_sign: "Leo",
      to_sign: "Virgo",
      transition_date: "2026-10-07"
    }
  ];

  it("formatTransitWindow formats start and end dates with 'MMM D – MMM D' short format", () => {
    const start = new Date("2026-10-02T19:54:06Z");
    const end = new Date("2026-10-04T22:54:11Z");
    expect(formatTransitWindow(start, end)).toBe("Oct 2 – Oct 4");

    const crossMonthStart = new Date("2026-09-30T17:26:03Z");
    const crossMonthEnd = new Date("2026-10-02T19:54:06Z");
    expect(formatTransitWindow(crossMonthStart, crossMonthEnd)).toBe("Sep 30 – Oct 2");
  });

  it("derives the exact active or upcoming transit window for Cancer on Oct 2, 2026 as 'Oct 2 – Oct 4'", () => {
    // Current date is Oct 2, 2026 before Cancer ingress (e.g. 10:00 UTC)
    const nowBeforeIngress = new Date("2026-10-02T10:00:00Z");
    const periodUpcoming = getTransitWindowForSign("Cancer", mockTransitions, nowBeforeIngress);
    expect(periodUpcoming).toBe("Oct 2 – Oct 4");

    // Current date is Oct 3, 2026 while Cancer transit is active
    const nowActive = new Date("2026-10-03T12:00:00Z");
    const periodActive = getTransitWindowForSign("Cancer", mockTransitions, nowActive);
    expect(periodActive).toBe("Oct 2 – Oct 4");
  });

  it("derives Leo transit window as 'Oct 4 – Oct 7'", () => {
    const now = new Date("2026-10-02T10:00:00Z");
    const period = getTransitWindowForSign("Leo", mockTransitions, now);
    expect(period).toBe("Oct 4 – Oct 7");
  });

  it("falls back to live astronomy-engine computation when transitions array is empty", () => {
    const now = new Date("2026-10-02T12:00:00Z");
    const period = getTransitWindowForSign("Cancer", [], now);
    expect(period).toBe("Oct 2 – Oct 4");
  });

  it("computes live transitions matching ephemeris ingress boundaries", () => {
    const from = new Date("2026-10-01T00:00:00Z");
    const to = new Date("2026-10-10T00:00:00Z");
    const transitions = computeLiveTransitions(from, to);

    expect(transitions.length).toBeGreaterThanOrEqual(3);
    const cancerEvent = transitions.find((t) => t.to_sign === "Cancer");
    expect(cancerEvent).toBeDefined();
    expect(cancerEvent?.transition_date).toBe("2026-10-02");
  });
});
