// Where Stripe sends the member after checkout. The return trip must land on the SAME origin the member
// started from: a session lives in that origin's storage, so a different host (apex vs www) shows them as
// signed out. Only exact, known hosts are accepted; anything else gets the canonical host.

export const CANONICAL_ORIGIN = "https://moondaylive.com";
const ALLOWED_ORIGINS: ReadonlySet<string> = new Set([CANONICAL_ORIGIN, "https://www.moondaylive.com"]);

export function checkoutUrls(requestedOrigin: unknown): { success_url: string; cancel_url: string } {
  const origin = typeof requestedOrigin === "string" && ALLOWED_ORIGINS.has(requestedOrigin) ? requestedOrigin : CANONICAL_ORIGIN;
  return {
    success_url: `${origin}/welcome-sovereign`,
    cancel_url: `${origin}/pricing?canceled=true`,
  };
}
