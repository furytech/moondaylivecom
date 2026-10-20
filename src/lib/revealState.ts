// The result of creating an account from the birthday + email step, handed to /your-moon-sign.
// sessionStorage only: it holds the email and birthday for this tab's visit and is never put in a URL.

const KEY = "moonday:reveal";

export interface RevealState {
  /** reveal: a new account was created. resent: the email had an unconfirmed signup, so no new reveal. */
  kind: "reveal" | "resent";
  email: string;
  birthday: string;
  sunSign: string;
  moonSign: string;
}

export function saveRevealState(state: RevealState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

export function loadRevealState(): RevealState | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<RevealState>;
    if (!s.email || !s.birthday || !s.sunSign || !s.moonSign || (s.kind !== "reveal" && s.kind !== "resent")) return null;
    return s as RevealState;
  } catch {
    return null;
  }
}

export function clearRevealState(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}
