import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

const invoke = vi.fn();
const auth = {
  user: { id: "u1", email: "m@x.com" },
  session: { access_token: "tok" },
  subscription: { subscribed: false, priceId: null, subscriptionEnd: null },
  checkSubscription: vi.fn(),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invoke(...args) },
    auth: { getSession: async () => ({ data: { session: { access_token: "tok" } } }) },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { moon_sign: "Cancer" } }) }) }),
    }),
  },
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/components/Navigation", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/lib/currentMoon", () => ({ getCurrentMoon: () => ({ sign: "Leo", phase: "Full Moon" }) }));

import Pricing from "../pages/Pricing";

const renderPricing = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Pricing />
      </MemoryRouter>
    </HelmetProvider>,
  );

describe("Pricing: same-tab redirects and teaser function name", () => {
  const originalLocation = window.location;
  const openSpy = vi.fn();

  beforeEach(() => {
    invoke.mockReset();
    openSpy.mockReset();
    vi.stubGlobal("open", openSpy);
    // jsdom's location is read-only; swap in a plain object so assignments to href can be observed.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, href: "https://moondaylive.com/pricing" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
    vi.unstubAllGlobals();
  });

  it("sends the checkout URL to window.location.href and never opens a new tab", async () => {
    invoke.mockImplementation(async (fn: string) =>
      fn === "create-checkout" ? { data: { url: "https://checkout.stripe.com/c/pay/cs_test_1" }, error: null } : { data: null, error: null },
    );
    renderPricing();
    fireEvent.click(screen.getByRole("button", { name: /Unlock Luminary/i }));
    await waitFor(() => expect(window.location.href).toBe("https://checkout.stripe.com/c/pay/cs_test_1"));
    expect(openSpy).not.toHaveBeenCalled();
    expect(invoke).toHaveBeenCalledWith("create-checkout", expect.objectContaining({ body: { priceId: "price_1ULN4MJowQfvwg0ZjOGNtzgY", returnOrigin: window.location.origin } }));
  });

  it("asks the deployed sovereign-teaser function for the teaser", async () => {
    invoke.mockResolvedValue({ data: { teaser: "A glimpse." }, error: null });
    renderPricing();
    await waitFor(() => expect(invoke).toHaveBeenCalledWith("sovereign-teaser", expect.anything()));
    expect(invoke).not.toHaveBeenCalledWith("Luminary-teaser", expect.anything());
  });

  it("sends the customer portal URL to window.location.href for members", async () => {
    auth.subscription = { subscribed: true, priceId: null, subscriptionEnd: null };
    invoke.mockResolvedValue({ data: { url: "https://billing.stripe.com/p/session/test_1" }, error: null });
    try {
      renderPricing();
      fireEvent.click(screen.getByRole("button", { name: /Manage or cancel membership/i }));
      await waitFor(() => expect(window.location.href).toBe("https://billing.stripe.com/p/session/test_1"));
      expect(openSpy).not.toHaveBeenCalled();
    } finally {
      auth.subscription = { subscribed: false, priceId: null, subscriptionEnd: null };
    }
  });
});

describe("checkout and portal never open a new tab", () => {
  it.each(["src/pages/Pricing.tsx", "src/pages/Blueprint.tsx", "src/pages/Account.tsx", "src/components/PricingModal.tsx"])(
    "%s has no window.open",
    (file) => {
      expect(readFileSync(file, "utf8")).not.toMatch(/window\.open\(/);
    },
  );
});

describe("create-checkout source", () => {
  const src = readFileSync("supabase/functions/create-checkout/index.ts", "utf8");

  it("answers a missing Authorization header with 401 before anything can throw a 500", () => {
    const missing = src.indexOf("if (!token)");
    const respond401 = src.indexOf("status: 401", missing);
    const firstThrow = src.indexOf("throw new Error");
    expect(missing).toBeGreaterThan(-1);
    expect(respond401).toBeGreaterThan(missing);
    expect(respond401).toBeLessThan(firstThrow);
    expect(src).not.toContain('get("Authorization")!');
  });

  it("keeps the two live price IDs as the only allowed prices", () => {
    expect(src).toContain("price_1ULN2GJowQfvwg0ZtYxb5Th5");
    expect(src).toContain("price_1ULN4MJowQfvwg0ZjOGNtzgY");
  });
});

describe("Pricing: billing terms line", () => {
  it("states price, auto-renewal, one-click cancel and links Terms and Refund Policy", () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <Pricing />
        </MemoryRouter>
      </HelmetProvider>,
    );
    const line = screen.getByTestId("billing-terms");
    expect(line.textContent).toContain("$58.88 per year");
    expect(line.textContent).toContain("renews automatically");
    expect(line.textContent).toContain("cancel in one click from your Account page");
    expect(line.querySelector('a[href="/terms"]')).toBeTruthy();
    expect(line.querySelector('a[href="/refund"]')).toBeTruthy();
    expect(line.className).toContain("text-left");
  });
});
