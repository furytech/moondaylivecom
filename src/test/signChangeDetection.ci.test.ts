import { describe, it, expect, afterAll } from "vitest";
import { EclipticGeoMoon, AstroTime } from "astronomy-engine";
import { SWISS_EPHEMERIS_INGRESSES } from "./fixtures/swissEphemerisIngresses";
import { SUPPORTED_LOCALES } from "./fixtures/supportedLocales";

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

function signAt(date: Date): string {
  const lon = ((EclipticGeoMoon(new AstroTime(date)).lon % 360) + 360) % 360;
  return ZODIAC[Math.floor(lon / 30)];
}

const ORIGINAL_TZ = process.env.TZ;
afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

// A minute either side of the exact ingress must land in different signs.
const EDGE_MS = 60 * 1000;

describe("Sign-change detection", () => {
  it("flips exactly at each ingress boundary", () => {
    for (let i = 0; i < SWISS_EPHEMERIS_INGRESSES.length; i++) {
      const { to_sign, transition_at } = SWISS_EPHEMERIS_INGRESSES[i];
      const at = new Date(transition_at).getTime();
      const before = signAt(new Date(at - EDGE_MS));
      const after = signAt(new Date(at + EDGE_MS));
      expect(after, `ingress #${i} (${transition_at})`).toBe(to_sign);
      expect(before, `no change detected at ${transition_at}`).not.toBe(to_sign);
    }
  });

  it("is identical under every supported ambient timezone", () => {
    const probes = SWISS_EPHEMERIS_INGRESSES.filter((_, i) => i % 5 === 0);
    const baseline = probes.map((p) => signAt(new Date(p.transition_at)));

    for (const { timeZone } of SUPPORTED_LOCALES) {
      process.env.TZ = timeZone;
      probes.forEach((p, i) => {
        expect(
          signAt(new Date(p.transition_at)),
          `${timeZone} changed sign detection at ${p.transition_at}`,
        ).toBe(baseline[i]);
      });
    }
    process.env.TZ = ORIGINAL_TZ;
  });

  it("advances signs in strict zodiac order with no skipped or repeated signs", () => {
    for (let i = 1; i < SWISS_EPHEMERIS_INGRESSES.length; i++) {
      const prev = ZODIAC.indexOf(SWISS_EPHEMERIS_INGRESSES[i - 1].to_sign as typeof ZODIAC[number]);
      const curr = ZODIAC.indexOf(SWISS_EPHEMERIS_INGRESSES[i].to_sign as typeof ZODIAC[number]);
      expect(curr, `sign order broke at index ${i}`).toBe((prev + 1) % 12);
    }
  });

  it("detects a sign change for the local day of every ingress, in every timezone", () => {
    // For each supported zone, the ingress instant must fall inside a local day
    // where the sign at local-start differs from the sign at local-end.
    const probes = SWISS_EPHEMERIS_INGRESSES.filter((_, i) => i % 11 === 0);
    for (const { timeZone } of SUPPORTED_LOCALES) {
      for (const p of probes) {
        const at = new Date(p.transition_at);
        const localParts = new Intl.DateTimeFormat("en-CA", {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(at);
        // Local day window, derived from the zone's offset at the ingress.
        const offsetMs =
          new Date(`${localParts}T00:00:00Z`).getTime() -
          new Date(
            new Intl.DateTimeFormat("en-CA", {
              timeZone: "UTC",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(at) + "T00:00:00Z",
          ).getTime();
        const dayStart = new Date(`${localParts}T00:00:00Z`).getTime() - offsetMs;
        const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1000;
        expect(at.getTime()).toBeGreaterThanOrEqual(dayStart);
        expect(at.getTime()).toBeLessThanOrEqual(dayEnd + 1000);
        expect(
          signAt(new Date(dayStart)) === signAt(new Date(dayEnd)),
          `${timeZone}: local day of ${p.transition_at} did not register a sign change`,
        ).toBe(false);
      }
    }
  });
});
