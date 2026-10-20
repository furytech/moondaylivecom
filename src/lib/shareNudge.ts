// "Share your Moon sign" nudges, kept per account in the member's own auth metadata (user_metadata.share_nudge),
// so the rules hold across devices and need no database change. Members only ever share THEIR OWN Moon sign:
// the link carries the sign and nothing else (see sharedMoonSeo.ts).
//
// Rules:
//  - the card is shown once, to a new member, on a Blueprint visit after the name prompt is answered
//  - one reminder if they have not shared 7 days after the first showing, then never again
//  - never again once they have shared, or dismissed it twice
//  - every share click is counted (clicks) so the nudges can be judged later

import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

export const REMINDER_AFTER_DAYS = 7;
/** Members older than this when the card would first appear are not "new" and never get it. */
export const NEW_MEMBER_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ShareNudgeState {
  /** How many times the card has been shown (max 2: the first time and one reminder) */
  shown?: number;
  /** ISO time of the first showing: the reminder counts 7 days from here */
  first_shown_at?: string;
  /** How many times "Maybe later" was pressed */
  dismissed?: number;
  /** ISO time of the first completed share */
  shared_at?: string;
  /** Every Share / Copy link / share-option press, on the card or on /my-moon-card */
  clicks?: number;
  last_click_at?: string;
}

export function parseShareNudge(raw: unknown): ShareNudgeState {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined);
  const str = (v: unknown) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : undefined);
  return {
    shown: num(r.shown),
    first_shown_at: str(r.first_shown_at),
    dismissed: num(r.dismissed),
    shared_at: str(r.shared_at),
    clicks: num(r.clicks),
    last_click_at: str(r.last_click_at),
  };
}

export function isNewMember(createdAt: string | undefined | null, now: Date = new Date()): boolean {
  const created = Date.parse(createdAt ?? "");
  if (Number.isNaN(created)) return false;
  return now.getTime() - created <= NEW_MEMBER_DAYS * DAY_MS;
}

/** Whether the card should appear now (the caller has already checked the name prompt is out of the way). */
export function shouldShowShareNudge(state: ShareNudgeState, createdAt: string | undefined | null, now: Date = new Date()): boolean {
  if (state.shared_at) return false;
  if ((state.dismissed ?? 0) >= 2) return false;
  const shown = state.shown ?? 0;
  if (shown === 0) return isNewMember(createdAt, now);
  if (shown === 1 && state.first_shown_at) {
    return now.getTime() - Date.parse(state.first_shown_at) >= REMINDER_AFTER_DAYS * DAY_MS;
  }
  return false;
}

async function save(next: ShareNudgeState): Promise<ShareNudgeState> {
  try {
    await supabase.auth.updateUser({ data: { share_nudge: next } });
  } catch {
    /* best effort: the nudge simply may repeat once */
  }
  return next;
}

async function current(): Promise<ShareNudgeState> {
  const { data } = await supabase.auth.getSession();
  return parseShareNudge(data.session?.user?.user_metadata?.share_nudge);
}

export async function recordNudgeShown(state: ShareNudgeState, now: Date = new Date()): Promise<ShareNudgeState> {
  const next = { ...state, shown: (state.shown ?? 0) + 1, first_shown_at: state.first_shown_at ?? now.toISOString() };
  trackEvent("share_nudge_shown", { count: next.shown });
  return save(next);
}

export async function recordNudgeDismissed(state: ShareNudgeState): Promise<ShareNudgeState> {
  const next = { ...state, dismissed: (state.dismissed ?? 0) + 1 };
  trackEvent("share_nudge_dismissed", { count: next.dismissed });
  return save(next);
}

export type ShareSurface = "nudge" | "my-moon-card";

/**
 * Counts a share press. `completed` is false when the person backed out of the share sheet: it still counts as a
 * click but does not count as having shared (so the reminder can still come).
 */
export async function recordShareClick(
  surface: ShareSurface,
  method: string,
  completed: boolean,
  now: Date = new Date()
): Promise<ShareNudgeState> {
  trackEvent("share_moon_click", { surface, method, completed });
  const state = await current();
  const next: ShareNudgeState = {
    ...state,
    clicks: (state.clicks ?? 0) + 1,
    last_click_at: now.toISOString(),
    shared_at: state.shared_at ?? (completed ? now.toISOString() : undefined),
  };
  return save(next);
}
