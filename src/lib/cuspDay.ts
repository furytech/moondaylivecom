// Moon-change ("cusp") day detection in the person's OWN timezone.
//
// A birthday is a calendar date in the place the person lives, so the Moon
// "changing signs on your birthday" is decided against the local day
// (midnight to midnight in their IANA timezone), not the UTC day.

import { EclipticGeoMoon, AstroTime } from "astronomy-engine";
import { zoneOffsetMinutes, isValidTimezone, UTC_ZONE } from "@/lib/timezone";
import type { MoonSign } from "@/lib/moonCuspQuiz";

const ZODIAC: MoonSign[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function moonSignAt(ms: number): MoonSign {
  const lon = EclipticGeoMoon(new AstroTime(new Date(ms))).lon;
  const norm = ((lon % 360) + 360) % 360;
  return ZODIAC[Math.floor(norm / 30) % 12];
}

/** UTC instant (ms) of 00:00 local time on the given calendar date in `tz`. */
export function localMidnightUtc(year: number, month: number, day: number, tz: string): number {
  const zone = isValidTimezone(tz) ? tz : UTC_ZONE;
  const naive = Date.UTC(year, month - 1, day, 0, 0, 0);
  // The offset can differ between "naive" and the true instant around DST
  // changes, so settle it with a second pass.
  let t = naive - zoneOffsetMinutes(zone, new Date(naive)) * 60000;
  t = naive - zoneOffsetMinutes(zone, new Date(t)) * 60000;
  return t;
}

export interface LocalCuspDay {
  isCuspDay: boolean;
  /** Sign the Moon was in at local midnight that begins the day */
  from: MoonSign;
  /** Sign the Moon was in at the end of the local day */
  to: MoonSign;
  /** The moment the Moon changed sign (null when it didn't change that day) */
  ingress: Date | null;
  /** Share (0..1) of the local day spent in `from` (1 when no change) */
  fractionBeforeIngress: number;
  timezone: string;
}

/**
 * @param birthday "YYYY-MM-DD" (a time part, if present, is ignored)
 * @param tz IANA timezone of the person
 */
export function getLocalCuspDay(birthday: string, tz: string): LocalCuspDay {
  const zone = isValidTimezone(tz) ? tz : UTC_ZONE;
  const [y, m, d] = birthday.split("T")[0].split("-").map(Number);
  // Date.UTC rolls over month ends, which gives the next local midnight
  const start = localMidnightUtc(y, m, d, zone);
  const nextDay = new Date(Date.UTC(y, m - 1, d + 1));
  const end = localMidnightUtc(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth() + 1,
    nextDay.getUTCDate(),
    zone,
  );

  const from = moonSignAt(start);
  const to = moonSignAt(end - 1000);
  if (from === to) {
    return { isCuspDay: false, from, to, ingress: null, fractionBeforeIngress: 1, timezone: zone };
  }

  // The Moon changes sign roughly every 2.3 days, so there is one ingress at
  // most inside a ~24h day. Bisect to the second.
  let lo = start;
  let hi = end - 1000;
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (moonSignAt(mid) === from) lo = mid;
    else hi = mid;
  }
  const ingressMs = hi;
  return {
    isCuspDay: true,
    from,
    to,
    ingress: new Date(ingressMs),
    fractionBeforeIngress: (ingressMs - start) / (end - start),
    timezone: zone,
  };
}

/** "March 3, 2026" for a YYYY-MM-DD calendar date */
export function formatBirthdayLong(birthday: string): string {
  const [y, m, d] = birthday.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** "2:14 AM" in the person's timezone */
export function formatIngressTime(ingress: Date, tz: string): string {
  return ingress.toLocaleTimeString("en-US", {
    timeZone: isValidTimezone(tz) ? tz : UTC_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Fill {placeholders} in CUSP_COPY strings */
export function fillCopy(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

/** Random flip per question: true => show the "later" answer first */
export function makeShuffle(count: number, rand: () => number = Math.random): boolean[] {
  return Array.from({ length: count }, () => rand() < 0.5);
}
