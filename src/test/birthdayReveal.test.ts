import { describe, it, expect, beforeEach } from "vitest";
import { buildBirthday, isValidBirthday, revealForBirthday } from "../lib/birthdayReveal";
import { getLocalCuspDay } from "../lib/cuspDay";
import { clearSignupDraft, loadSignupDraft, saveSignupDraft } from "../lib/signupDraft";

describe("birthday helpers", () => {
  it("builds a zero-padded birthday only when all three parts are present", () => {
    expect(buildBirthday("1985", "3", "7")).toBe("1985-03-07");
    expect(buildBirthday("1985", "", "7")).toBe("");
  });

  it("accepts real dates and rejects impossible, future and too-old ones", () => {
    const today = new Date(2026, 9, 20);
    expect(isValidBirthday("1985-03-07", today)).toBe(true);
    expect(isValidBirthday("2024-02-29", today)).toBe(true);
    expect(isValidBirthday("2023-02-29", today)).toBe(false);
    expect(isValidBirthday("1985-02-31", today)).toBe(false);
    expect(isValidBirthday("2026-10-21", today)).toBe(false);
    expect(isValidBirthday("2026-10-20", today)).toBe(true);
    expect(isValidBirthday("1899-01-01", today)).toBe(false);
    expect(isValidBirthday("not-a-date", today)).toBe(false);
  });
});

describe("revealForBirthday", () => {
  // The Moon changes sign every ~2.3 days, so ten days in a row hold both kinds of birthday.
  const days = Array.from({ length: 10 }, (_, i) => `1990-06-${String(10 + i).padStart(2, "0")}`);

  it("gives a Moon sign on ordinary days and two candidate signs on Moon-change days", async () => {
    const reveals = await Promise.all(days.map((d) => revealForBirthday(d, "America/New_York")));
    expect(reveals.some((r) => r.isCuspDay)).toBe(true);
    expect(reveals.some((r) => !r.isCuspDay)).toBe(true);

    reveals.forEach((r, i) => {
      const day = getLocalCuspDay(days[i], "America/New_York");
      expect(r.isCuspDay).toBe(day.isCuspDay);
      expect(r.sunSign).toBe("Gemini");
      if (r.isCuspDay) {
        // never silently pick one: the quiz settles it
        expect(r.moonSign).toBeNull();
        expect(r.cuspSigns).toEqual([day.from, day.to]);
      } else {
        expect(r.cuspSigns).toBeNull();
        expect(r.moonSign).toBe(day.from);
      }
    });
  });
});

describe("signup draft", () => {
  beforeEach(() => clearSignupDraft());

  it("round-trips and clears", () => {
    expect(loadSignupDraft()).toBeNull();
    saveSignupDraft({ birthday: "1985-03-07", timezone: "America/Chicago", moonSign: "Libra" });
    expect(loadSignupDraft()).toMatchObject({ birthday: "1985-03-07", timezone: "America/Chicago", moonSign: "Libra" });
    clearSignupDraft();
    expect(loadSignupDraft()).toBeNull();
  });

  it("ignores a draft with a broken birthday", () => {
    sessionStorage.setItem(
      "moonday:signupDraft",
      JSON.stringify({ birthday: "1985-02-31", timezone: "UTC", moonSign: "Leo" })
    );
    expect(loadSignupDraft()).toBeNull();
  });
});
