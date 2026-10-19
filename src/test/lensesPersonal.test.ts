import { describe, it, expect } from "vitest";
import {
  archetypeName,
  buildForYou,
  draconicForYou,
  elementModalityLine,
  birthdayNoon,
  isLuminaryMember,
  natalSiderealMoon,
  normalizeSign,
  personalHero,
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

describe("personalHero", () => {
  it("puts the archetype name in the hero with a small signs line above", () => {
    expect(
      personalHero("Leo", "Sagittarius", "Leo Sun • Sagittarius Moon — The Luminary Archer"),
    ).toEqual({ kicker: "Your Sun in Leo · Moon in Sagittarius", headline: "The Luminary Archer" });
  });
  it("keeps a title that has no pairing prefix as is", () => {
    expect(archetypeName("The Ocean Sovereign")).toBe("The Ocean Sovereign");
    expect(personalHero("Cancer", "Cancer", "The Sovereign Sentinel").headline).toBe("The Sovereign Sentinel");
  });
  it("falls back to the signs in the hero when there is no title", () => {
    expect(personalHero("Leo", "Cancer", null)).toEqual({ kicker: null, headline: "Leo Sun · Cancer Moon" });
    expect(personalHero("Leo", "Cancer", "  ").headline).toBe("Leo Sun · Cancer Moon");
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

  it("sidereal counts the house between sidereal Moons without naming the natal sign", () => {
    const at = new Date("2026-03-14T12:00:00Z");
    const today = computeTriadMoon(at).sidereal.sign;
    const houses = chandraLagnaHouses("Leo");
    const expected = houses.find((h) => h.sign === today)!;
    const f = siderealForYou("Leo", at);
    expect(f.text).toBe(expected.inquiry);
    expect(f.label).toBe(`The ${["1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th"][expected.house - 1]} house from your natal Moon`);
    expect(f.label).not.toMatch(/Leo|Aries|Taurus|Gemini|Cancer|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces/);
  });

  it("sidereal is the 1st house when today's sidereal Moon is in the natal sidereal sign", () => {
    const at = new Date("2026-03-14T12:00:00Z");
    const today = computeTriadMoon(at).sidereal.sign;
    expect(siderealForYou(today, at).label).toBe("The 1st house from your natal Moon");
  });

  it("buildForYou returns all three lenses", () => {
    const at = new Date("2026-03-14T12:00:00Z");
    const t = computeTriadMoon(at);
    const out = buildForYou({
      natalSun: "Leo",
      natalMoon: "Cancer",
      natalSiderealMoon: "Gemini",
      tropical: t.tropical.sign,
      draconic: t.draconic.sign,
      at,
    });
    expect(Object.keys(out).sort()).toEqual(["internal", "social", "soul"]);
    expect(out.social.label).toContain("Leo Sun");
    expect(out.soul.label).toContain("Cancer Moon");
  });

  it("buildForYou omits the Sidereal line when the natal sidereal Moon is unknown", () => {
    const at = new Date("2026-03-14T12:00:00Z");
    const t = computeTriadMoon(at);
    const out = buildForYou({
      natalSun: "Leo",
      natalMoon: "Cancer",
      natalSiderealMoon: null,
      tropical: t.tropical.sign,
      draconic: t.draconic.sign,
      at,
    });
    expect(out.internal).toBeUndefined();
    expect(out.social).toBeDefined();
    expect(out.soul).toBeDefined();
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

  it("leads with the number and shows no title when the row repeats the Blueprint title", () => {
    const panel = resolveTriadPanel(
      {
        combination_title: "Leo Sun • Cancer Moon — The Sovereign Sentinel",
        triad_number: 421,
        integration_invitation: "Let logic and instinct hold hands.",
        daily_ritual: "Write three pages before sunrise.",
      },
      "Leo Sun • Cancer Moon — The Sovereign Sentinel",
    );
    expect(panel).toEqual({
      kind: "personal",
      heading: "#421 of 1,728 · Today's Triad",
      subheading: null,
      integrationInvitation: "Let logic and instinct hold hands.",
      dailyRitual: "Write three pages before sunrise.",
    });
  });

  it("treats the same archetype name as a repeat even when the pairing prefix differs", () => {
    const panel = resolveTriadPanel(
      { combination_title: "The Sovereign Sentinel", integration_invitation: "x" },
      "Leo Sun • Cancer Moon — The Sovereign Sentinel",
    );
    expect(panel).toMatchObject({ kind: "personal", subheading: null });
  });

  it("shows a smaller subheading only when the row's title differs", () => {
    const panel = resolveTriadPanel(
      { combination_title: "Leo Sun • Cancer Moon • Gemini Moon — The Quick Tide", triad_number: 7, daily_ritual: "r" },
      "The Sovereign Sentinel",
    );
    expect(panel).toMatchObject({ kind: "personal", subheading: "The Quick Tide" });
  });

  it("shows the row's title when there is no Blueprint title to repeat", () => {
    const panel = resolveTriadPanel({ combination_title: "The Quick Tide", daily_ritual: "r" }, null);
    expect(panel).toMatchObject({ subheading: "The Quick Tide" });
  });

  it("omits the number without falling back", () => {
    const panel = resolveTriadPanel({ triad_number: null, integration_invitation: "Invite.", daily_ritual: null });
    expect(panel).toMatchObject({ kind: "personal", heading: "Today's Triad", subheading: null, dailyRitual: null });
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

describe("natal sidereal Moon", () => {
  it("birthdayNoon is UTC noon without a zone", () => {
    expect(birthdayNoon("1990-06-15")?.toISOString()).toBe("1990-06-15T12:00:00.000Z");
    expect(birthdayNoon("1990-06-15T00:00:00+00:00")?.toISOString()).toBe("1990-06-15T12:00:00.000Z");
  });
  it("birthdayNoon is local noon in the member's zone, across DST", () => {
    expect(birthdayNoon("1990-06-15", "America/Chicago")?.toISOString()).toBe("1990-06-15T17:00:00.000Z");
    expect(birthdayNoon("1990-01-15", "America/Chicago")?.toISOString()).toBe("1990-01-15T18:00:00.000Z");
    expect(birthdayNoon("1990-06-15", "Asia/Kolkata")?.toISOString()).toBe("1990-06-15T06:30:00.000Z");
  });
  it("birthdayNoon rejects garbage and ignores invalid zones", () => {
    expect(birthdayNoon("nope")).toBeNull();
    expect(birthdayNoon("1990-06-15", "Not/AZone")?.toISOString()).toBe("1990-06-15T12:00:00.000Z");
  });
  it("matches the engine's sidereal sign at that noon", () => {
    const noon = birthdayNoon("1990-06-15", "America/Chicago")!;
    expect(natalSiderealMoon("1990-06-15", "America/Chicago")).toBe(computeTriadMoon(noon).sidereal.sign);
  });
  it("is null with no birthday", () => {
    expect(natalSiderealMoon(null)).toBeNull();
    expect(natalSiderealMoon("")).toBeNull();
  });
});
