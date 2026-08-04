/**
 * Timezone helpers.
 *
 * Moonday publishes all lunar content on UTC — an ingress is a single universal
 * moment, not a local one. A member's timezone only changes the clock label we
 * render, never the calculation.
 */

export const UTC_ZONE = "UTC";

export type TimezoneOption = { value: string; label: string };

/** Curated list covering the overwhelming majority of members. */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: "UTC", label: "UTC — Coordinated Universal Time" },
  { value: "Pacific/Honolulu", label: "Hawaii — Honolulu" },
  { value: "America/Anchorage", label: "Alaska — Anchorage" },
  { value: "America/Los_Angeles", label: "Pacific — Los Angeles" },
  { value: "America/Denver", label: "Mountain — Denver" },
  { value: "America/Phoenix", label: "Mountain (no DST) — Phoenix" },
  { value: "America/Chicago", label: "Central — Chicago" },
  { value: "America/New_York", label: "Eastern — New York" },
  { value: "America/Halifax", label: "Atlantic — Halifax" },
  { value: "America/Sao_Paulo", label: "Brazil — São Paulo" },
  { value: "Europe/London", label: "UK — London" },
  { value: "Europe/Dublin", label: "Ireland — Dublin" },
  { value: "Europe/Lisbon", label: "Portugal — Lisbon" },
  { value: "Europe/Madrid", label: "Spain — Madrid" },
  { value: "Europe/Paris", label: "France — Paris" },
  { value: "Europe/Berlin", label: "Germany — Berlin" },
  { value: "Europe/Rome", label: "Italy — Rome" },
  { value: "Europe/Athens", label: "Greece — Athens" },
  { value: "Europe/Istanbul", label: "Türkiye — Istanbul" },
  { value: "Europe/Moscow", label: "Russia — Moscow" },
  { value: "Africa/Lagos", label: "West Africa — Lagos" },
  { value: "Africa/Johannesburg", label: "South Africa — Johannesburg" },
  { value: "Africa/Cairo", label: "Egypt — Cairo" },
  { value: "Asia/Dubai", label: "Gulf — Dubai" },
  { value: "Asia/Karachi", label: "Pakistan — Karachi" },
  { value: "Asia/Kolkata", label: "India — Kolkata" },
  { value: "Asia/Dhaka", label: "Bangladesh — Dhaka" },
  { value: "Asia/Bangkok", label: "Thailand — Bangkok" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Shanghai", label: "China — Shanghai" },
  { value: "Asia/Tokyo", label: "Japan — Tokyo" },
  { value: "Asia/Seoul", label: "Korea — Seoul" },
  { value: "Australia/Perth", label: "Australia — Perth" },
  { value: "Australia/Adelaide", label: "Australia — Adelaide" },
  { value: "Australia/Sydney", label: "Australia — Sydney" },
  { value: "Pacific/Auckland", label: "New Zealand — Auckland" },
];

/** Best-effort detection of the visitor's IANA timezone. Falls back to UTC. */
export function detectTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && isValidTimezone(tz) ? tz : UTC_ZONE;
  } catch {
    return UTC_ZONE;
  }
}

/**
 * Detection, snapped to the closest option in the curated list when the exact
 * zone isn't listed (e.g. America/Detroit -> America/New_York) so the select
 * always shows a real selection.
 */
export function detectTimezoneOption(): string {
  const detected = detectTimezone();
  if (TIMEZONE_OPTIONS.some((o) => o.value === detected)) return detected;

  const offset = zoneOffsetMinutes(detected);
  let best = UTC_ZONE;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const option of TIMEZONE_OPTIONS) {
    const delta = Math.abs(zoneOffsetMinutes(option.value) - offset);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = option.value;
    }
  }
  return best;
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Current UTC offset of a zone, in minutes (east of Greenwich positive). */
export function zoneOffsetMinutes(tz: string, at: Date = new Date()): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = Object.fromEntries(
      dtf.formatToParts(at).map((p) => [p.type, p.value])
    ) as Record<string, string>;
    const asUTC = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour === "24" ? "0" : parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );
    return Math.round((asUTC - at.getTime()) / 60000);
  } catch {
    return 0;
  }
}

/** Short zone abbreviation, e.g. "EDT", "GMT+2". */
export function zoneAbbreviation(tz: string, at: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(at);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? tz;
  } catch {
    return tz;
  }
}

/** Format an instant in a given zone, e.g. "Aug 5, 2026, 10:35 PM EDT". */
export function formatInZone(
  date: Date | string,
  tz: string,
  opts: { withDate?: boolean; withZone?: boolean } = {}
): string {
  const { withDate = true, withZone = true } = opts;
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      ...(withDate
        ? { month: "short", day: "numeric", year: "numeric" }
        : {}),
      hour: "numeric",
      minute: "2-digit",
      ...(withZone ? { timeZoneName: "short" as const } : {}),
    }).format(value);
  } catch {
    return value.toISOString();
  }
}

/** True when the member's clock differs from the UTC publishing clock. */
export function differsFromUTC(tz: string, at: Date = new Date()): boolean {
  return tz !== UTC_ZONE && zoneOffsetMinutes(tz, at) !== 0;
}
