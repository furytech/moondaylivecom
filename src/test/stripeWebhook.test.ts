import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  processStripeEvent,
  type ClaimResult,
  type StripeEventLike,
  type WebhookDeps,
} from "../../supabase/functions/_shared/stripeWebhookCore";

type Sub = { id: string; status: string; created?: number };

const makeDeps = (opts: {
  claim?: ClaimResult;
  email?: string | null;
  live?: Sub[];
  userId?: string | null;
  updateError?: string;
} = {}) => {
  const deps = {
    claimEvent: vi.fn(async () => opts.claim ?? "claimed"),
    releaseEvent: vi.fn(async () => {}),
    getCustomerEmail: vi.fn(async () => (opts.email === undefined ? "member@example.com" : opts.email)),
    listSubscriptions: vi.fn(async () => opts.live ?? []),
    findUserIdByEmail: vi.fn(async () => (opts.userId === undefined ? "user-1" : opts.userId)),
    updateProfileByUserId: vi.fn(async () => ({ error: opts.updateError })),
    updateProfileByEmail: vi.fn(async () => ({ error: opts.updateError })),
    log: vi.fn(),
  };
  return deps satisfies WebhookDeps;
};

const subEvent = (type: string, id: string, status: string, extra: Record<string, unknown> = {}, eventId = "evt_1"): StripeEventLike => ({
  id: eventId,
  type,
  data: { object: { id, status, customer: "cus_1", created: 100, ...extra } },
});

const checkoutEvent = (data: Record<string, unknown>): StripeEventLike => ({
  id: "evt_co",
  type: "checkout.session.completed",
  data: { object: data },
});

const PAID = { is_subscriber: true, subscription_status: "sovereign" };
const FREE = { is_subscriber: false, subscription_status: "free" };

describe("stripe-webhook: checkout.session.completed", () => {
  it("grants the 'sovereign' value to the profile matching the checkout email", async () => {
    const deps = makeDeps();
    const res = await processStripeEvent(checkoutEvent({ customer_details: { email: "a@b.com" } }), deps);
    expect(res.status).toBe(200);
    expect(deps.findUserIdByEmail).toHaveBeenCalledWith("a@b.com");
    expect(deps.updateProfileByUserId).toHaveBeenCalledWith("user-1", PAID);
  });

  it("falls back to customer_email", async () => {
    const deps = makeDeps();
    await processStripeEvent(checkoutEvent({ customer_email: "c@d.com" }), deps);
    expect(deps.findUserIdByEmail).toHaveBeenCalledWith("c@d.com");
  });

  it("returns 400 without an email, and releases the claim", async () => {
    const deps = makeDeps();
    const res = await processStripeEvent(checkoutEvent({}), deps);
    expect(res.status).toBe(400);
    expect(deps.updateProfileByUserId).not.toHaveBeenCalled();
    expect(deps.releaseEvent).toHaveBeenCalledWith("evt_co");
  });

  it("does nothing when no profile matches the email", async () => {
    const deps = makeDeps({ userId: null });
    const res = await processStripeEvent(checkoutEvent({ customer_email: "x@y.com" }), deps);
    expect(res.status).toBe(200);
    expect(deps.updateProfileByUserId).not.toHaveBeenCalled();
  });

  it("throws and releases the claim when the update fails, so Stripe retries", async () => {
    const deps = makeDeps({ updateError: "boom" });
    await expect(processStripeEvent(checkoutEvent({ customer_email: "x@y.com" }), deps)).rejects.toThrow(/boom/);
    expect(deps.releaseEvent).toHaveBeenCalledWith("evt_co");
  });
});

describe("stripe-webhook: subscription status rules", () => {
  it.each(["active", "trialing", "past_due"])("%s grants access", async (status) => {
    const deps = makeDeps({ live: [{ id: "sub_1", status }] });
    const res = await processStripeEvent(subEvent("customer.subscription.updated", "sub_1", status), deps);
    expect(res.status).toBe(200);
    expect(deps.updateProfileByEmail).toHaveBeenCalledWith("member@example.com", PAID);
  });

  it.each(["unpaid", "canceled", "incomplete_expired"])("%s revokes access", async (status) => {
    const deps = makeDeps({ live: [{ id: "sub_1", status }] });
    await processStripeEvent(subEvent("customer.subscription.updated", "sub_1", status), deps);
    expect(deps.updateProfileByEmail).toHaveBeenCalledWith("member@example.com", FREE);
  });

  it.each(["incomplete", "paused"])("%s leaves the profile untouched", async (status) => {
    const deps = makeDeps({ live: [{ id: "sub_1", status }] });
    const res = await processStripeEvent(subEvent("customer.subscription.created", "sub_1", status), deps);
    expect(res.status).toBe(200);
    expect(deps.updateProfileByEmail).not.toHaveBeenCalled();
  });

  it("the trialing grant is no longer undone (matches check-subscription)", async () => {
    const deps = makeDeps({ live: [{ id: "sub_1", status: "trialing" }] });
    await processStripeEvent(subEvent("customer.subscription.created", "sub_1", "trialing"), deps);
    expect(deps.updateProfileByEmail).toHaveBeenCalledWith("member@example.com", PAID);
    expect(deps.updateProfileByEmail).not.toHaveBeenCalledWith(expect.anything(), FREE);
  });

  it("a deleted event revokes even if the payload still says active", async () => {
    const deps = makeDeps({ live: [{ id: "sub_1", status: "canceled" }] });
    await processStripeEvent(subEvent("customer.subscription.deleted", "sub_1", "active"), deps);
    expect(deps.updateProfileByEmail).toHaveBeenCalledWith("member@example.com", FREE);
  });

  it("returns 200 without changes when the customer is deleted or has no email", async () => {
    const deps = makeDeps({ email: null });
    const res = await processStripeEvent(subEvent("customer.subscription.updated", "sub_1", "active"), deps);
    expect(res.status).toBe(200);
    expect(deps.listSubscriptions).not.toHaveBeenCalled();
    expect(deps.updateProfileByEmail).not.toHaveBeenCalled();
  });

  it("returns 500 and releases the claim when the profile sync fails, so Stripe retries", async () => {
    const deps = makeDeps({ live: [{ id: "sub_1", status: "active" }], updateError: "db down" });
    const res = await processStripeEvent(subEvent("customer.subscription.updated", "sub_1", "active"), deps);
    expect(res.status).toBe(500);
    expect(deps.releaseEvent).toHaveBeenCalledWith("evt_1");
  });

  it("ignores event types it does not handle", async () => {
    const deps = makeDeps();
    const res = await processStripeEvent({ id: "evt_x", type: "invoice.paid", data: { object: {} } }, deps);
    expect(res).toEqual({ status: 200, body: { received: true } });
    expect(deps.updateProfileByEmail).not.toHaveBeenCalled();
  });
});

