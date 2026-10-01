import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BlueprintIdentity from "../components/BlueprintIdentity";
import type { CombinationProfile } from "../types";

describe("BlueprintIdentity Component (Layer 1)", () => {
  const mockProfile: CombinationProfile = {
    sun_sign: "Cancer",
    moon_sign: "Cancer",
    combination_title: "Cancer Sun • Cancer Moon — The Ocean Sovereign",
    luminous_expression: [
      "Perceptive",
      "Nurturing",
      "Visionary",
      "Loyal",
      "Integrative",
    ],
    combination_synthesis:
      "Your conscious life force and instinctual sanctuary are fused in the same element.",
    solar_essence:
      "Driven by protective devotion, intuitive wisdom, and home sanctuary building.",
    lunar_essence:
      "Anchored in deep oceanic empathy, protective instincts, and cyclical emotional tides.",
  };

  it("renders null if profile is not provided", () => {
    const { container } = render(<BlueprintIdentity profile={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders combination title and pairing subtitle", () => {
    render(<BlueprintIdentity profile={mockProfile} />);
    expect(screen.getByText("The Ocean Sovereign")).toBeDefined();
    expect(screen.getByText("Cancer Sun • Cancer Moon")).toBeDefined();
    expect(screen.getByText("Natal Blueprint · Core Identity")).toBeDefined();
  });

  it("renders luminous expression trait chips when array is passed", () => {
    render(<BlueprintIdentity profile={mockProfile} />);
    expect(screen.getByText("Perceptive")).toBeDefined();
    expect(screen.getByText("Nurturing")).toBeDefined();
    expect(screen.getByText("Visionary")).toBeDefined();
    expect(screen.getByText("Loyal")).toBeDefined();
    expect(screen.getByText("Integrative")).toBeDefined();
  });

  it("renders luminous expression trait chips when comma-separated string is passed", () => {
    const stringChipsProfile: CombinationProfile = {
      ...mockProfile,
      luminous_expression: "Intuitive, Resilient, Empathetic, Luminous, Grounded",
    };
    render(<BlueprintIdentity profile={stringChipsProfile} />);
    expect(screen.getByText("Intuitive")).toBeDefined();
    expect(screen.getByText("Resilient")).toBeDefined();
    expect(screen.getByText("Empathetic")).toBeDefined();
  });

  it("renders the combination synthesis paragraph in serif text with left-alignment", () => {
    render(<BlueprintIdentity profile={mockProfile} />);
    const synthesis = screen.getByText(mockProfile.combination_synthesis);
    expect(synthesis).toBeDefined();
    expect(synthesis.className).toContain("font-serif");
    expect(synthesis.className).toContain("text-left");
  });

  it("renders solar and lunar essences side by side", () => {
    render(<BlueprintIdentity profile={mockProfile} />);
    expect(screen.getByText("Natal Sun · Conscious Drive")).toBeDefined();
    expect(screen.getByText(mockProfile.solar_essence)).toBeDefined();
    expect(screen.getByText("Natal Moon · Instinctual Sanctuary")).toBeDefined();
    expect(screen.getByText(mockProfile.lunar_essence)).toBeDefined();
  });
});
