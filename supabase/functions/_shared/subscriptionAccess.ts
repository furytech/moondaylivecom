// One set of rules for "does this Stripe customer have Luminary access?", shared by
// stripe-webhook and check-subscription so they can never disagree again.
// Pure TypeScript with no URL imports, so vitest can import it too.

/** The value stored in user_profiles.subscription_status for a paid member.
 *  The app, customer-portal and the triad_states policy all read 'sovereign'
 *  (the policy also accepts 'luminary' and is_subscriber = true). Never rename it. */
export const PAID_STATUS = "sovereign";
export const FREE_STATUS = "free";

/** Stripe subscription statuses that keep access. past_due stays in while Stripe retries the payment. */
export const GRANT_STATUSES: ReadonlySet<string> = new Set(["active", "trialing", "past_due"]);
/** Terminal or unpaid statuses that remove access. */
export const REVOKE_STATUSES: ReadonlySet<string> = new Set(["unpaid", "canceled", "incomplete_expired"]);
// Anything else (incomplete, paused) is neutral: it never grants, and on its own it never revokes.

export interface SubscriptionLike {
  id: string;
  status: string;
  created?: number;
}

export type AccessDecision = "grant" | "revoke" | "unchanged";

/** Decide access from every subscription the customer has, not from one event's payload.
 *  Any granting subscription wins, so a late "deleted" event for an old subscription
 *  cannot revoke a newer one that is still active. */
export function decideAccess(subscriptions: readonly SubscriptionLike[]): AccessDecision {
  if (subscriptions.some((s) => GRANT_STATUSES.has(s.status))) return "grant";
  if (subscriptions.length === 0) return "revoke";
  if (subscriptions.some((s) => REVOKE_STATUSES.has(s.status))) return "revoke";
  return "unchanged";
}

/** The columns written to user_profiles for a decision, or null when nothing should change. */
export function profileUpdateFor(decision: AccessDecision): { is_subscriber: boolean; subscription_status: string } | null {
  if (decision === "grant") return { is_subscriber: true, subscription_status: PAID_STATUS };
  if (decision === "revoke") return { is_subscriber: false, subscription_status: FREE_STATUS };
  return null;
}

const GRANT_RANK: Record<string, number> = { active: 0, trialing: 1, past_due: 2 };

/** The subscription to report on when granting: active first, then trialing, then past_due, newest first. */
export function pickPrimarySubscription<T extends SubscriptionLike>(subscriptions: readonly T[]): T | null {
  const granting = subscriptions.filter((s) => GRANT_STATUSES.has(s.status));
  if (granting.length === 0) return null;
  return [...granting].sort(
    (a, b) => (GRANT_RANK[a.status] - GRANT_RANK[b.status]) || ((b.created ?? 0) - (a.created ?? 0)),
  )[0];
}

/** Merge the event's own subscription into the customer's live list. The live copy wins on a
 *  matching id; a subscription missing from the list (not yet visible) is added from the event. */
export function mergeSubscriptions<T extends SubscriptionLike>(live: readonly T[], fromEvent: T): T[] {
  return live.some((s) => s.id === fromEvent.id) ? [...live] : [...live, fromEvent];
}

/** Token from "Bearer <token>", or null when the header is missing or empty. */
export function bearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token ? token : null;
}
