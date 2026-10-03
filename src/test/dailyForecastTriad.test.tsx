import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DailyForecast from "../components/DailyForecast";
import * as useLunarForecastModule from "../hooks/useLunarForecast";

describe("DailyForecast Component - Layer 2 & Layer 3 Triad Restructuring", () => {
  const mockCurrentMoon = {
    sign: "Gemini",
    phase: "Waxing Crescent",
    illumination: 30,
    phaseEmoji: "🌒",
  };

  const mockTriadData: useLunarForecastModule.TriadData = {
    physical_guidance: "Breathwork expands the ribcage and settles restless pulse.",
    emotional_guidance: "Air currents invite your watery feelings to express verbally.",
    spiritual_guidance: "Observe the distinction between passing thoughts and sacred intuition.",
    daily_ritual: "Write three uncensored stream-of-consciousness pages before sunrise.",
    shadow_activation: "Intellectualizing emotional pain to avoid feeling vulnerable.",
    integration_invitation: "Allow logic and instinct to hold hands without judgment.",
  };

  it("renders the 8-step Triad layout when Triad data is present and omits legacy headline/energy/luckyFocus", () => {
    vi.spyOn(useLunarForecastModule, "useLunarForecast").mockReturnValue({
      forecast: {
        headline: "Old Headline Should Not Show",
        forecast: "Old forecast body should not show",
        energy: "Old Energy Should Not Show",
        luckyFocus: "Old Lucky Focus Should Not Show",
      },
      triadData: mockTriadData,
      loading: false,
      error: null,
    });

    render(
      <DailyForecast
        birthMoonSign="Cancer"
        currentMoon={mockCurrentMoon}
        natalSunSign="Cancer"
      />
    );

    // 1. Transit bridge sentence (Gemini Moon + Cancer Water)
    expect(screen.getByText(/Air Moon/i)).toBeDefined();

    // 2. Physical guidance
    expect(screen.getByText("Your body today")).toBeDefined();
    expect(screen.getByText(mockTriadData.physical_guidance)).toBeDefined();

    // 3. Emotional guidance
    expect(screen.getByText("Your emotional field")).toBeDefined();
    expect(screen.getByText(mockTriadData.emotional_guidance)).toBeDefined();

    // 4. Spiritual guidance
    expect(screen.getByText("The deeper invitation")).toBeDefined();
    expect(screen.getByText(mockTriadData.spiritual_guidance)).toBeDefined();

    // 5. Daily ritual practice block
    expect(screen.getByText("Today's practice")).toBeDefined();
    expect(screen.getByText(mockTriadData.daily_ritual)).toBeDefined();

    // 6. Divider
    expect(screen.getByText("Shadow & Integration")).toBeDefined();

    // 7. Shadow activation
    expect(screen.getByText("What to watch for")).toBeDefined();
    expect(screen.getByText(mockTriadData.shadow_activation)).toBeDefined();

    // 8. Integration invitation
    expect(screen.getByText("The integration opportunity")).toBeDefined();
    expect(screen.getByText(mockTriadData.integration_invitation)).toBeDefined();

    // Verify old engine fields are NOT rendered in Triad mode
    expect(screen.queryByText("Old Headline Should Not Show")).toBeNull();
    expect(screen.queryByText("Old Energy Should Not Show")).toBeNull();
    expect(screen.queryByText("Today's Energy")).toBeNull();
    expect(screen.queryByText("Lucky Focus")).toBeNull();
  });

  it("renders the legacy fallback layout when Triad data is absent", () => {
    vi.spyOn(useLunarForecastModule, "useLunarForecast").mockReturnValue({
      forecast: {
        headline: "A Harmonious Confluence",
        forecast: "Steady winds support deep inner contemplation.",
        energy: "Reflective Caliber",
        luckyFocus: "Somatic Grounding",
      },
      triadData: null,
      loading: false,
      error: null,
    });

    render(
      <DailyForecast
        birthMoonSign="Cancer"
        currentMoon={mockCurrentMoon}
        natalSunSign={null}
      />
    );

    // Legacy fields MUST show in fallback mode
    expect(screen.getByText("A Harmonious Confluence")).toBeDefined();
    expect(screen.getByText(/Steady winds support deep inner contemplation/)).toBeDefined();
    expect(screen.getByText("Today's Energy")).toBeDefined();
    expect(screen.getByText("Reflective Caliber")).toBeDefined();
    expect(screen.getByText("Lucky Focus")).toBeDefined();
    expect(screen.getByText("Somatic Grounding")).toBeDefined();

    // Triad labels should NOT show
    expect(screen.queryByText("Your body today")).toBeNull();
    expect(screen.queryByText("Today's practice")).toBeNull();
  });

  it("restructures free/paid boundary: renders body preview and LuminaryGate, gates all deeper sections for free users", () => {
    vi.spyOn(useLunarForecastModule, "useLunarForecast").mockReturnValue({
      forecast: null,
      triadData: {
        ...mockTriadData,
        physical_guidance: "First sentence of body guidance. Second sentence of body guidance. Third sentence should be blurred.",
      },
      loading: false,
      error: null,
    });

    const handleSelectPlan = vi.fn();

    render(
      <DailyForecast
        birthMoonSign="Cancer"
        currentMoon={mockCurrentMoon}
        natalSunSign="Cancer"
        isPro={false}
        onSelectPlan={handleSelectPlan}
      />
    );

    // Free users see: Bridge sentence
    expect(screen.getByText(/Air Moon/i)).toBeDefined();

    // Free users see: Body section preview
    expect(screen.getByText("Your body today")).toBeDefined();
    expect(screen.getByText(/First sentence of body guidance\. Second sentence of body guidance\./)).toBeDefined();

    // Free users see: Gate component with dynamic moon signs and checkout button
    expect(screen.getByText("Now you know who you are.")).toBeDefined();
    expect(
      screen.getByText(
        /Today's Gemini Moon is moving through your Cancer\. Luminary shows you how that's shaping your emotions/i
      )
    ).toBeDefined();
    expect(screen.getByText("UNLOCK LUMINARY — $6.88/month")).toBeDefined();
    expect(screen.getByText("or $58.88/year · cancel anytime")).toBeDefined();

    // Everything below body preview is Luminary only — verify NOT rendered for free users:
    expect(screen.queryByText("Your emotional field")).toBeNull();
    expect(screen.queryByText(mockTriadData.emotional_guidance)).toBeNull();
    expect(screen.queryByText("The deeper invitation")).toBeNull();
    expect(screen.queryByText(mockTriadData.spiritual_guidance)).toBeNull();
    expect(screen.queryByText("Today's practice")).toBeNull();
    expect(screen.queryByText(mockTriadData.daily_ritual)).toBeNull();
    expect(screen.queryByText("Shadow & Integration")).toBeNull();
    expect(screen.queryByText("What to watch for")).toBeNull();
    expect(screen.queryByText(mockTriadData.shadow_activation)).toBeNull();
    expect(screen.queryByText("The integration opportunity")).toBeNull();
    expect(screen.queryByText(mockTriadData.integration_invitation)).toBeNull();
  });
});
