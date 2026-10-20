// What a visitor has already told us on the way to a Moon-change quiz: the birthday and email they entered
// and their auto-detected timezone. A reveal only ever happens as part of creating an account, so the draft
// always carries the email. Lives in sessionStorage only, never in a URL.

import { isValidBirthday } from "@/lib/birthdayReveal";

const KEY = "moonday:signupDraft";

export interface SignupDraft {
  /** YYYY-MM-DD */
  birthday: string;
  timezone: string;
  email: string;
}

export function loadSignupDraft(): SignupDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<SignupDraft>;
    if (!draft.birthday || !isValidBirthday(draft.birthday) || !draft.timezone || !draft.email) return null;
    return { birthday: draft.birthday, timezone: draft.timezone, email: draft.email };
  } catch {
    return null;
  }
}

export function saveSignupDraft(draft: SignupDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* storage unavailable: the visitor will be asked again */
  }
}

export function clearSignupDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Where the flow starts. */
export const REVEAL_PATH = "/find-my-moon-sign";
