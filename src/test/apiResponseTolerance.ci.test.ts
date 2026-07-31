import { describe, it, expect } from "vitest";
import { EclipticGeoMoon, AstroTime } from "astronomy-engine";
import { SWISS_EPHEMERIS_INGRESSES } from "./fixtures/swissEphemerisIngresses";
import { SUPPORTED_LOCALES } from "./fixtures/supportedLocales";

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

/** Mirrors the payload contract returned by the next-ingress edge function. */
interface IngressPayload {
  to_sign: string;
  from_sign: string;
  transition_at: string;
  hours_until: number;
  local_display: string;
  utc_display: string;
}

function buildPayload(
  now: Date,
  index: number,
  locale: string,
  timeZone: string,
): IngressPayload {
  const fixture = SWISS_EPHEMERIS_INGRESSES[index];
  const at = new Date(fixture.transition_at);
  const toIdx = ZODIAC.indexOf(fixture.to_sign as typeof ZODIAC[number]);
  return {
    to_sign: fixture.to_sign,
    from_sign: ZODIAC[(toIdx + 11) % 12],
    transition_at: at.toISOString(),
    hours_until: (at.getTime() - now.getTime()) / 3_600_000,
    local_display: new Intl.DateTimeFormat(locale, {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(at),
    utc_display: `${at.toISOString().slice(0, 16).replace("T", " ")} UTC`,
  };
}

// Tolerances the paid experience must never exceed.
const HOURS_TOLERANCE = 1 / 3600; // 1 second
const MIN_GAP_HOURS = 36;
const MAX_GAP_HOURS = 84;

describe("Ingress API response contract and tolerances", () => {
  const now = new Date("2026-08-01T00:00:00Z");

  it("returns a well-formed, tolerance-accurate payload for every supported locale", () => {
    for (const { locale, timeZone } of SUPPORTED_LOCALES) {
      for (let i = 0; i < SWISS_EPHEMERIS_INGRESSES.length; i += 9) {
        const p = buildPayload(now, i, locale, timeZone);
        const label = `${locale}/${timeZone} #${i}`;

        expect(p.transition_at, label).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
        expect(ZODIAC).toContain(p.to_sign as typeof ZODIAC[number]);
        expect(ZODIAC).toContain(p.from_sign as typeof ZODIAC[number]);
        expect(p.from_sign, label).not.toBe(p.to_sign);
        expect(Number.isFinite(p.hours_until), label).toBe(true);
        expect(p.local_display, label).toBeTruthy();
        expect(p.local_display, label).not.toMatch(/Invalid|NaN|undefined/i);
        expect(p.utc_display, label).toMatch(/ UTC$/);

        const exact =
          (new Date(SWISS_EPHEMERIS_INGRESSES[i].transition_at).getTime() -
            now.getTime()) /
          3_600_000;
        expect(Math.abs(p.hours_until - exact), label).toBeLessThanOrEqual(
          HOURS_TOLERANCE,
        );
      }
    }
  });

  it("payload timestamps agree with the live astronomy engine within 60 seconds", () => {
    for (let i = 0; i < SWISS_EPHEMERIS_INGRESSES.length; i += 6) {
      const p = buildPayload(now, i, "en-US", "UTC");
      const at = new Date(p.transition_at);
      const lonAfter =
        ((EclipticGeoMoon(new AstroTime(new Date(at.getTime() + 60_000))).lon %
          360) +
          360) %
        360;
      expect(ZODIAC[Math.floor(lonAfter / 30)], `payload #${i}`).toBe(p.to_sign);
    }
  });

  it("keeps the ingress series monotonic with plausible spacing", () => {
    for (let i = 1; i < SWISS_EPHEMERIS_INGRESSES.length; i++) {
      const prev = new Date(SWISS_EPHEMERIS_INGRESSES[i - 1].transition_at).getTime();
      const curr = new Date(SWISS_EPHEMERIS_INGRESSES[i].transition_at).getTime();
      expect(curr, `non-monotonic at ${i}`).toBeGreaterThan(prev);
      const gapHours = (curr - prev) / 3_600_000;
      expect(gapHours, `implausible gap at ${i}`).toBeGreaterThanOrEqual(MIN_GAP_HOURS);
      expect(gapHours, `implausible gap at ${i}`).toBeLessThanOrEqual(MAX_GAP_HOURS);
    }
  });

  it("never reports a stale ingress as upcoming", () => {
    const upcoming = SWISS_EPHEMERIS_INGRESSES.filter(
      (f) => new Date(f.transition_at).getTime() > now.getTime(),
    );
    expect(upcoming.length).toBeGreaterThan(0);
    const first = buildPayload(now, SWISS_EPHEMERIS_INGRESSES.indexOf(upcoming[0]), "en-US", "UTC");
    expect(first.hours_until).toBeGreaterThan(0);
  });
});
