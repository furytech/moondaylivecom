// The body of stripe-webhook, with its Stripe and database calls passed in so it can be
// unit-tested with mocked events. index.ts wires the real clients to these dependencies.
import {
  decideAccess,
  mergeSubscriptions,
  profileUpdateFor,
  type SubscriptionLike,
} from "./subscriptionAccess.ts";

export interface StripeEventLike {
  id: string;
  type: string;
  data: { object: Record<string, any>; previous_attributes?: Record<string, any> };
}

export type ClaimResult = "claimed" | "duplicate" | "unavailable";

export interface WebhookDeps {
  /** Record the event id. "duplicate" when it was already recorded. "unavailable" when the
   *  dedupe table cannot be used (not created yet); the event is then processed anyway. */
  claimEvent(eventId: string, eventType: string): Promise<ClaimResult>;
  /** Forget a claimed event so Stripe's retry is processed after a failure. */
  releaseEvent(eventId: string): Promise<void>;
  getCustomerEmail(customerId: string): Promise<string | null>;
  /** Every subscription of the customer, in any status. */
  listSubscriptions(customerId: string): Promise<SubscriptionLike[]>;
  findUserIdByEmail(email: string): Promise<string | null>;
  updateProfileByUserId(userId: string, update: Record<string, unknown>): Promise<{ error?: string }>;
  updateProfileByEmail(email: string, update: Record<string, unknown>): Promise<{ error?: string }>;
  /** Email the member that their cancellation is confirmed. Throws when it could not be sent (logged, not retried). */
  sendCancellationEmail?(to: string, endsAt: Date): Promise<void>;
  log(step: string, details?: unknown): void;
}

/** True when this "updated" event is the moment the subscription was set to end at period end: the flag is on now
 *  and the event shows it was off before. Renewals, payment failures and later edits to an already-cancelling
 *  subscription do not match. */
export function justSetToCancel(subscription: Record<string, any>, previous: Record<string, any> | undefined): boolean {
  if (!previous || subscription.status === "canceled") return false;
  const nowCancelling = subscription.cancel_at_period_end === true || typeof subscription.cancel_at === "number";
  if (!nowCancelling) return false;
  const wasCancelling = "cancel_at_period_end" in previous || "cancel_at" in previous
    ? previous.cancel_at_period_end === true || typeof previous.cancel_at === "number"
    : true;
  return !wasCancelling;
}

/** The day access stops: the scheduled cancel time, else the end of the current paid period. */
export function accessEndsAt(subscription: Record<string, any>): Date | null {
  const seconds = (typeof subscription.cancel_at === "number" ? subscription.cancel_at : null)
    ?? subscription.current_period_end
    ?? subscription.items?.data?.[0]?.current_period_end;
  return typeof seconds === "number" ? new Date(seconds * 1000) : null;
}

export interface WebhookResult {
  status: number;
  body: Record<string, unknown>;
}

const ok = (extra: Record<string, unknown> = {}): WebhookResult => ({ status: 200, body: { received: true, ...extra } });

export async function processStripeEvent(event: StripeEventLike, deps: WebhookDeps): Promise<WebhookResult> {
  const { log } = deps;

  const claim = await deps.claimEvent(event.id, event.type);
  if (claim === "duplicate") {
    log("Duplicate event ignored", { id: event.id, type: event.type });
    return ok({ duplicate: true });
  }
  if (claim === "unavailable") log("WARNING: event dedupe unavailable, processing anyway", { id: event.id });

  try {
    const result = await handle(event, deps);
    // A 4xx/5xx result means the event was not applied; let Stripe's retry through.
    if (result.status >= 400 && claim === "claimed") await deps.releaseEvent(event.id);
    return result;
  } catch (err) {
    if (claim === "claimed") await deps.releaseEvent(event.id);
    throw err;
  }
}

async function handle(event: StripeEventLike, deps: WebhookDeps): Promise<WebhookResult> {
  const { log } = deps;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const customerEmail: string | undefined = session.customer_details?.email || session.customer_email;
    if (!customerEmail) {
      log("ERROR: No customer email in checkout session");
      return { status: 400, body: { error: "No customer email" } };
    }

    const userId = await deps.findUserIdByEmail(customerEmail);
    if (!userId) {
      log("WARNING: No user profile found for email", { email: customerEmail });
      return ok();
    }
    const update = profileUpdateFor("grant")!;
    const { error } = await deps.updateProfileByUserId(userId, update);
    if (error) {
      log("ERROR updating profile", { error });
      throw new Error(`Failed to update profile: ${error}`);
    }
    log("Subscription activated successfully", { userId });
    return ok();
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object;
    const customerId: string = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

    const email = await deps.getCustomerEmail(customerId);
    if (!email) {
      log("WARNING: Customer deleted or no email");
      return ok();
    }

    // A deleted event always describes a canceled subscription, whatever status the payload carries.
    const fromEvent: SubscriptionLike = {
      id: subscription.id,
      status: event.type === "customer.subscription.deleted" ? "canceled" : subscription.status,
      created: subscription.created,
    };

    // Decide from everything the customer has right now, not from this one event. That is the ordering
    // guard: a late "deleted" for an old subscription still sees the newer active one and keeps access,
    // and a late "updated: active" for an already-canceled one cannot grant access back.
    const live = await deps.listSubscriptions(customerId);
    const decision = decideAccess(mergeSubscriptions(live, fromEvent));
    const update = profileUpdateFor(decision);

    if (!update) {
      log("Transient subscription status - leaving access unchanged", { email, status: fromEvent.status });
      return ok();
    }

    const { error } = await deps.updateProfileByEmail(email, update);
    if (error) {
      log("ERROR syncing subscription", { error });
      // Report a failure so Stripe retries instead of silently leaving the profile stale.
      return { status: 500, body: { error: "Failed to sync subscription" } };
    }
    log("Subscription synced", { email, status: fromEvent.status, decision });

    // One confirmation email, only at the moment of cancelling. The event-ID claim above means a repeated
    // webhook never reaches this point twice.
    if (
      event.type === "customer.subscription.updated" &&
      deps.sendCancellationEmail &&
      justSetToCancel(subscription, (event.data as { previous_attributes?: Record<string, any> }).previous_attributes)
    ) {
      const endsAt = accessEndsAt(subscription);
      if (!endsAt) {
        log("WARNING: cancellation without an end date, email not sent", { id: subscription.id });
      } else {
        try {
          await deps.sendCancellationEmail(email, endsAt);
          log("Cancellation email sent", { id: subscription.id });
        } catch (err) {
          // The access change is already saved. Do not fail the webhook over an email: repeated 5xx replies
          // can get the whole endpoint disabled by Stripe, which would stop access updates for everyone.
          log("ERROR sending cancellation email (not retried)", { reason: err instanceof Error ? err.message : String(err) });
          return ok({ cancellation_email: "failed" });
        }
      }
    }
    return ok();
  }

  return ok();
}
