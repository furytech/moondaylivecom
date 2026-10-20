// The result of the birthday + email step, handed to /your-moon-sign.
// sessionStorage only: it holds the email and birthday for this tab's visit and is never put in a URL.

const KEY = "moonday:reveal";

export type RevealState =
  | {
      /** A new account was created (or, for a Moon-change birthday, created and then settled by the quiz). */
      kind: "reveal";
      email: string;
      birthday: string;
      sunSign: string;
      moonSign: string;
    }
  | {
      /** The email already had an unconfirmed signup: only its link was sent again. Nothing else is stored or shown. */
      kind: "resent";
      email: string;
    };

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
    const s = JSON.parse(raw) as { kind?: string; email?: string; birthday?: string; sunSign?: string; moonSign?: string };
    if (!s.email) return null;
    if (s.kind === "resent") return { kind: "resent", email: s.email };
    if (s.kind === "reveal" && s.birthday && s.sunSign && s.moonSign) {
      return { kind: "reveal", email: s.email, birthday: s.birthday, sunSign: s.sunSign, moonSign: s.moonSign };
    }
    return null;
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
