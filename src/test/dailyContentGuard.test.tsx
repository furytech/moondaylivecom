import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import DailyForecast from "../components/DailyForecast";
import * as useLunarForecastModule from "../hooks/useLunarForecast";
import {
  assertNoBodyClaims,
  findBodyClaims,
  hasBodyClaims,
  stripBodyClaims,
  stripBodyClaimsFromRecord,
} from "../lib/dailyContentGuard";

describe("daily content guard", () => {
  it("flags body systems, symptoms, health advice and medical-sounding terms", () => {
    const flagged = [
      "The electric frequency may cause static in your nervous system, felt as tension behind the eyes.",
      "Spinal fluid circulation matters, so hydration is vital today.",
      "Watch for symptoms in your digestive tract and your organs.",
      "Your body wants rest. Physical energy is low.",
      "Somatic grounding calms the immune response and inflammation.",
      "Take medication as your doctor advises.",
    ];
    for (const text of flagged) expect(hasBodyClaims(text), text).toBe(true);
    expect(findBodyClaims("nervous system, spinal, hydration, symptoms, organs")).toEqual(
      expect.arrayContaining(["nervous system", "spinal / spine", "hydration", "symptoms", "organs"])
    );
  });

  it("lets mood, energy, focus, relationships and behaviour through", () => {
    const clean = [
      "Feelings may arrive as thoughts today. Name them out loud before deciding what they mean.",
      "Your focus wants the long, single-tracked task, and a quiet conversation with someone you trust.",
      "Intellectualizing emotional pain to avoid feeling vulnerable.",
      "Hold something warm for three minutes and say what you need in one sentence.",
      "Heartfelt conversations come easily; trust your instincts.",
    ];
    for (const text of clean) expect(findBodyClaims(text), text).toEqual([]);
  });

  it("drops only the sentences that cross the line", () => {
    const text = "You may feel restless. Your nervous system needs calm. Take a slow walk and call a friend.";
    expect(stripBodyClaims(text)).toBe("You may feel restless. Take a slow walk and call a friend.");
    expect(stripBodyClaims("Your body needs hydration.")).toBe("");
    expect(stripBodyClaims(null)).toBe("");
    expect(stripBodyClaimsFromRecord({ a: "Your spine aches. Stay curious.", n: 3 })).toEqual({ a: "Stay curious.", n: 3 });
  });

  it("rejects a generated draft that crosses the line, naming the field and term", () => {
    expect(() => assertNoBodyClaims({ physical_guidance: "Mind your circulation.", emotional_guidance: "Soft day." })).toThrow(
      /physical_guidance \(circulation\)/
    );
    expect(() => assertNoBodyClaims({ physical_guidance: "Energy runs fast and wants an outlet." })).not.toThrow();
  });

  it("keeps the static daily copy clean (Pulse, forecast, ritual, lenses, transit bridge)", () => {
    const files = [
      "src/lib/pulseSynthesis.ts",
      "src/lib/forecastEngine.ts",
      "src/lib/innerCircleDictionary.ts",
      "src/lib/dailyRitual.ts",
      "src/lib/transitBridge.ts",
      "src/lib/lensesPersonal.ts",
      "src/pages/Triad.tsx",
      "src/components/DailyPulse.tsx",
      "src/components/DailyRitual.tsx",
      "src/components/ClimateGauge.tsx",
      "src/components/VoidIntervalSection.tsx",
      "src/components/GreatCycleSection.tsx",
      "src/components/LunarSignatureSection.tsx",
      "src/components/DailyForecast.tsx",
    ];
    const quoted = /(["'`])(?:(?!\1)[^\\]|\\.){25,}\1/g;
    const offenders: string[] = [];
    for (const file of files) {
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
          for (const str of line.match(quoted) ?? []) {
            if (hasBodyClaims(str)) offenders.push(`${file}:${i + 1} ${str.slice(0, 70)}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it("never shows a stored forecast line that makes a body claim, and hides a section that is all claims", () => {
    vi.spyOn(useLunarForecastModule, "useLunarForecast").mockReturnValue({
      forecast: null,
      triadData: {
        physical_guidance:
          "The pace of the day runs quick. Your nervous system may feel static behind the eyes. Hydration and spinal fluid circulation are vital.",
        emotional_guidance: "Your body holds the feeling. Spinal tension is a symptom.",
        spiritual_guidance: "Notice what stays when the room goes quiet.",
        daily_ritual: "Write three honest lines before noon.",
        shadow_activation: "Over-explaining so no one gets close.",
        integration_invitation: "Let one person see the unpolished version.",
      },
      loading: false,
      error: null,
    } as never);

    render(
      <DailyForecast
        birthMoonSign="Cancer"
        currentMoon={{ sign: "Gemini", phase: "Waxing Crescent", illumination: 30, phaseEmoji: "🌒" }}
        natalSunSign="Cancer"
      />
    );

    expect(screen.getByText("The pace of the day runs quick.")).toBeInTheDocument();
    expect(screen.queryByText(/nervous system|spinal|hydration|circulation/i)).toBeNull();
    // the emotional field was all claims: the section is not shown at all
    expect(screen.queryByText("Your emotional field")).toBeNull();
    expect(screen.getByText("The deeper invitation")).toBeInTheDocument();
  });
});
