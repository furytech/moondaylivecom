import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import BlueprintPreviewCard, { getFirstTwoSentences } from "@/components/BlueprintPreviewCard";
import { triggerBlueprintEmail } from "@/services/blueprintEmailService";
import { supabase } from "@/integrations/supabase/client";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => {
  const fromMock = vi.fn();
  const functionsInvokeMock = vi.fn();
  return {
    supabase: {
      from: fromMock,
      functions: {
        invoke: functionsInvokeMock,
      },
    },
  };
});

describe("BlueprintPreviewCard", () => {
  it("extracts only the first two sentences of combination_synthesis", () => {
    const text =
      "Sentence one represents conscious drive. Sentence two reflects emotional sanctuary. Sentence three should be excluded. Sentence four is also excluded.";
    const result = getFirstTwoSentences(text);
    expect(result).toBe(
      "Sentence one represents conscious drive. Sentence two reflects emotional sanctuary."
    );
  });

  it("handles single-sentence synthesis cleanly", () => {
    const text = "Only one sentence here.";
    expect(getFirstTwoSentences(text)).toBe("Only one sentence here.");
  });

  it("handles empty or null synthesis safely", () => {
    expect(getFirstTwoSentences(null)).toBe("");
    expect(getFirstTwoSentences("")).toBe("");
  });

  it("renders preview card with gold title, first two sentences, and inbox notification line", () => {
    const synthesis =
      "You are a visionary alchemist of fire and water. Your emotional depth fuels your outward drive. Extra sentence not shown.";

    render(
      <BlueprintPreviewCard
        combinationTitle="The Mystic Pioneer"
        combinationSynthesis={synthesis}
      />
    );

    // Combination title in gold
    const title = screen.getByText("The Mystic Pioneer");
    expect(title).toBeInTheDocument();
    expect(title.className).toContain("text-gold-gradient");

    // First two sentences
    expect(
      screen.getByText(
        /"You are a visionary alchemist of fire and water\. Your emotional depth fuels your outward drive\."/
      )
    ).toBeInTheDocument();

    // Inbox line
    expect(
      screen.getByText("Your full Blueprint is on its way to your inbox")
    ).toBeInTheDocument();
  });
});

describe("triggerBlueprintEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries combination_profiles table and invokes send-blueprint-email edge function", async () => {
    const mockProfile = {
      combination_title: "The Electric Luminary",
      combination_synthesis: "Full synthesis text goes here.",
      solar_essence: "Solar drive.",
      lunar_essence: "Lunar peace.",
      default_behaviors: ["Behavior 1", "Behavior 2"],
    };

    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: mockProfile,
      error: null,
    });
    const eqMoonMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqSunMock = vi.fn().mockReturnValue({ eq: eqMoonMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqSunMock });

    vi.mocked(supabase.from).mockReturnValue({
      select: selectMock,
    } as any);

    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const result = await triggerBlueprintEmail({
      email: "cosmic@example.com",
      firstName: "Alex",
      sunSign: "Aries",
      moonSign: "Gemini",
    });

    expect(result.success).toBe(true);

    // Verified query to combination_profiles
    expect(supabase.from).toHaveBeenCalledWith("combination_profiles");
    expect(selectMock).toHaveBeenCalledWith(
      "combination_title, combination_synthesis, solar_essence, lunar_essence, default_behaviors"
    );
    expect(eqSunMock).toHaveBeenCalledWith("sun_sign", "Aries");
    expect(eqMoonMock).toHaveBeenCalledWith("moon_sign", "Gemini");

    // Verified invoke to send-blueprint-email
    expect(supabase.functions.invoke).toHaveBeenCalledWith("send-blueprint-email", {
      body: {
        email: "cosmic@example.com",
        firstName: "Alex",
        sunSign: "Aries",
        moonSign: "Gemini",
        blueprint: mockProfile,
      },
    });
  });
});