describe("stripe-webhook: ordering guard", () => {
  it("a late deleted event for an OLD subscription cannot revoke a NEWER active one", async () => {
    const deps = makeDeps({
      live: [
        { id: "sub_old", status: "canceled", created: 100 },
        { id: "sub_new", status: "active", created: 200 },
      ],
    });
    const res = await processStripeEvent(subEvent("customer.subscription.deleted", "sub_old", "canceled"), deps);
    expect(res.status).toBe(200);
    expect(deps.updateProfileByEmail).toHaveBeenCalledWith("member@example.com", PAID);
    expect(deps.updateProfileByEmail).not.toHaveBeenCalledWith(expect.anything(), FREE);
  });

  it("revokes when the deleted subscription was the only one", async () => {
    const deps = makeDeps({ live: [{ id: "sub_1", status: "canceled" }] });
    await processStripeEvent(subEvent("customer.subscription.deleted", "sub_1", "canceled"), deps);
    expect(deps.updateProfileByEmail).toHaveBeenCalledWith("member@example.com", FREE);
  });

  it("revokes when the deleted subscription is not yet visible in the live list", async () => {
    const deps = makeDeps({ live: [] });
    await processStripeEvent(subEvent("customer.subscription.deleted", "sub_1", "canceled"), deps);
    expect(deps.updateProfileByEmail).toHaveBeenCalledWith("member@example.com", FREE);
  });

  it("a late 'active' update for a subscription that is already canceled cannot grant access back", async () => {
    const deps = makeDeps({ live: [{ id: "sub_1", status: "canceled" }] });
    await processStripeEvent(subEvent("customer.subscription.updated", "sub_1", "active"), deps);
    expect(deps.updateProfileByEmail).toHaveBeenCalledWith("member@example.com", FREE);
  });
});

describe("stripe-webhook: event-ID dedupe", () => {
  let deps: ReturnType<typeof makeDeps>;
  beforeEach(() => {
    deps = makeDeps({ claim: "duplicate", live: [{ id: "sub_1", status: "active" }] });
  });

  it("acknowledges a repeated event id without touching Stripe or the profile", async () => {
    const res = await processStripeEvent(subEvent("customer.subscription.updated", "sub_1", "active"), deps);
    expect(res).toEqual({ status: 200, body: { received: true, duplicate: true } });
    expect(deps.getCustomerEmail).not.toHaveBeenCalled();
    expect(deps.updateProfileByEmail).not.toHaveBeenCalled();
    expect(deps.updateProfileByUserId).not.toHaveBeenCalled();
    expect(deps.releaseEvent).not.toHaveBeenCalled();
  });

  it("claims by the Stripe event id and type", async () => {
    const fresh = makeDeps({ live: [{ id: "sub_1", status: "active" }] });
    await processStripeEvent(subEvent("customer.subscription.updated", "sub_1", "active", {}, "evt_abc"), fresh);
    expect(fresh.claimEvent).toHaveBeenCalledWith("evt_abc", "customer.subscription.updated");
  });

  it("processes the event anyway when the dedupe table is unavailable, and does not release a claim it never made", async () => {
    const noTable = makeDeps({ claim: "unavailable", live: [{ id: "sub_1", status: "active" }] });
    const res = await processStripeEvent(subEvent("customer.subscription.updated", "sub_1", "active"), noTable);
    expect(res.status).toBe(200);
    expect(noTable.updateProfileByEmail).toHaveBeenCalledWith("member@example.com", PAID);
    expect(noTable.releaseEvent).not.toHaveBeenCalled();
  });

  it("keeps the claim after a successful run", async () => {
    const fresh = makeDeps({ live: [{ id: "sub_1", status: "active" }] });
    await processStripeEvent(subEvent("customer.subscription.updated", "sub_1", "active"), fresh);
    expect(fresh.releaseEvent).not.toHaveBeenCalled();
  });
});
