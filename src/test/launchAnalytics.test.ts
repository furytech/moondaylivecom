import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { PURCHASE_FRESH_MS, trackBeginCheckout, trackPurchaseOnce } from "../lib/analytics";
import { MONTHLY_PRICE_ID, YEARLY_PRICE_ID } from "../lib/prices";
import { formatMembershipEnd } from "../lib/membershipEnd";

const gtag = vi.fn();
const NOW = Date.parse("2026-10-26T15:00:00Z");
const START = "2026-10-26T14:55:00Z";

beforeEach(() => {
  gtag.mockReset();
  (window as any).gtag = gtag;
  localStorage.clear();
});

describe("GA4 begin_checkout", () => {
  it("monthly: value 6.88, plan monthly, USD", () => {
    trackBeginCheckout(MONTHLY_PRICE_ID);
    expect(gtag).toHaveBeenCalledWith("event", "begin_checkout", expect.objectContaining({ currency: "USD", value: 6.88, plan: "monthly" }));
  });
  it("yearly: value 58.88, plan yearly", () => {
    trackBeginCheckout(YEARLY_PRICE_ID);
    expect(gtag).toHaveBeenCalledWith("event", "begin_checkout", expect.objectContaining({ value: 58.88, plan: "yearly" }));
  });
  it("ignores a price it does not know", () => {
    trackBeginCheckout("price_other");
    expect(gtag).not.toHaveBeenCalled();
  });
  it("fires from the Pricing page's Unlock Luminary and the upgrade modal", () => {
    expect(readFileSync("src/pages/Pricing.tsx", "utf8")).toContain("trackBeginCheckout(priceId)");
    expect(readFileSync("src/components/PricingModal.tsx", "utf8")).toContain("trackBeginCheckout(priceId)");
  });
});

describe("GA4 purchase on /welcome-sovereign", () => {
  it("fires with the real value, currency USD and the plan", () => {
    expect(trackPurchaseOnce("u1", START, YEARLY_PRICE_ID, NOW)).toBe(true);
    expect(gtag).toHaveBeenCalledWith("event", "purchase", expect.objectContaining({
      currency: "USD", value: 58.88, plan: "yearly", transaction_id: `u1-${Date.parse(START)}`,
    }));
    gtag.mockReset();
    trackPurchaseOnce("u2", START, MONTHLY_PRICE_ID, NOW);
    expect(gtag).toHaveBeenCalledWith("event", "purchase", expect.objectContaining({ value: 6.88, plan: "monthly" }));
  });

  it("a refresh or second visit does not count it again", () => {
    expect(trackPurchaseOnce("u1", START, YEARLY_PRICE_ID, NOW)).toBe(true);
    expect(trackPurchaseOnce("u1", START, YEARLY_PRICE_ID, NOW + 5000)).toBe(false);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it("a different subscription is a different purchase", () => {
    trackPurchaseOnce("u1", START, YEARLY_PRICE_ID, NOW);
    expect(trackPurchaseOnce("u1", "2026-10-26T14:59:00Z", YEARLY_PRICE_ID, NOW)).toBe(true);
  });

  it("does not fire for an old subscription, an unknown price or missing data", () => {
    expect(trackPurchaseOnce("u1", START, YEARLY_PRICE_ID, Date.parse(START) + PURCHASE_FRESH_MS + 1)).toBe(false);
    expect(trackPurchaseOnce("u1", START, "price_other", NOW)).toBe(false);
    expect(trackPurchaseOnce("u1", null, YEARLY_PRICE_ID, NOW)).toBe(false);
    expect(trackPurchaseOnce(undefined, START, YEARLY_PRICE_ID, NOW)).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });
});

describe("GA4 sign_up and wiring", () => {
  it("sign_up still fires after a new signup", () => {
    expect(readFileSync("src/contexts/AuthContext.tsx", "utf8")).toContain('trackEvent("sign_up", { method: "email" })');
  });
  it("the success page uses the once-only purchase helper", () => {
    const src = readFileSync("src/pages/SubscriptionSuccess.tsx", "utf8");
    expect(src).toContain("trackPurchaseOnce");
    expect(src).not.toContain("19.88");
  });
});

describe("Account: membership end notice", () => {
  it("formats the end date", () => {
    expect(formatMembershipEnd("2026-11-24T12:00:00Z")).toBe("November 24, 2026");
  });
  it("shows the notice text and the Resume membership button when set to cancel", () => {
    const src = readFileSync("src/pages/Account.tsx", "utf8");
    expect(src).toContain("subscription.cancelAtPeriodEnd");
    expect(src).toContain("You keep full access until then.");
    expect(src).toContain('<ManageMembershipButton label="Resume membership" />');
  });
});
