import { describe, it, expect } from "vitest";
import { EclipticGeoMoon, AstroTime } from "astronomy-engine";
import { SWISS_EPHEMERIS_INGRESSES } from "./fixtures/swissEphemerisIngresses";

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

// Mirrors supabase/functions/seed-moon-transitions/index.ts exactly.
function moonLongitude(date: Date): number {
  const ecl = EclipticGeoMoon(new AstroTime(date));
  return ((ecl.lon % 360) + 360) % 360;
}

function signFromLongitude(lon: number): string {
  return ZODIAC[Math.floor(lon / 30)];
}

function computeTransitions(from: Date, to: Date) {
  const events: { transition_at: string; to_sign: string }[] = [];
  const stepMs = 10 * 60 * 1000;
  let prevSign = signFromLongitude(moonLongitude(from));

  for (let t = from.getTime() + stepMs; t <= to.getTime(); t += stepMs) {
    const sign = signFromLongitude(moonLongitude(new Date(t)));
    if (sign !== prevSign) {
      let lo = t - stepMs;
      let hi = t;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (signFromLongitude(moonLongitude(new Date(mid))) === prevSign) lo = mid;
        else hi = mid;
      }
      events.push({ transition_at: new Date(hi).toISOString(), to_sign: sign });
      prevSign = sign;
    }
  }
  return events;
}

// Apparent (Swiss Ephemeris) vs true-of-date (astronomy-engine) positions differ
// by light-time/aberration (~0.7"), i.e. a handful of seconds of Moon motion.
const TOLERANCE_SECONDS = 60;

describe("Moon ingress engine vs Swiss Ephemeris", () => {
  const from = new Date("2026-08-01T00:00:00Z");
  const to = new Date("2026-09-30T00:00:00Z");
  const computed = computeTransitions(from, to);

  it("finds the same number of ingresses", () => {
    expect(computed.length).toBe(SWISS_EPHEMERIS_INGRESSES.length);
  });

  it("matches every ingress sign and timestamp within tolerance", () => {
    SWISS_EPHEMERIS_INGRESSES.forEach((expected, i) => {
      const actual = computed[i];
      expect(actual, `missing ingress #${i}`).toBeDefined();
      expect(actual.to_sign).toBe(expected.to_sign);

      const deltaSeconds = Math.abs(
        new Date(actual.transition_at).getTime() -
          new Date(expected.transition_at).getTime(),
      ) / 1000;

      expect(
        deltaSeconds,
        `${expected.to_sign} ingress drifted ${deltaSeconds.toFixed(1)}s (expected ${expected.transition_at}, got ${actual.transition_at})`,
      ).toBeLessThanOrEqual(TOLERANCE_SECONDS);
    });
  });
});
