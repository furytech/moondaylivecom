import { describe, it, expect } from "vitest";
import {
  archetypeName,
  buildForYou,
  draconicForYou,
  elementModalityLine,
  isLuminaryMember,
  normalizeSign,
  personalHeaderLine,
  resolveTriadPanel,
  safeTimeZone,
  siderealForYou,
  tropicalForYou,
  withTimeout,
} from "../lib/lensesPersonal";
import { chandraLagnaHouses, computeTriadMoon } from "../lib/sovereignEngine";

describe("normalizeSign", () => {
  it("accepts any casing and padding", () => {
    expect(normalizeSign(" leo ")).toBe("Leo");
    expect(normalizeSign("PISCES")).toBe("Pisces");
  });
  it("rejects non-signs", () => {
    expect(normalizeSign("Ophiuchus")).toBeNull();
    expect(normalizeSign(null)).toBeNull();
    expect(normalizeSign("")).toBeNull();
  });
});

describe("isLuminaryMember", () => {
  it("treats the Stripe subscription as paid", () => {
    expect(isLuminaryMember(null, true)).toBe(true);
  });
  it("treats sovereign, luminary and is_subscriber as paid", () => {
    expect(isLuminaryMember({ subscription_status: "sovereign" }, false)).toBe(true);
    expect(isLuminaryMember({ subscription_status: "Luminary" }, false)).toBe(true);
    expect(isLuminaryMember({ is_subscriber: true }, false)).toBe(true);
  });
  it("treats a free profile as not paid", () => {
    expect(isLuminaryMember({ is_subscriber: false, subscription_status: "free" }, false)).toBe(false);
    expect(isLuminaryMember(null, false)).toBe(false);
  });
  it("lets the dev tier override win", () => {
    expect(isLuminaryMember({ is_subscriber: true }, true, "free")).toBe(false);
    expect(isLuminaryMember(null, false, "sovereign")).toBe(true);
  });
});

describe("personalHeaderLine", () => {
  it("uses the archetype name from the stored combination_title", () => {
    expect(
      personalHeaderLine("Leo", "Sagittarius", "Leo Sun • Sagittarius Moon — The Luminary Archer"),
    ).toBe("Your Sun in Leo · Moon in Sagittarius · The Luminary Archer");
  });
  it("keeps a title that has no pairing prefix as is", () => {
    expect(archetypeName("The Ocean Sovereign")).toBe("The Ocean Sovereign");
  });
  it("falls back to the signs when there is no title", () => {
    expect(personalHeaderLine("Leo", "Cancer", null)).toBe("Leo Sun · Cancer Moon");
    expect(personalHeaderLine("Leo", "Cancer", "  ")).toBe("Leo Sun · Cancer Moon");
  });
});

describe("elementModalityLine", () => {
  it("same element and modality", () => {
    const line = elementModalityLine("Leo", "Scorpio", "the day");
    // Fire vs Water is contrasting, Fixed vs Fixed is shared
    expect(line).toContain("Fire meets your Water");
    expect(line).toContain("You both lean toward holding steady.");
  });
  it("shared element reads as familiar", () => {
    const line = elementModalityLine("Aries", "Leo", "the day");
    expect(line).toContain("Both are Fire, so the day may feel familiar.");
    expect(line).toContain("The day leans toward starting things, while you lean toward holding steady.");
  });
  it("Fire with Air and Earth with Water read as supportive", () => {
    expect(elementModalityLine("Aries", "Gemini", "the day")).toContain("tend to support each other");
    expect(elementModalityLine("Taurus", "Cancer", "the day")).toContain("tend to support each other");
  });
  it("is always two sentences and never predictive", () => {
    const line = elementModalityLine("Virgo", "Sagittarius", "the day");
    expect(line.match(/\./g)).toHaveLength(2);
    expect(line).not.toMatch(/\bwill\b/);
  });
});

describe("lens For you lines", () => {
  it("tropical compares today's Moon with the natal Sun", () => {
    const f = tropicalForYou("Gemini", "Taurus");
    expect(f.label).toBe("Moon in Gemini meets your Taurus Sun");
    expect(f.text).toContain("social tone of the day");
  });

  it("draconic compares the draconic Moon with the natal Moon", () => {
    const f = draconicForYou("Pisces", "Cancer");
    expect(f.label).toBe("Draconic Pisces meets your Cancer Moon");
    expect(f.text).toContain("Water");
    expect(f.text).toContain("soul's direction");
  });

  it("sidereal reports the house from the natal Moon and its inquiry prompt", () => {
    const at = new Date("2026-03-14T12:00:00Z");
    const transit = computeTriadMoon(at).tropical.sign;
    const houses = chandraLagnaHouses("Leo");
    const expected = houses.find((h) => h.sign === transit)!;
    const f = siderealForYou("Leo", at);
    expect(f.text).toBe(expected.inquiry);
    expect(f.label).toContain(`from your Leo Moon`);
    expect(f.label).toMatch(/\d+(st|nd|rd|th) house/);
  });

  it("buildForYou returns all three lenses", () => {
    const at = new Date("2026-03-14T12:00:00Z");
    const t = computeTriadMoon(at);
    const out = buildForYou({
      natalSun: "Leo",
      natalMoon: "Cancer",
      tropical: t.tropical.sign,
      draconic: t.draconic.sign,
      at,
    });
    expect(Object.keys(out).sort()).toEqual(["internal", "social", "soul"]);
    expect(out.social.label).toContain("Leo Sun");
    expect(out.soul.label).toContain("Cancer Moon");
  });
});

describe("resolveTriadPanel (triad fallback)", () => {
  it("falls back to the generic synthesis when no row is found", () => {
    expect(resolveTriadPanel(null)).toEqual({ kind: "generic" });
    expect(resolveTriadPanel(undefined)).toEqual({ kind: "generic" });
  });

  it("falls back when the row has no invitation and no ritual", () => {
    expect(
      resolveTriadPanel({ combination_title: "T", triad_number: 5, integration_invitation: " ", daily_ritual: null }),
    ).toEqual({ kind: "generic" });
  });

  it("shows the member's row when present", () => {
    const panel = resolveTriadPanel({
      combination_title: "Leo Sun • Cancer Moon • Gemini Moon",
      triad_number: 421,
      integration_invitation: "Let logic and instinct hold hands.",
      daily_ritual: "Write three pages before sunrise.",
    });
    expect(panel).toEqual({
      kind: "personal",
      title: "Leo Sun • Cancer Moon • Gemini Moon",
      numberLabel: "#421 of 1,728",
      integrationInvitation: "Let logic and instinct hold hands.",
      dailyRitual: "Write three pages before sunrise.",
    });
  });

  it("omits what is missing without falling back", () => {
    const panel = resolveTriadPanel({ triad_number: null, integration_invitation: "Invite.", daily_ritual: null });
    expect(panel).toMatchObject({ kind: "personal", numberLabel: null, dailyRitual: null, title: null });
  });
});

describe("safeTimeZone", () => {
  it("keeps valid zones and drops invalid ones", () => {
    expect(safeTimeZone("America/Chicago")).toBe("America/Chicago");
    expect(safeTimeZone("Not/AZone")).toBeUndefined();
    expect(safeTimeZone(null)).toBeUndefined();
  });
});

describe("withTimeout", () => {
  it("rejects when the promise never settles", async () => {
    await expect(withTimeout(new Promise(() => {}), 20)).rejects.toThrow("timeout");
  });
  it("resolves with the value when fast enough", async () => {
    await expect(withTimeout(Promise.resolve(7), 200)).resolves.toBe(7);
  });
});
