// A Moon-change birthday's quiz result, held in this browser until the member confirms their email and signs in
// (the account is created before the quiz, but a session only exists after confirming). Applied once, to a
// profile whose birthday matches, then cleared.

import { supabase } from "@/integrations/supabase/client";

const KEY = "moonday:pendingMoonSign";

export interface PendingMoonSign {
  birthday: string;
  sign: string;
}

export function savePendingMoonSign(pending: PendingMoonSign): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(pending));
  } catch {
    /* storage unavailable: the member will take the quiz again after confirming */
  }
}

export function loadPendingMoonSign(): PendingMoonSign | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PendingMoonSign>;
    return p.birthday && p.sign ? { birthday: p.birthday, sign: p.sign } : null;
  } catch {
    return null;
  }
}

export function clearPendingMoonSign(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Saves the quiz result on the server for an account that has not confirmed its email yet, so it
 *  survives the confirmation link opening in another browser, app or device. Never throws:
 *  the browser copy above remains as a fallback. Returns whether the server kept it. */
export async function savePendingMoonSignRemote(userId: string | undefined, sign: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data, error } = await supabase.functions.invoke("save-pending-moon-sign", { body: { userId, sign } });
    return !error && data?.saved === true;
  } catch {
    return false;
  }
}

export interface MemberMoonProfile {
  birthday: string | null;
  moon_sign: string | null;
  natal_moon_sign: string | null;
}

export type NextStep = "stay" | "apply-pending" | "quiz";

/** Where a confirmed, signed-in member goes after landing on the Blueprint.
 *  A saved Moon sign (written server-side at signup or by the quiz) means they stay: no quiz again.
 *  Only a member with no saved sign takes the quiz, or has this browser's kept result applied. */
export function nextStepForMember(profile: MemberMoonProfile | null, pending: PendingMoonSign | null): NextStep {
  if (!profile?.birthday) return "stay";
  if (profile.natal_moon_sign || profile.moon_sign) return "stay";
  const birthday = profile.birthday.split("T")[0];
  return pending && pending.birthday === birthday ? "apply-pending" : "quiz";
}
