import { describe, expect, it, vi } from "vitest";
import { findPortalProfile, isPaidProfile } from "../../supabase/functions/_shared/portalProfile";
import { readFileSync } from "node:fs";

const paid = { subscription_status: "sovereign", is_subscriber: true };

const lookup = (byUser: any, byMail: any = { data: null }) => ({
  byUserId: vi.fn(async () => byUser),
  byEmail: vi.fn(async () => byMail),
});

describe("customer-portal profile lookup", () => {
  it("matches by user_id (the link to auth.users) and never needs the email fallback", async () => {
    const l = lookup({ data: paid });
    expect(await findPortalProfile(l, "851263e9", "m@x.com")).toEqual(paid);
    expect(l.byUserId).toHaveBeenCalledWith("851263e9");
    expect(l.byEmail).not.toHaveBeenCalled();
  });

  it("falls back to email only when user_id finds no row", async () => {
    const l = lookup({ data: null }, { data: paid });
    expect(await findPortalProfile(l, "u", "m@x.com")).toEqual(paid);
    expect(l.byEmail).toHaveBeenCalledWith("m@x.com");
  });

  it("returns null when neither matches", async () => {
    expect(await findPortalProfile(lookup({ data: null }), "u", "m@x.com")).toBeNull();
    expect(await findPortalProfile(lookup({ data: null }), "u", undefined)).toBeNull();
  });

  it("a failed query is an error, not 'no profile' (the live bug: a missing column made it look empty)", async () => {
    const err = { data: null, error: "column user_profiles.stripe_customer_id does not exist" };
    await expect(findPortalProfile(lookup(err), "u", "m@x.com")).rejects.toThrow(/does not exist/);
    await expect(findPortalProfile(lookup({ data: null }, err), "u", "m@x.com")).rejects.toThrow(/does not exist/);
  });
});

describe("isPaidProfile", () => {
  it("accepts sovereign, luminary (any case) and is_subscriber", () => {
    expect(isPaidProfile({ subscription_status: "sovereign", is_subscriber: false })).toBe(true);
    expect(isPaidProfile({ subscription_status: "Luminary", is_subscriber: false })).toBe(true);
    expect(isPaidProfile({ subscription_status: "free", is_subscriber: true })).toBe(true);
  });
  it("rejects free and missing profiles", () => {
    expect(isPaidProfile({ subscription_status: "free", is_subscriber: false })).toBe(false);
    expect(isPaidProfile(null)).toBe(false);
  });
});

describe("customer-portal source", () => {
  const src = readFileSync("supabase/functions/customer-portal/index.ts", "utf8");
  it("does not select a column user_profiles does not have", () => {
    expect(src).not.toContain("stripe_customer_id");
  });
});
