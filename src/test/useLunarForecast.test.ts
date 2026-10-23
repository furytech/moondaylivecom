import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLunarForecast } from "../hooks/useLunarForecast";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => {
  const fromMock = vi.fn();
  return {
    supabase: {
      from: fromMock,
      rpc: vi.fn(),
    },
    fromMock,
  };
});

/** daily_forecasts + moon_phase_texts tables returning one canned row each (the generic fallback path). */
const dailyForecastRow = {
  headline: "A day of reflection and steady expansion",
  forecast_text: "The Taurus moon stabilizes your emotional atmosphere.",
  energy: "Grounded",
  lucky_focus: "Practical steps",
};
function mockGenericTables(extra: Record<string, unknown> = {}) {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table in extra) return extra[table] as any;
    if (table === "daily_forecasts") {
      const maybeSingle = vi.fn().mockResolvedValue({ data: dailyForecastRow, error: null });
      return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }) } as any;
    }
    if (table === "moon_phase_texts") {
      const maybeSingle = vi.fn().mockResolvedValue({ data: { modifier_text: "Illuminate your truth." }, error: null });
      return { select: () => ({ eq: () => ({ maybeSingle }) }) } as any;
    }
    return {} as any;
  });
}
function triadTable(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq3 = vi.fn().mockReturnValue({ maybeSingle });
  const eq2 = vi.fn().mockReturnValue({ eq: eq3 });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  return { table: { select }, select };
}
const genericForecast = {
  headline: dailyForecastRow.headline,
  forecast: dailyForecastRow.forecast_text,
  energy: dailyForecastRow.energy,
  luckyFocus: dailyForecastRow.lucky_focus,
  phaseModifier: "Illuminate your truth.",
};

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
    expect(supabase.rpc).not.toHaveBeenCalled();
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

  describe("free members (teaser through get_my_triad_preview)", () => {
    const teaser = {
      physical_guidance: "Feel your roots sinking deep. The ground holds you.",
      emotional_guidance: "Aries fire meets Taurus calm, giving patience",
    };

    it("calls the preview function for today's Moon sign and never reads the table", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [teaser], error: null } as any);
      mockGenericTables();

      const { result } = renderHook(() => useLunarForecast("Aries", mockMoon, "Leo", false));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(supabase.rpc).toHaveBeenCalledWith("get_my_triad_preview", { p_transiting_moon_sign: "Taurus" });
      expect(supabase.from).not.toHaveBeenCalledWith("triad_states");
      expect(result.current.triadData).toEqual({
        physical_guidance: teaser.physical_guidance,
        emotional_guidance: teaser.emotional_guidance,
        spiritual_guidance: "",
        daily_ritual: "",
        shadow_activation: "",
        integration_invitation: "",
      });
    });

    it("falls back to the old read, narrowed to the two teaser columns, while the function is not installed yet", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { code: "PGRST202", message: "Could not find the function public.get_my_triad_preview(p_transiting_moon_sign) in the schema cache" },
      } as any);
      const { table, select } = triadTable({ data: teaser, error: null });
      mockGenericTables({ triad_states: table });

      const { result } = renderHook(() => useLunarForecast("Aries", mockMoon, "Leo", false));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(select).toHaveBeenCalledWith("physical_guidance, emotional_guidance");
      expect(result.current.triadData?.physical_guidance).toBe(teaser.physical_guidance);
      expect(result.current.triadData?.spiritual_guidance).toBe("");
    });

    it("also falls back when Postgres reports the function as missing (42883)", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: "42883", message: "function does not exist" } } as any);
      const { table, select } = triadTable({ data: teaser, error: null });
      mockGenericTables({ triad_states: table });

      const { result } = renderHook(() => useLunarForecast("Aries", mockMoon, "Leo", false));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(select).toHaveBeenCalledTimes(1);
      expect(result.current.triadData?.emotional_guidance).toBe(teaser.emotional_guidance);
    });

    it("shows the generic forecast when there is no stored natal pair (function returns no row)", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as any);
      mockGenericTables();

      const { result } = renderHook(() => useLunarForecast("Aries", mockMoon, "Leo", false));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.triadData).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.forecast).toEqual(genericForecast);
      expect(supabase.from).not.toHaveBeenCalledWith("triad_states");
    });

    it("does not retry the table after a real function error, and shows the generic forecast", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: "57014", message: "statement timeout" } } as any);
      mockGenericTables();
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useLunarForecast("Aries", mockMoon, "Leo", false));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(supabase.from).not.toHaveBeenCalledWith("triad_states");
      expect(result.current.triadData).toBeNull();
      expect(result.current.forecast).toEqual(genericForecast);
      consoleError.mockRestore();
    });
  });

  describe("Luminary members", () => {
    it("shows the generic forecast, without an error, when RLS returns no row (no stored natal pair)", async () => {
      const { table } = triadTable({ data: null, error: null });
      mockGenericTables({ triad_states: table });

      const { result } = renderHook(() => useLunarForecast("Aries", mockMoon, "Leo", true));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(supabase.rpc).not.toHaveBeenCalled();
      expect(result.current.triadData).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.forecast).toEqual(genericForecast);
    });

    it("shows the generic forecast when the table read is refused (permission denied)", async () => {
      const { table } = triadTable({ data: null, error: { code: "42501", message: "permission denied for table triad_states" } });
      mockGenericTables({ triad_states: table });
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useLunarForecast("Aries", mockMoon, "Leo", true));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.triadData).toBeNull();
      expect(result.current.forecast).toEqual(genericForecast);
      consoleError.mockRestore();
    });
  });
});
