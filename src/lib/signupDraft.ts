// What the visitor already told us on the way to signup, so nothing is typed twice:
// the birthday, their timezone (auto-detected) and the Moon sign they were shown
// (or chose in the Moon Cusp Quiz). Lives in sessionStorage only, never in a URL.

import { isValidBirthday } from "@/lib/birthdayReveal";

const KEY = "moonday:signupDraft";

export interface SignupDraft {
  /** YYYY-MM-DD */
  birthday: string;
  timezone: string;
  /** Null until a Moon-change birthday has been settled by the quiz */
  moonSign: string | null;
  /** Prefill from a "get the newsletter" style entry point */
  email?: string;
}

export function loadSignupDraft(): SignupDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<SignupDraft>;
    if (!draft.birthday || !isValidBirthday(draft.birthday) || !draft.timezone) return null;
    return {
      birthday: draft.birthday,
      timezone: draft.timezone,
      moonSign: draft.moonSign ?? null,
      email: draft.email,
    };
  } catch {
    return null;
  }
}

export function saveSignupDraft(draft: SignupDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* storage unavailable: the visitor will be asked for the birthday again */
  }
}

export function clearSignupDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Where the signup flow starts. Signup itself redirects here when there is no complete draft. */
export const REVEAL_PATH = "/find-my-moon-sign";
