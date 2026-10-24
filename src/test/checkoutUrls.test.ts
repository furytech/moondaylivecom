import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { checkoutUrls } from "../../supabase/functions/_shared/checkoutUrls";

describe("create-checkout return URLs", () => {
  it("cancel returns to /pricing and success to /welcome-sovereign on the canonical host", () => {
    expect(checkoutUrls(undefined)).toEqual({
      success_url: "https://moondaylive.com/welcome-sovereign",
      cancel_url: "https://moondaylive.com/pricing?canceled=true",
    });
  });

  it("returns to the host the member started from, so the signed-in session is there", () => {
    expect(checkoutUrls("https://www.moondaylive.com").cancel_url).toBe("https://www.moondaylive.com/pricing?canceled=true");
    expect(checkoutUrls("https://moondaylive.com").cancel_url).toBe("https://moondaylive.com/pricing?canceled=true");
  });

  it("never redirects to a host outside the allowlist", () => {
    for (const bad of ["https://evil.example", "http://moondaylive.com", "https://moondaylive.com.evil.example", "https://moondaylive.com/x", "", 5, null]) {
      expect(checkoutUrls(bad).cancel_url).toBe("https://moondaylive.com/pricing?canceled=true");
    }
  });

  it("create-checkout uses it, and the app sends its own origin", () => {
    expect(readFileSync("supabase/functions/create-checkout/index.ts", "utf8")).toContain("checkoutUrls(returnOrigin)");
    for (const f of ["src/pages/Pricing.tsx", "src/pages/Blueprint.tsx"]) {
      expect(readFileSync(f, "utf8")).toContain("returnOrigin: window.location.origin");
    }
  });
});
