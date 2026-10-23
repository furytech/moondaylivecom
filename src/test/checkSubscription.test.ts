import { describe, expect, it, vi } from "vitest";
import {
  checkSubscription,
  type CheckDeps,
  type StripeSubscriptionForCheck,
} from "../../supabase/functions/_shared/checkSubscriptionCore";

const makeDeps = (subs: StripeSubscriptionForCheck[] | null, updateError?: string) => {
  const deps = {
    findCustomerId: vi.fn(async () => (subs === null ? null : "cus_1")),
    listSubscriptions: vi.fn(async () => subs ?? []),
    updateProfileByEmail: vi.fn(async () => ({ error: updateError })),
    log: vi.fn(),
  };
  return deps satisfies CheckDeps;
};

const withPrice = (id: string, status: string, extra: Partial<StripeSubscriptionForCheck> = {}): StripeSubscriptionForCheck => ({
  id,
  status,
  created: 100,
  current_period_end: 1_800_000_000,
  start_date: 1_700_000_000,
  items: { data: [{ price: { id: "price_year", product: "prod_1" } }] },
  ...extra,
});

const PAID = { is_subscriber: true, subscription_status: "sovereign" };
const FREE = { is_subscriber: false, subscription_status: "free" };

describe("check-subscription", () => {
  it.each(["active", "trialing", "past_due"])("%s is subscribed and writes the 'sovereign' value", async (status) => {
    const deps = makeDeps([withPrice("sub_1", status)]);
    const res = await checkSubscription("m@x.com", deps);
    expect(res.subscribed).toBe(true);
    expect(deps.updateProfileByEmail).toHaveBeenCalledWith("m@x.com", PAID);
  });

  it("no longer treats trialing as free (it used to undo the webhook's grant)", async () => {
    const deps = makeDeps([withPrice("sub_1", "trialing")]);
    expect((await checkSubscription("m@x.com", deps)).subscribed).toBe(true);
    expect(deps.updateProfileByEmail).not.toHaveBeenCalledWith("m@x.com", FREE);
  });

  it.each(["unpaid", "canceled", "incomplete_expired"])("%s is not subscribed and writes free", async (status) => {
    const deps = makeDeps([withPrice("sub_1", status)]);
    const res = await checkSubscription("m@x.com", deps);
    expect(res).toEqual({ subscribed: false });
    expect(deps.updateProfileByEmail).toHaveBeenCalledWith("m@x.com", FREE);
  });

  it.each(["incomplete", "paused"])("%s is not subscribed but leaves the profile alone", async (status) => {
    const deps = makeDeps([withPrice("sub_1", status)]);
    expect((await checkSubscription("m@x.com", deps)).subscribed).toBe(false);
    expect(deps.updateProfileByEmail).not.toHaveBeenCalled();
  });

  it("no Stripe customer: not subscribed, profile set to free, no subscription lookup", async () => {
    const deps = makeDeps(null);
    const res = await checkSubscription("m@x.com", deps);
    expect(res).toEqual({ subscribed: false });
    expect(deps.listSubscriptions).not.toHaveBeenCalled();
    expect(deps.updateProfileByEmail).toHaveBeenCalledWith("m@x.com", FREE);
  });

  it("customer with no subscriptions: not subscribed, profile set to free", async () => {
    const deps = makeDeps([]);
    expect((await checkSubscription("m@x.com", deps)).subscribed).toBe(false);
    expect(deps.updateProfileByEmail).toHaveBeenCalledWith("m@x.com", FREE);
  });

  it("a newer active subscription keeps access even when an older one is canceled", async () => {
    const deps = makeDeps([withPrice("old", "canceled", { created: 1 }), withPrice("new", "active", { created: 2 })]);
    expect((await checkSubscription("m@x.com", deps)).subscribed).toBe(true);
    expect(deps.updateProfileByEmail).toHaveBeenCalledWith("m@x.com", PAID);
  });

  it("reports price, product and period dates from the primary subscription", async () => {
    const deps = makeDeps([withPrice("sub_1", "active")]);
    const res = await checkSubscription("m@x.com", deps);
    expect(res).toEqual({
      subscribed: true,
      product_id: "prod_1",
      price_id: "price_year",
      subscription_end: new Date(1_800_000_000 * 1000).toISOString(),
      subscription_start: new Date(1_700_000_000 * 1000).toISOString(),
    });
  });

  it("prefers the active subscription's details over a past_due one", async () => {
    const pastDue = withPrice("pd", "past_due", { items: { data: [{ price: { id: "price_pd", product: "p" } }] } });
    const active = withPrice("ok", "active", { items: { data: [{ price: { id: "price_ok", product: "p" } }] } });
    expect((await checkSubscription("m@x.com", makeDeps([pastDue, active]))).price_id).toBe("price_ok");
  });

  it("still answers when the profile sync fails", async () => {
    const deps = makeDeps([withPrice("sub_1", "active")], "db down");
    expect((await checkSubscription("m@x.com", deps)).subscribed).toBe(true);
    expect(deps.log).toHaveBeenCalledWith("WARNING: Failed to sync profile", { error: "db down" });
  });
});
