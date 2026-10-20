// The logged-out "reveal": from a birthday alone, work out the Sun sign and the Moon sign
// (or the two possible Moon signs on a Moon-change birthday). Birthday only, never birth time or place.
// Moon sign assumes noon on the birth date; the Moon-change check uses the person's own timezone.

import { calculateMoonSignAsync, calculateSunSign } from "@/lib/moonSign";
import { getLocalCuspDay } from "@/lib/cuspDay";

export const MIN_BIRTH_YEAR = 1920;

/** "1985", "3", "7" -> "1985-03-07" */
export function buildBirthday(year: string, month: string, day: string): string {
  if (!year || !month || !day) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** A real calendar date (no Feb 31), not in the future, not before MIN_BIRTH_YEAR. */
export function isValidBirthday(birthday: string, today: Date = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday);
  if (!match) return false;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (y < MIN_BIRTH_YEAR) return false;
  const utc = new Date(Date.UTC(y, m - 1, d));
  if (utc.getUTCFullYear() !== y || utc.getUTCMonth() !== m - 1 || utc.getUTCDate() !== d) return false;
  const todayKey = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return y * 10000 + m * 100 + d <= todayKey;
}

export interface BirthdayReveal {
  birthday: string;
  timezone: string;
  sunSign: string;
  /** True when the Moon changed signs during the person's local birthday */
  isCuspDay: boolean;
  /** The two signs the Moon moved between, in order. Null on an ordinary birthday. */
  cuspSigns: [string, string] | null;
  /** The natal Moon sign. Null on a Moon-change birthday until the Moon Cusp Quiz settles it. */
  moonSign: string | null;
}

export async function revealForBirthday(birthday: string, timezone: string): Promise<BirthdayReveal> {
  const sunSign = calculateSunSign(birthday);
  const day = getLocalCuspDay(birthday, timezone);
  if (day.isCuspDay) {
    return { birthday, timezone, sunSign, isCuspDay: true, cuspSigns: [day.from, day.to], moonSign: null };
  }
  const moon = await calculateMoonSignAsync(new Date(`${birthday}T12:00:00`));
  return { birthday, timezone, sunSign, isCuspDay: false, cuspSigns: null, moonSign: moon.sign };
}
