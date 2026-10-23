import { describe, expect, it } from "vitest";
import {
  PAID_STATUS,
  bearerToken,
  decideAccess,
  mergeSubscriptions,
  pickPrimarySubscription,
  profileUpdateFor,
} from "../../supabase/functions/_shared/subscriptionAccess";

const sub = (id: string, status: string, created = 1) => ({ id, status, created });

describe("decideAccess", () => {
  it.each(["active", "trialing", "past_due"])("%s grants access", (status) => {
    expect(decideAccess([sub("s1", status)])).toBe("grant");
  });

  it.each(["unpaid", "canceled", "incomplete_expired"])("%s revokes access", (status) => {
    expect(decideAccess([sub("s1", status)])).toBe("revoke");
  });

  it.each(["incomplete", "paused"])("%s alone leaves access unchanged", (status) => {
    expect(decideAccess([sub("s1", status)])).toBe("unchanged");
  });

  it("revokes when the customer has no subscriptions at all", () => {
    expect(decideAccess([])).toBe("revoke");
  });

  it("any granting subscription wins over a canceled one", () => {
    expect(decideAccess([sub("old", "canceled"), sub("new", "active")])).toBe("grant");
  });

  it("a canceled subscription revokes next to a neutral one", () => {
    expect(decideAccess([sub("a", "incomplete"), sub("b", "canceled")])).toBe("revoke");
  });
});

describe("profileUpdateFor", () => {
  it("writes the 'sovereign' value the app and triad_states policy read", () => {
    expect(PAID_STATUS).toBe("sovereign");
    expect(profileUpdateFor("grant")).toEqual({ is_subscriber: true, subscription_status: "sovereign" });
  });

  it("writes free on revoke and nothing when unchanged", () => {
    expect(profileUpdateFor("revoke")).toEqual({ is_subscriber: false, subscription_status: "free" });
    expect(profileUpdateFor("unchanged")).toBeNull();
  });
});

describe("pickPrimarySubscription", () => {
  it("prefers active over trialing over past_due, newest first", () => {
    const picked = pickPrimarySubscription([
      sub("pd", "past_due", 9),
      sub("tr", "trialing", 8),
      sub("a1", "active", 1),
      sub("a2", "active", 5),
    ]);
    expect(picked?.id).toBe("a2");
    expect(pickPrimarySubscription([sub("pd", "past_due"), sub("tr", "trialing")])?.id).toBe("tr");
  });

  it("returns null when nothing grants", () => {
    expect(pickPrimarySubscription([sub("c", "canceled")])).toBeNull();
  });
});

describe("mergeSubscriptions", () => {
  it("keeps the live copy when the id is present and adds the event's copy when it is not", () => {
    expect(mergeSubscriptions([sub("s1", "active")], sub("s1", "canceled"))).toEqual([sub("s1", "active")]);
    expect(mergeSubscriptions([sub("s1", "active")], sub("s2", "canceled")).map((s) => s.id)).toEqual(["s1", "s2"]);
  });
});

describe("bearerToken", () => {
  it("extracts the token", () => {
    expect(bearerToken("Bearer abc.def")).toBe("abc.def");
    expect(bearerToken("bearer  abc ")).toBe("abc");
  });

  it("returns null for a missing or empty header", () => {
    expect(bearerToken(null)).toBeNull();
    expect(bearerToken(undefined)).toBeNull();
    expect(bearerToken("")).toBeNull();
    expect(bearerToken("Bearer ")).toBeNull();
  });
});
