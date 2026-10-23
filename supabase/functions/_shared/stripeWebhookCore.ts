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
  data: { object: Record<string, any> };
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
  log(step: string, details?: unknown): void;
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
    return ok();
  }

  return ok();
}
