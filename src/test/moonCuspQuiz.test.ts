import { describe, it, expect } from "vitest";
import {
  MOON_CUSP_PAIRS,
  getCuspPair,
  scoreCuspQuiz,
  CUSP_COPY,
  type MoonSign,
} from "@/lib/moonCuspQuiz";
import {
  getLocalCuspDay,
  localMidnightUtc,
  makeShuffle,
  fillCopy,
  formatIngressTime,
} from "@/lib/cuspDay";

const ZODIAC: MoonSign[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

describe("Moon Cusp Quiz question bank", () => {
  it("has a pair for every adjacent sign crossing, each with 5 questions", () => {
    expect(Object.keys(MOON_CUSP_PAIRS)).toHaveLength(12);
    ZODIAC.forEach((from, i) => {
      const to = ZODIAC[(i + 1) % 12];
      const pair = getCuspPair(from, to);
      expect(pair, `${from}-${to}`).toBeDefined();
      expect(pair!.questions).toHaveLength(5);
      pair!.questions.forEach((q) => {
        expect(q.prompt.length).toBeGreaterThan(5);
        expect(q.earlier.length).toBeGreaterThan(5);
        expect(q.later.length).toBeGreaterThan(5);
      });
    });
  });
});

describe("scoreCuspQuiz", () => {
  const pair = getCuspPair("Aries", "Taurus")!;

  it("uses the time of day as the prior: ingress at 2am local, no answers, is about 92% later sign", () => {
    const s = scoreCuspQuiz(pair, 2 / 24, []);
    expect(s.probabilityLater).toBeCloseTo(0.917, 2);
    expect(s.leading).toBe("Taurus");
    expect(s.certainty).toBe("clear");
  });

  it("five 'earlier' answers flip a 2am-ingress day to the earlier sign", () => {
    const s = scoreCuspQuiz(pair, 2 / 24, Array(5).fill("earlier"));
    expect(s.leading).toBe("Aries");
    expect(s.probabilityEarlier).toBeGreaterThan(0.5);
  });

  it("is 'close' when the evidence is mixed", () => {
    const s = scoreCuspQuiz(pair, 0.5, ["earlier", "later", "earlier", "later", "earlier"]);
    expect(s.certainty).toBe("close");
  });

  it("is 'clear' when answers all agree on a mid-day crossing", () => {
    const s = scoreCuspQuiz(pair, 0.5, Array(5).fill("later"));
    expect(s.leading).toBe("Taurus");
    expect(s.certainty).toBe("clear");
  });
});

describe("local-day Moon-change detection", () => {
  it("finds local midnight in the person's timezone", () => {
    expect(new Date(localMidnightUtc(2026, 1, 15, "America/New_York")).toISOString()).toBe("2026-01-15T05:00:00.000Z");
    expect(new Date(localMidnightUtc(2026, 7, 15, "America/New_York")).toISOString()).toBe("2026-07-15T04:00:00.000Z");
    expect(new Date(localMidnightUtc(2026, 3, 10, "Asia/Kolkata")).toISOString()).toBe("2026-03-09T18:30:00.000Z");
  });

  it("puts the ingress inside the local day, with a sensible fraction", () => {
    let found = 0;
    for (let d = 1; d <= 6 && found < 2; d++) {
      const day = `2026-03-0${d}`;
      const r = getLocalCuspDay(day, "Pacific/Auckland");
      if (!r.isCuspDay) continue;
      found++;
      const start = localMidnightUtc(2026, 3, d, "Pacific/Auckland");
      const end = localMidnightUtc(2026, 3, d + 1, "Pacific/Auckland");
      expect(r.ingress!.getTime()).toBeGreaterThanOrEqual(start);
      expect(r.ingress!.getTime()).toBeLessThanOrEqual(end);
      expect(r.fractionBeforeIngress).toBeGreaterThan(0);
      expect(r.fractionBeforeIngress).toBeLessThan(1);
      expect(r.from).not.toBe(r.to);
      expect(getCuspPair(r.from, r.to)).toBeDefined();
    }
    expect(found).toBeGreaterThan(0);
  });

  it("can disagree with the UTC day for the same calendar date", () => {
    // Over a month, at least one date should be a Moon-change day in Auckland
    // but not in Honolulu (or vice versa), since the local days are ~23h apart.
    let differs = 0;
    for (let d = 1; d <= 28; d++) {
      const day = `2026-03-${String(d).padStart(2, "0")}`;
      const a = getLocalCuspDay(day, "Pacific/Auckland");
      const b = getLocalCuspDay(day, "Pacific/Honolulu");
      if (a.isCuspDay !== b.isCuspDay) differs++;
    }
    expect(differs).toBeGreaterThan(0);
  });
});

describe("helpers", () => {
  it("shuffles per question using the supplied random source", () => {
    const seq = [0.1, 0.9, 0.2, 0.8, 0.4];
    let i = 0;
    expect(makeShuffle(5, () => seq[i++])).toEqual([true, false, true, false, true]);
  });

  it("fills copy placeholders", () => {
    expect(fillCopy(CUSP_COPY.resultClose.chooseSign, { sign: "Leo" })).toBe("Leo feels like me");
  });

  it("formats the ingress time in the given timezone", () => {
    expect(formatIngressTime(new Date("2026-03-03T07:14:00Z"), "America/New_York")).toMatch(/^2:14\s?AM$/);
  });
});
