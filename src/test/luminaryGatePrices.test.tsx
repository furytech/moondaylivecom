import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { render, screen, fireEvent } from "@testing-library/react";
import LuminaryGate from "../components/LuminaryGate";
import { MONTHLY_PRICE_ID, YEARLY_PRICE_ID } from "../lib/prices";

describe("Luminary price IDs", () => {
  it("are the live IDs Pricing and PricingModal already send", () => {
    expect(YEARLY_PRICE_ID).toBe("price_1ULN4MJowQfvwg0ZjOGNtzgY");
    expect(MONTHLY_PRICE_ID).toBe("price_1ULN2GJowQfvwg0ZtYxb5Th5");
    const pricing = readFileSync("src/pages/Pricing.tsx", "utf8");
    const modal = readFileSync("src/components/PricingModal.tsx", "utf8");
    for (const id of [YEARLY_PRICE_ID, MONTHLY_PRICE_ID]) {
      expect(pricing).toContain(id);
      expect(modal).toContain(id);
    }
  });

  it("let the upgrade card start yearly checkout instead of throwing (no router)", () => {
    const onSelectPlan = vi.fn();
    render(<LuminaryGate currentMoonSign="Gemini" birthMoonSign="Cancer" onSelectPlan={onSelectPlan} />);
    fireEvent.click(screen.getByText("or $58.88/year · cancel anytime"));
    expect(onSelectPlan).toHaveBeenCalledWith(YEARLY_PRICE_ID);
  });
});
