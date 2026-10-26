// The Stripe-to-profile logic of check-subscription, with Stripe and the database passed in
// so it can be unit-tested. It applies the same rules as stripe-webhook (see subscriptionAccess.ts).
import {
  decideAccess,
  pickPrimarySubscription,
  profileUpdateFor,
  type SubscriptionLike,
} from "./subscriptionAccess.ts";

export interface StripeSubscriptionForCheck extends SubscriptionLike {
  current_period_end?: number | null;
  start_date?: number | null;
  /** True when the member cancelled: access continues until the period ends. */
  cancel_at_period_end?: boolean | null;
  cancel_at?: number | null;
  // Newer Stripe API versions keep the billing period on the items, not on the subscription.
  items?: { data?: Array<{ current_period_end?: number | null; price?: { id?: string; product?: unknown } }> };
}

export interface CheckDeps {
  /** The Stripe customer id for this email, or null when there is none. */
  findCustomerId(email: string): Promise<string | null>;
  /** Every subscription of the customer, in any status. */
  listSubscriptions(customerId: string): Promise<StripeSubscriptionForCheck[]>;
  updateProfileByEmail(email: string, update: Record<string, unknown>): Promise<{ error?: string }>;
  log(step: string, details?: unknown): void;
}

export interface CheckResult {
  subscribed: boolean;
  product_id?: unknown;
  price_id?: string | null;
  subscription_end?: string | null;
  subscription_start?: string | null;
  /** True when the membership is set to end at the close of the paid period. */
  cancel_at_period_end?: boolean;
}

const iso = (seconds: unknown): string | null =>
  typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;

export async function checkSubscription(email: string, deps: CheckDeps): Promise<CheckResult> {
  const customerId = await deps.findCustomerId(email);
  const subscriptions = customerId ? await deps.listSubscriptions(customerId) : [];
  const decision = decideAccess(subscriptions);

  const update = profileUpdateFor(decision);
  if (update) {
    const { error } = await deps.updateProfileByEmail(email, update);
    if (error) deps.log("WARNING: Failed to sync profile", { error });
    else deps.log("Profile synced", { status: update.subscription_status });
  } else {
    deps.log("Transient subscription status - profile left unchanged");
  }

  if (decision !== "grant") return { subscribed: false };

  const primary = pickPrimarySubscription(subscriptions)!;
  const price = primary.items?.data?.[0]?.price;
  const cancelling = primary.cancel_at_period_end === true || typeof primary.cancel_at === "number";
  // When cancelling, the end date is the day access stops.
  const endSeconds =
    (cancelling ? primary.cancel_at : null) ?? primary.current_period_end ?? primary.items?.data?.[0]?.current_period_end;
  return {
    subscribed: true,
    product_id: price?.product ?? null,
    price_id: price?.id ?? null,
    subscription_end: iso(endSeconds),
    subscription_start: iso(primary.start_date),
    cancel_at_period_end: cancelling,
  };
}
