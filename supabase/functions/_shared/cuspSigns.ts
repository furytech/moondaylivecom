// The Moon signs a birth date can validly have: the sign at the start of the local day and the sign at its
// end (the same sign on an ordinary day, two on a Moon-change day). Mirrors src/lib/cuspDay.ts, with the
// Moon's longitude passed in so this file has no URL imports and vitest can use it too.

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

/** Ecliptic longitude of the Moon in degrees at the given instant (ms since epoch). */
export type MoonLongitudeAt = (ms: number) => number;

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function zoneOffsetMinutes(tz: string, at: Date): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const parts = Object.fromEntries(dtf.formatToParts(at).map((p) => [p.type, p.value])) as Record<string, string>;
    const asUTC = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour === "24" ? "0" : parts.hour), Number(parts.minute), Number(parts.second),
    );
    return Math.round((asUTC - at.getTime()) / 60000);
  } catch {
    return 0;
  }
}

function localMidnightUtc(year: number, month: number, day: number, tz: string): number {
  const zone = isValidTimezone(tz) ? tz : "UTC";
  const naive = Date.UTC(year, month - 1, day, 0, 0, 0);
  let t = naive - zoneOffsetMinutes(zone, new Date(naive)) * 60000;
  t = naive - zoneOffsetMinutes(zone, new Date(t)) * 60000;
  return t;
}

/** One sign on an ordinary day, two on a Moon-change day, in the person's own timezone. */
export function validMoonSigns(birthday: string, tz: string, moonLongitudeAt: MoonLongitudeAt): string[] {
  const zone = isValidTimezone(tz) ? tz : "UTC";
  const [y, m, d] = birthday.split("T")[0].split("-").map(Number);
  const start = localMidnightUtc(y, m, d, zone);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const end = localMidnightUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), zone);
  const signAt = (ms: number) => ZODIAC[Math.floor((((moonLongitudeAt(ms) % 360) + 360) % 360) / 30) % 12];
  const from = signAt(start);
  const to = signAt(end - 1000);
  return from === to ? [from] : [from, to];
}
