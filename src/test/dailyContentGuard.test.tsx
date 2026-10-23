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
      "Adrenal and cortisol surges flood your system, a symptom of stress.",
      "Somatic grounding calms the immune response and inflammation.",
      "Take medication as your doctor advises.",
    ];
    for (const text of flagged) expect(hasBodyClaims(text), text).toBe(true);
    expect(findBodyClaims("nervous system, spinal, dehydration, symptoms, organs")).toEqual(
      expect.arrayContaining(["nervous system", "spinal / spine", "dehydration", "symptoms", "organs"])
    );
  });

  it("flags diagnoses, conditions, stress chemistry and clinical body wording (each has a glossary translation)", () => {
    const flagged: Array<[string, string]> = [
      ["severe hypochondria and a leaky fight-or-flight response", "hypochondria"],
      ["Adrenaline and cortisol keep you wired.", "stress chemistry"],
      ["The anxiety will not settle.", "anxiety"],
      ["A slow depression drains your drive.", "depression"],
      ["Insomnia may visit tonight.", "insomnia"],
      ["Blood flow follows attention.", "circulation"],
      ["Hormones shift with the tide.", "hormones"],
      ["Blending Virgo's love for bodily hygiene with the sea.", "hygiene / clinical phrasing"],
      ["Rest one hand on your lower belly and warm your chest.", "chest / belly"],
      ["Try lymphatic drainage or dry brushing.", "internal organs / tissue"],
      ["Old trauma and panic attacks surface.", "conditions / diagnoses"],
      ["Somatic release for body tension.", "somatic / body tension"],
      ["Let your hands metabolize the worry.", "metabolism"],
    ];
    for (const [text, label] of flagged) expect(findBodyClaims(text), text).toContain(label);
  });

  it("allows cure only for a material, and royal / silent treatment, but keeps every health use of cure, treat and heal flagged", () => {
    const allowed = [
      "Leave the clay to cure overnight before you sand it.",
      "Wait while the foundation cures, and let the weight rest.",
      "Let the resin cure, then bake and cure the glaze in direct sunlight.",
      "You may crave the royal treatment, or fall back on the silent treatment.",
      "Mold a block of terracotta clay with your bare hands. Then place it in the direct sunlight to bake and cure.",
      "Use a pottery session to channel your impatience, then leave the piece to cure as a testament.",
      "Stop treating your body like an inconvenient vehicle and try treating it like a temple.",
    ];
    for (const text of allowed) expect(findBodyClaims(text), text).toEqual([]);
    const flagged = [
      "A cure for your loneliness is closer than you think.",
      "Let this evening cure your anxiety, clay or no clay.",
      "She was cured by the weekend.",
      "Try a new treatment for the pain.",
      "Treat your illness gently and heal your body with rest.",
      "Heal the pain in your back.",
      "Mold the clay with your hands. A cure for loneliness is warmth.",
      "Knead the clay, then find a cure for what ails you.",
    ];
    for (const text of flagged) expect(findBodyClaims(text), text).toContain("medical / health advice");
  });

  it("allows the everyday gestures the glossary keeps", () => {
    const allowed = [
      "Rest one hand over your heart as a quiet gesture of kindness to yourself.",
      "Take a warm bath, or a warm foot soak scented with eucalyptus, as a ritual of release.",
      "Dab frankincense on your wrists and breathe slowly.",
      "That keyed-up, braced-for-impact feeling eases when you slow your breathing.",
      "Notice the stress you carry, like tight shoulders or a clenched jaw.",
      "Let a sense of warmth gather and settle.",
      // everyday figures of speech that only look clinical
      "You may catch yourself weaponizing the silent treatment when you feel exposed.",
      "Your shell does not need to become a prison cell, and sterile perfection is not the goal.",
    ];
    for (const text of allowed) expect(findBodyClaims(text), text).toEqual([]);
  });

  it("allows plain everyday self-care and activity suggestions", () => {
    const allowed = [
      "Take a slow walk, rest early, drink some water and stretch.",
      "Your body may want to slow down today, so let the afternoon be unhurried.",
      "Step outside, eat something warm and go to bed early.",
      "Trust your gut feeling about the invitation; your gut instinct is rarely wrong.",
      "Your chronic hesitation softens, and a clinical detachment gives way to warmth.",
      "Physical activity that suits the day: a long walk or an easy swim.",
    ];
    for (const text of allowed) expect(findBodyClaims(text), text).toEqual([]);
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
    expect(stripBodyClaims("Your spine aches and your hormones surge.")).toBe("");
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
        emotional_guidance: "Your nervous system is overloaded. Spinal tension is a symptom.",
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
