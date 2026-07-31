// Locale / timezone matrix supported by Moonday Live.
// Covers UTC, half-hour and 45-minute offsets, DST and non-DST zones, and
// both sides of the international date line so day-boundary math is exercised.
export interface SupportedLocale {
  locale: string;
  timeZone: string;
  /** Whether the zone observes daylight saving time (day length can be 23/25h) */
  dst: boolean;
}

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  { locale: "en-US", timeZone: "UTC", dst: false },
  { locale: "en-US", timeZone: "America/New_York", dst: true },
  { locale: "en-US", timeZone: "America/Los_Angeles", dst: true },
  { locale: "en-US", timeZone: "America/Phoenix", dst: false },
  { locale: "es-MX", timeZone: "America/Mexico_City", dst: false },
  { locale: "pt-BR", timeZone: "America/Sao_Paulo", dst: false },
  { locale: "en-GB", timeZone: "Europe/London", dst: true },
  { locale: "fr-FR", timeZone: "Europe/Paris", dst: true },
  { locale: "de-DE", timeZone: "Europe/Berlin", dst: true },
  { locale: "ar-AE", timeZone: "Asia/Dubai", dst: false },
  { locale: "hi-IN", timeZone: "Asia/Kolkata", dst: false }, // +05:30
  { locale: "ne-NP", timeZone: "Asia/Kathmandu", dst: false }, // +05:45
  { locale: "ja-JP", timeZone: "Asia/Tokyo", dst: false },
  { locale: "en-AU", timeZone: "Australia/Adelaide", dst: true }, // +09:30 / +10:30
  { locale: "en-AU", timeZone: "Australia/Sydney", dst: true },
  { locale: "en-NZ", timeZone: "Pacific/Auckland", dst: true },
  { locale: "en-US", timeZone: "Pacific/Honolulu", dst: false },
  { locale: "en-US", timeZone: "Pacific/Kiritimati", dst: false }, // +14:00
];

/** Offset of a zone from UTC, in minutes, at a given instant. */
export function zoneOffsetMinutes(timeZone: string, at: Date): number {
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
  const parts = Object.fromEntries(
    dtf.formatToParts(at).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUTC - at.getTime()) / 60000);
}
