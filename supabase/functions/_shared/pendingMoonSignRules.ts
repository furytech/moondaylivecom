// Rules for saving a Moon-change quiz result for an account that has not confirmed its email yet
// (no session exists, so the browser cannot write its own profile). Pure, so vitest can import it.

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

/** An unconfirmed account can only be settled for this long after it was created. */
export const SETTLE_WINDOW_MS = 48 * 60 * 60 * 1000;

export interface SettleUser {
  created_at: string;
  email_confirmed_at: string | null;
}
export interface SettleProfile {
  birthday: string | null;
  moon_sign: string | null;
  natal_moon_sign: string | null;
}

export type SettleDecision = "ok" | "bad_sign" | "no_account" | "already_set" | "no_birthday" | "confirmed" | "expired";

export function decideSettle(
  sign: unknown,
  user: SettleUser | null,
  profile: SettleProfile | null,
  now: number = Date.now(),
): SettleDecision {
  if (typeof sign !== "string" || !(ZODIAC_SIGNS as readonly string[]).includes(sign)) return "bad_sign";
  if (!user || !profile) return "no_account";
  // Never overwrite a sign that is already saved (birthdays and signs are locked after signup).
  if (profile.moon_sign || profile.natal_moon_sign) return "already_set";
  if (!profile.birthday) return "no_birthday";
  // Once confirmed, the member has a session and saves through their own profile instead.
  if (user.email_confirmed_at) return "confirmed";
  const created = Date.parse(user.created_at);
  if (Number.isNaN(created) || now - created > SETTLE_WINDOW_MS) return "expired";
  return "ok";
}
