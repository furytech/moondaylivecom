// Lightweight GA4 wrapper. Safe no-op if gtag is unavailable.
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const GA_MEASUREMENT_ID = "G-1CW7EV6QKH";

export const trackEvent = (
  eventName: string,
  params: Record<string, any> = {}
) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
};

export const trackPageView = (path: string, title?: string) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.origin + path,
    page_title: title ?? document.title,
    send_to: GA_MEASUREMENT_ID,
  });
};

import { PLAN_BY_PRICE_ID, type LuminaryPlan } from "@/lib/prices";

const planItem = (plan: LuminaryPlan, value: number) => ({
  item_id: plan,
  item_name: `Luminary ${plan === "yearly" ? "Yearly" : "Monthly"}`,
  price: value,
  quantity: 1,
});

/** GA4 begin_checkout: the member clicked Unlock Luminary. Unknown prices are ignored. */
export const trackBeginCheckout = (priceId: string) => {
  const info = PLAN_BY_PRICE_ID[priceId];
  if (!info) return;
  trackEvent("begin_checkout", {
    currency: "USD",
    value: info.value,
    plan: info.plan,
    items: [planItem(info.plan, info.value)],
  });
};

const PURCHASE_KEY_PREFIX = "moonday:purchaseTracked:";
/** A purchase older than this is not a fresh checkout (someone revisiting the page). */
export const PURCHASE_FRESH_MS = 48 * 60 * 60 * 1000;

/** GA4 purchase, once per subscription: a refresh, a second tab or a later visit never counts it again.
 *  The transaction id is the member's id plus when the subscription started. Returns whether it fired. */
export const trackPurchaseOnce = (
  userId: string | undefined,
  subscriptionStart: string | null,
  priceId: string | null,
  now: number = Date.now(),
): boolean => {
  const info = priceId ? PLAN_BY_PRICE_ID[priceId] : undefined;
  const started = subscriptionStart ? Date.parse(subscriptionStart) : NaN;
  if (!userId || !info || Number.isNaN(started)) return false;
  if (now - started > PURCHASE_FRESH_MS) return false;

  const transactionId = `${userId}-${started}`;
  const key = PURCHASE_KEY_PREFIX + transactionId;
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, String(now));
  } catch {
    /* storage unavailable: still count it once for this page view */
  }
  trackEvent("purchase", {
    transaction_id: transactionId,
    currency: "USD",
    value: info.value,
    plan: info.plan,
    items: [planItem(info.plan, info.value)],
  });
  return true;
};
