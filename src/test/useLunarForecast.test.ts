import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLunarForecast } from "../hooks/useLunarForecast";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => {
  const fromMock = vi.fn();
  return {
    supabase: {
      from: fromMock,
    },
    fromMock,
  };
});

describe("useLunarForecast - Triad States Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMoon = {
    sign: "Taurus",
    phase: "Full Moon",
    illumination: 100,
    phaseEmoji: "🌕",
  };

  it("fetches triad_states when natalSunSign is provided", async () => {
    const mockTriadData = {
      physical_guidance: "Feel your roots sinking deep into the earth today.",
      emotional_guidance: "Aries fire meets Taurus calm, giving patience to impulse.",
      spiritual_guidance: "Grounding transcendent vision into tangible reality.",
      daily_ritual: "Walk barefoot on soil or hold a smoky quartz stone.",
      shadow_activation: "Impatience with the natural speed of physical manifestation.",
      integration_invitation: "Allow stillness to be productive.",
    };

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockTriadData, error: null });
    const eqMock3 = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqMock2 = vi.fn().mockReturnValue({ eq: eqMock3 });
    const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "triad_states") {
        return {
          select: selectMock,
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() =>
      useLunarForecast("Aries", mockMoon, "Leo")
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(supabase.from).toHaveBeenCalledWith("triad_states");
    expect(selectMock).toHaveBeenCalledWith(
      "physical_guidance, emotional_guidance, spiritual_guidance, daily_ritual, shadow_activation, integration_invitation"
    );
    expect(eqMock1).toHaveBeenCalledWith("natal_sun_sign", "Leo");
    expect(eqMock2).toHaveBeenCalledWith("natal_moon_sign", "Aries");
    expect(eqMock3).toHaveBeenCalledWith("transiting_moon_sign", "Taurus");

    expect(result.current.forecast).toEqual({
      headline: mockTriadData.physical_guidance,
      forecast: mockTriadData.emotional_guidance,
      energy: mockTriadData.spiritual_guidance,
      luckyFocus: mockTriadData.daily_ritual,
      phaseModifier: mockTriadData.shadow_activation,
      integrationInvitation: mockTriadData.integration_invitation,
    });
  });

  it("falls back to daily_forecasts when natalSunSign is not provided", async () => {
    const mockDailyForecast = {
      headline: "A day of reflection and steady expansion",
      forecast_text: "The Taurus moon stabilizes your emotional atmosphere.",
      energy: "Grounded",
      lucky_focus: "Practical steps",
    };

    const maybeSingleForecastMock = vi.fn().mockResolvedValue({ data: mockDailyForecast, error: null });
    const eqForecast2 = vi.fn().mockReturnValue({ maybeSingle: maybeSingleForecastMock });
    const eqForecast1 = vi.fn().mockReturnValue({ eq: eqForecast2 });
    const selectForecast = vi.fn().mockReturnValue({ eq: eqForecast1 });

    const maybeSinglePhaseMock = vi.fn().mockResolvedValue({ data: { modifier_text: "Illuminate your truth." }, error: null });
    const eqPhase = vi.fn().mockReturnValue({ maybeSingle: maybeSinglePhaseMock });
    const selectPhase = vi.fn().mockReturnValue({ eq: eqPhase });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "daily_forecasts") {
        return { select: selectForecast } as any;
      }
      if (table === "moon_phase_texts") {
        return { select: selectPhase } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() =>
      useLunarForecast("Aries", mockMoon, null)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(supabase.from).toHaveBeenCalledWith("daily_forecasts");
    expect(result.current.forecast).toEqual({
      headline: mockDailyForecast.headline,
      forecast: mockDailyForecast.forecast_text,
      energy: mockDailyForecast.energy,
      luckyFocus: mockDailyForecast.lucky_focus,
      phaseModifier: "Illuminate your truth.",
    });
  });
});
