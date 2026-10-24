import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  decideSettle,
  SETTLE_WINDOW_MS,
} from "../../supabase/functions/_shared/pendingMoonSignRules";

const invoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));

import {
  loadPendingMoonSign,
  nextStepForMember,
  savePendingMoonSign,
  savePendingMoonSignRemote,
} from "../lib/pendingMoonSign";

const NOW = Date.parse("2026-10-24T13:10:00Z");
const freshUser = { created_at: "2026-10-24T13:04:43Z", email_confirmed_at: null };
const emptyProfile = { birthday: "1992-02-07", moon_sign: null, natal_moon_sign: null };

describe("Moon-change signup: confirming in a fresh browser", () => {
  beforeEach(() => {
    invoke.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("the quiz result is sent to the server before confirmation", async () => {
    invoke.mockResolvedValue({ data: { saved: true }, error: null });
    expect(await savePendingMoonSignRemote("adeef46d-3e18-425e-a65c-16e278faad05", "Pisces")).toBe(true);
    expect(invoke).toHaveBeenCalledWith("save-pending-moon-sign", {
      body: { userId: "adeef46d-3e18-425e-a65c-16e278faad05", sign: "Pisces" },
    });
  });

  it("falls back quietly (browser copy only) when there is no id or the server fails", async () => {
    expect(await savePendingMoonSignRemote(undefined, "Pisces")).toBe(false);
    invoke.mockRejectedValue(new Error("offline"));
    expect(await savePendingMoonSignRemote("adeef46d-3e18-425e-a65c-16e278faad05", "Pisces")).toBe(false);
  });

  it("fresh browser, sign saved on the server: the member stays on their next step (no quiz again)", () => {
    expect(loadPendingMoonSign()).toBeNull(); // nothing in this browser's storage
    const profile = { birthday: "1992-02-07", moon_sign: "Pisces", natal_moon_sign: "Pisces" };
    expect(nextStepForMember(profile, loadPendingMoonSign())).toBe("stay");
  });

  it("fresh browser, nothing saved anywhere: the quiz is the only option left", () => {
    expect(nextStepForMember(emptyProfile, loadPendingMoonSign())).toBe("quiz");
  });

  it("same browser, only the local copy: it is applied when the birthday matches, not for another birthday", () => {
    savePendingMoonSign({ birthday: "1992-02-07", sign: "Pisces" });
    expect(nextStepForMember(emptyProfile, loadPendingMoonSign())).toBe("apply-pending");
    expect(nextStepForMember({ ...emptyProfile, birthday: "1992-02-08T00:00:00" }, loadPendingMoonSign())).toBe("quiz");
  });

  it("a profile without a birthday never redirects to the quiz", () => {
    expect(nextStepForMember({ birthday: null, moon_sign: null, natal_moon_sign: null }, null)).toBe("stay");
    expect(nextStepForMember(null, null)).toBe("stay");
  });
});

describe("save-pending-moon-sign rules", () => {
  it("saves a valid sign on a fresh, unconfirmed account with a birthday", () => {
    expect(decideSettle("Pisces", freshUser, emptyProfile, NOW)).toBe("ok");
  });

  it("rejects anything that is not a zodiac sign", () => {
    for (const bad of ["pisces", "", "Ophiuchus", null, 7, undefined]) expect(decideSettle(bad, freshUser, emptyProfile, NOW)).toBe("bad_sign");
  });

  it("never overwrites a saved sign (signs and birthdays stay locked)", () => {
    expect(decideSettle("Aries", freshUser, { ...emptyProfile, moon_sign: "Pisces" }, NOW)).toBe("already_set");
    expect(decideSettle("Aries", freshUser, { ...emptyProfile, natal_moon_sign: "Pisces" }, NOW)).toBe("already_set");
  });

  it("does not act on confirmed, old, unknown or birthday-less accounts", () => {
    expect(decideSettle("Aries", { ...freshUser, email_confirmed_at: "2026-10-24T13:06:01Z" }, emptyProfile, NOW)).toBe("confirmed");
    expect(decideSettle("Aries", freshUser, emptyProfile, Date.parse(freshUser.created_at) + SETTLE_WINDOW_MS + 1)).toBe("expired");
    expect(decideSettle("Aries", null, emptyProfile, NOW)).toBe("no_account");
    expect(decideSettle("Aries", freshUser, null, NOW)).toBe("no_account");
    expect(decideSettle("Aries", freshUser, { ...emptyProfile, birthday: null }, NOW)).toBe("no_birthday");
  });
});

import { EclipticGeoMoon, AstroTime } from "astronomy-engine";
import { validMoonSigns } from "../../supabase/functions/_shared/cuspSigns";
import { getLocalCuspDay } from "../lib/cuspDay";

const lon = (ms: number) => EclipticGeoMoon(new AstroTime(new Date(ms))).lon;

describe("save-pending-moon-sign: sign must be valid for the birth date", () => {
  it("a Moon-change birthday (Feb 7, 1992, New York) accepts exactly its two signs", () => {
    const signs = validMoonSigns("1992-02-07", "America/New_York", lon);
    expect(signs).toEqual(["Pisces", "Aries"]);
    expect(decideSettle("Pisces", freshUser, emptyProfile, NOW, signs)).toBe("ok");
    expect(decideSettle("Aries", freshUser, emptyProfile, NOW, signs)).toBe("ok");
  });

  it("rejects any other sign for that birthday, even a real zodiac sign", () => {
    const signs = validMoonSigns("1992-02-07", "America/New_York", lon);
    for (const other of ["Taurus", "Gemini", "Aquarius", "Leo"]) {
      expect(decideSettle(other, freshUser, emptyProfile, NOW, signs)).toBe("wrong_sign_for_birthday");
    }
  });

  it("an ordinary day has a single valid sign", () => {
    const signs = validMoonSigns("1992-02-08", "America/New_York", lon);
    expect(signs).toHaveLength(1);
    expect(decideSettle(signs[0], freshUser, emptyProfile, NOW, signs)).toBe("ok");
  });

  it("agrees with the app's own getLocalCuspDay across zones and dates", () => {
    for (const tz of ["America/New_York", "Pacific/Auckland", "UTC", "Asia/Kolkata", "America/Los_Angeles"]) {
      for (const bd of ["1992-02-07", "1985-07-19", "2001-11-30", "1999-03-01", "2010-12-25"]) {
        const app = getLocalCuspDay(bd, tz);
        const expected = app.from === app.to ? [app.from] : [app.from, app.to];
        expect(validMoonSigns(bd, tz, lon)).toEqual(expected);
      }
    }
  });
});
