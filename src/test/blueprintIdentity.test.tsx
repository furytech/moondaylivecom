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
    expect(synthesis.style.textAlign).toBe("left");
  });

  it("splits multi-sentence combination_synthesis into multiple <p> tags with explicit left alignment", () => {
    const multiSentenceProfile: CombinationProfile = {
      ...mockProfile,
      combination_synthesis:
        "First sentence sets the stage. Second sentence finishes the thought. Third sentence goes deeper into the shadow. Fourth sentence brings sovereign integration.",
    };
    const { container } = render(<BlueprintIdentity profile={multiSentenceProfile} />);
    const paragraphs = container.querySelectorAll("div.w-full.mb-10.text-left p");
    expect(paragraphs.length).toBe(2);

    paragraphs.forEach((p) => {
      expect(p.className).toContain("text-left");
      expect(p.className).not.toContain("text-center");
      expect(p.className).not.toContain("text-justify");
      expect((p as HTMLElement).style.textAlign).toBe("left");
      expect((p as HTMLElement).style.marginBottom).toBe("1.2em");
      expect(["0", "0px"]).toContain((p as HTMLElement).style.textIndent);
    });
  });

  it("renders solar and lunar essences side by side", () => {
    render(<BlueprintIdentity profile={mockProfile} />);
    expect(screen.getByText("Natal Sun · Conscious Drive")).toBeDefined();
    expect(screen.getByText(mockProfile.solar_essence)).toBeDefined();
    expect(screen.getByText("Natal Moon · Instinctual Sanctuary")).toBeDefined();
    expect(screen.getByText(mockProfile.lunar_essence)).toBeDefined();
  });

  it("calculates deterministic triad numbers across the 1-1,728 range correctly", async () => {
    const { getTriadStateNumber } = await import("../components/BlueprintIdentity");
    // First state: Aries Sun (0) * 144 + Aries Moon (0) * 12 + Aries Transit (0) + 1 = 1
    expect(getTriadStateNumber("Aries", "Aries", "Aries")).toBe(1);
    // Last state: Pisces Sun (11) * 144 + Pisces Moon (11) * 12 + Pisces Transit (11) + 1 = 1728
    expect(getTriadStateNumber("Pisces", "Pisces", "Pisces")).toBe(1728);
    // Cancer (3) * 144 + Cancer (3) * 12 + Virgo (5) + 1 = 432 + 36 + 5 + 1 = 474
    expect(getTriadStateNumber("Cancer", "Cancer", "Virgo")).toBe(474);
  });

  it("renders '✦ YOUR LUNAR SIGNATURE · [X] OF 1,728 ✦' directly above the archetype title", () => {
    render(<BlueprintIdentity profile={mockProfile} currentMoonSign="Virgo" />);
    // Cancer Sun + Cancer Moon + Virgo Transit = 474
    const hook = screen.getByText("✦ YOUR LUNAR SIGNATURE · 474 OF 1,728 ✦");
    expect(hook).toBeDefined();
    expect(hook.className).toContain("font-display");
    expect(hook.className).toContain("text-xs");
    expect(hook.className).toContain("uppercase");
    expect(hook.className).toContain("tracking-widest");

    // Verify it is positioned directly above the archetype title
    const archetypeTitle = screen.getByText("The Ocean Sovereign");
    expect(hook.compareDocumentPosition(archetypeTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders archetype title, hook, and trait chips for free users while gating synthesis and essences", () => {
    render(<BlueprintIdentity profile={mockProfile} currentMoonSign="Virgo" isPro={false} />);

    // Free users see: Archetype title + hook + trait chips
    expect(screen.getByText("The Ocean Sovereign")).toBeDefined();
    expect(screen.getByText("✦ YOUR LUNAR SIGNATURE · 474 OF 1,728 ✦")).toBeDefined();
    expect(screen.getByText("Perceptive")).toBeDefined();
    expect(screen.getByText("Nurturing")).toBeDefined();

    // Synthesis & essences are gated (Luminary only)
    expect(screen.queryByText(/The Cancer Sun creates deep instinctual tidal rhythm/i)).toBeNull();
    expect(screen.queryByText("Natal Sun · Conscious Drive")).toBeNull();
    expect(screen.queryByText("Natal Moon · Instinctual Sanctuary")).toBeNull();
  });
});
