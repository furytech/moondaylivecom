// Safe wrappers around the astronomy engine.
//
// Ephemeris math should never take a results screen down with it. Every call
// here returns a discriminated result instead of throwing, so the UI can show
// an informative fallback and stay interactive while the rest of the page
// renders normally.

import {
  getLunarIntelligence,
  getTimeUntilNextSign,
  type LunarIntelligence,
} from "@/lib/lunarEngine";

export type SafeResult<T> =
  | { ok: true; data: T; error: null }
  | { ok: false; data: null; error: string };

/** Human-readable message for a failed calculation. Never leaks a stack trace. */
export const CALCULATION_ERROR_MESSAGE =
  "We couldn't read the sky just now. This is on our side, not yours — your birth data is safe.";

function fail(scope: string, err: unknown): SafeResult<never> {
  console.error(`[safeLunar] ${scope} failed`, err);
  return { ok: false, data: null, error: CALCULATION_ERROR_MESSAGE };
}

function isUsable(l: LunarIntelligence | null | undefined): l is LunarIntelligence {
  return !!l?.sign?.name && !!l?.phase?.name;
}

/** Current lunar intelligence, or an error result if the engine misbehaves. */
export function safeLunarIntelligence(date: Date = new Date()): SafeResult<LunarIntelligence> {
  try {
    const data = getLunarIntelligence(date);
    if (!isUsable(data)) return fail("getLunarIntelligence", new Error("Incomplete lunar payload"));
    return { ok: true, data, error: null };
  } catch (err) {
    return fail("getLunarIntelligence", err);
  }
}

/** "3h 14m" until the next sign ingress, or an error result. */
export function safeTimeUntilNextSign(date: Date = new Date()): SafeResult<string> {
  try {
    const { hours, minutes } = getTimeUntilNextSign(date);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return fail("getTimeUntilNextSign", new Error("Non-finite interval"));
    }
    return { ok: true, data: `${hours}h ${minutes}m`, error: null };
  } catch (err) {
    return fail("getTimeUntilNextSign", err);
  }
}
