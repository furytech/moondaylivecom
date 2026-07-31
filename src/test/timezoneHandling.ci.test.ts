import { describe, it, expect, afterAll } from "vitest";
import { SWISS_EPHEMERIS_INGRESSES } from "./fixtures/swissEphemerisIngresses";
import {
  SUPPORTED_LOCALES,
  zoneOffsetMinutes,
} from "./fixtures/supportedLocales";

const ORIGINAL_TZ = process.env.TZ;
afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

const SAMPLE = SWISS_EPHEMERIS_INGRESSES.filter((_, i) => i % 7 === 0);

function partsInZone(at: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return Object.fromEntries(
    dtf.formatToParts(at).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
}

describe("Timezone handling across supported locales", () => {
  it("renders every ingress in every locale without throwing or producing Invalid Date", () => {
    for (const { locale, timeZone } of SUPPORTED_LOCALES) {
      for (const ingress of SAMPLE) {
        const at = new Date(ingress.transition_at);
        expect(Number.isNaN(at.getTime())).toBe(false);
        const rendered = new Intl.DateTimeFormat(locale, {
          timeZone,
          dateStyle: "medium",
          timeStyle: "short",
        }).format(at);
        expect(rendered, `${locale}/${timeZone}`).toBeTruthy();
        expect(rendered).not.toMatch(/Invalid/i);
      }
    }
  });

  it("round-trips local wall time back to the exact UTC instant (zero drift)", () => {
    for (const { timeZone } of SUPPORTED_LOCALES) {
      for (const ingress of SAMPLE) {
        const at = new Date(ingress.transition_at);
        const p = partsInZone(at, timeZone);
        const asIfUTC = Date.UTC(
          Number(p.year),
          Number(p.month) - 1,
          Number(p.day),
          Number(p.hour) % 24,
          Number(p.minute),
          Number(p.second),
        );
        const reconstructed = asIfUTC - zoneOffsetMinutes(timeZone, at) * 60000;
        expect(
          reconstructed,
          `${timeZone} @ ${ingress.transition_at}`,
        ).toBe(at.getTime());
      }
    }
  });

  it("keeps the canonical UTC label identical regardless of the server's ambient timezone", () => {
    const ambientZones = ["UTC", "America/New_York", "Asia/Kathmandu", "Pacific/Auckland"];
    for (const ingress of SAMPLE) {
      const labels = new Set<string>();
      for (const tz of ambientZones) {
        process.env.TZ = tz;
        const at = new Date(ingress.transition_at);
        labels.add(
          `${at.toISOString()}|${at.getUTCHours()}:${at.getUTCMinutes()}`,
        );
      }
      expect(labels.size, `ambient TZ leaked into ${ingress.transition_at}`).toBe(1);
    }
    process.env.TZ = ORIGINAL_TZ;
  });

  it("computes local calendar day consistently with the zone offset (incl. half/quarter-hour zones)", () => {
    for (const { timeZone } of SUPPORTED_LOCALES) {
      for (const ingress of SAMPLE) {
        const at = new Date(ingress.transition_at);
        const offset = zoneOffsetMinutes(timeZone, at);
        const shifted = new Date(at.getTime() + offset * 60000);
        const p = partsInZone(at, timeZone);
        expect(
          `${p.year}-${p.month}-${p.day}`,
          `${timeZone} local day mismatch for ${ingress.transition_at}`,
        ).toBe(shifted.toISOString().slice(0, 10));
      }
    }
  });

  it("only produces offsets that are whole multiples of 15 minutes and within ±14h", () => {
    for (const { timeZone } of SUPPORTED_LOCALES) {
      for (const ingress of SAMPLE) {
        const offset = zoneOffsetMinutes(timeZone, new Date(ingress.transition_at));
        expect(Math.abs(offset)).toBeLessThanOrEqual(14 * 60);
        expect(Math.abs(offset % 15), `${timeZone} offset ${offset}`).toBe(0);
      }
    }
  });
});
