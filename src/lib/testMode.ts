/* Test Mode — global date override for Daily Pulse / triad calculations.
 * Stored in localStorage, broadcast via a custom event so listeners
 * can react without prop-drilling. */

const KEY = "moonday.testModeDate";
const EVT = "moonday:testmode-change";

export function getTestDate(): Date | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function setTestDate(date: Date | null) {
  try {
    if (date) localStorage.setItem(KEY, date.toISOString());
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVT));
}

export function subscribeTestDate(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** Anchor for the public global pulse.
 * Baseline is UTC noon so everyone reads the same day, but once that moment
 * has passed we track the live sky — otherwise an ingress that happens after
 * 12:00 UTC (e.g. Moon → Pisces at 12:13 UTC) would show the previous sign
 * for the rest of the day. */
export function utcNoon(at: Date = new Date()): Date {
  const d = new Date(at);
  d.setUTCHours(12, 0, 0, 0);
  return at.getTime() > d.getTime() ? new Date(at) : d;
}
