// Two tabs, one confirmation. The tab that signed up ("Check your inbox") and the tab the email link opens
// share the browser's auth session, so the inbox tab can move on by itself and the link tab can tell it did.
// Nothing here can help across different browsers (incognito vs regular): there the link tab just continues.

const ADVANCED_KEY = "moonday:confirmAdvancedAt";

/** How long the link tab waits for the inbox tab to claim the hand-off before continuing itself. */
export const GRACE_MS = 1500;
/** An "advanced" mark older than this is from some earlier signup, not this confirmation. */
export const ADVANCE_WINDOW_MS = 60_000;

/** True when the page was opened from a confirmation link (the hash carries type=signup). Read once, at
 *  load, before the auth client strips the hash. */
export function isConfirmLinkHash(hash: string): boolean {
  return /[#&]type=signup(&|$)/.test(hash) && /access_token=/.test(hash);
}

let landed = typeof window !== "undefined" && isConfirmLinkHash(window.location.hash);

export const arrivedViaConfirmLink = (): boolean => landed;
export const clearConfirmLanding = (): void => {
  landed = false;
};

/** The inbox tab calls this when it moves the member on. */
export function markAdvanced(now: number = Date.now()): void {
  try {
    localStorage.setItem(ADVANCED_KEY, String(now));
  } catch {
    /* storage unavailable: the link tab simply continues itself */
  }
}

export function advancedRecently(now: number = Date.now()): boolean {
  try {
    const at = Number(localStorage.getItem(ADVANCED_KEY));
    return Number.isFinite(at) && at > 0 && now - at >= 0 && now - at <= ADVANCE_WINDOW_MS;
  } catch {
    return false;
  }
}

/** What the link tab shows once it has a session. */
export type ConfirmOutcome = "continue" | "close-tab";
export const confirmOutcome = (advancedElsewhere: boolean): ConfirmOutcome =>
  advancedElsewhere ? "close-tab" : "continue";
