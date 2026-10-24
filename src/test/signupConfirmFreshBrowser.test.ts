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
