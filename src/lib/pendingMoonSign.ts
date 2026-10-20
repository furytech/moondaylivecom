// A Moon-change birthday's quiz result, held in this browser until the member confirms their email and signs in
// (the account is created before the quiz, but a session only exists after confirming). Applied once, to a
// profile whose birthday matches, then cleared.

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
