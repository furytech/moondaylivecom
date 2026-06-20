/**
 * Dev-only tier override. Lets a developer preview the app as Free or
 * Sovereign without juggling test accounts.
 *
 * SHIPS NOTHING TO PRODUCTION: every public function short-circuits when
 * `import.meta.env.DEV` is false. Vite strips the dead branches from the
 * production bundle, so the override logic and the DevTierPanel component
 * are physically absent from the published build.
 */

const KEY = "moonday.devTierOverride";
const EVT = "moonday:dev-tier-change";

export type DevTierOverride = "free" | "sovereign" | null;

export function getDevTierOverride(): DevTierOverride {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (raw === "free" || raw === "sovereign") return raw;
    return null;
  } catch {
    return null;
  }
}

export function setDevTierOverride(value: DevTierOverride) {
  if (!import.meta.env.DEV) return;
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVT));
}

export function subscribeDevTier(listener: () => void): () => void {
  if (!import.meta.env.DEV) return () => {};
  const handler = () => listener();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}
