// Luminary Stripe price IDs used by the Blueprint upgrade card. These are the same live IDs Pricing.tsx and
// PricingModal.tsx send; create-checkout rejects any other ID. Do not change them without changing Stripe.
export const MONTHLY_PRICE_ID = "price_1ULN2GJowQfvwg0ZtYxb5Th5";
export const YEARLY_PRICE_ID = "price_1ULN4MJowQfvwg0ZjOGNtzgY";

export type LuminaryPlan = "monthly" | "yearly";

/** What each live price is worth, for analytics and for the billing line on Pricing. */
export const PLAN_BY_PRICE_ID: Record<string, { plan: LuminaryPlan; value: number }> = {
  [MONTHLY_PRICE_ID]: { plan: "monthly", value: 6.88 },
  [YEARLY_PRICE_ID]: { plan: "yearly", value: 58.88 },
};
