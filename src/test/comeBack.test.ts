import { describe, it, expect } from "vitest";
import { comeBackLine } from "../lib/comeBack";
import { blueprintTabPath, defaultBlueprintTab, parseBlueprintTab } from "../lib/blueprintTabs";

describe("Come back tomorrow line", () => {
  const now = new Date("2026-10-21T15:00:00Z"); // 11:00 AM in New York

  it("names the sign and the time in the member's own timezone, for tomorrow's ingress", () => {
    const ingress = new Date("2026-10-22T01:54:00Z"); // 9:54 PM New York, still today
    expect(comeBackLine("Pisces", ingress, now, "America/New_York")).toBe(
      "Come back tomorrow: the Moon enters Pisces today at 9:54 PM."
    );
    const tomorrow = new Date("2026-10-22T14:05:00Z"); // 10:05 AM New York tomorrow
    expect(comeBackLine("Pisces", tomorrow, now, "America/New_York")).toBe(
      "Come back tomorrow: the Moon enters Pisces at 10:05 AM."
    );
  });

  it("uses the weekday when the Moon stays in its sign for a few more days", () => {
    const later = new Date("2026-10-24T18:30:00Z"); // Saturday, 2:30 PM New York
    expect(comeBackLine("Aries", later, now, "America/New_York")).toBe(
      "Come back tomorrow: the Moon enters Aries on Saturday at 2:30 PM."
    );
  });

  it("follows the member's calendar, not UTC", () => {
    const ingress = new Date("2026-10-22T03:30:00Z"); // 8:30 PM Oct 21 in Los Angeles, Oct 22 in UTC
    expect(comeBackLine("Leo", ingress, now, "America/Los_Angeles")).toBe("Come back tomorrow: the Moon enters Leo today at 8:30 PM.");
    expect(comeBackLine("Leo", ingress, now, "UTC")).toBe("Come back tomorrow: the Moon enters Leo at 3:30 AM.");
  });

  it("falls back to UTC for an unknown timezone", () => {
    expect(comeBackLine("Leo", new Date("2026-10-22T03:30:00Z"), now, "Not/AZone")).toContain("3:30 AM");
  });
});

describe("Blueprint tab helpers", () => {
  it("reads only the two tab names", () => {
    expect(parseBlueprintTab("today")).toBe("today");
    expect(parseBlueprintTab("blueprint")).toBe("blueprint");
    expect(parseBlueprintTab("Today")).toBeNull();
    expect(parseBlueprintTab(null)).toBeNull();
  });

  it("opens My Blueprint on the first visit and Today after", () => {
    expect(defaultBlueprintTab(true)).toBe("blueprint");
    expect(defaultBlueprintTab(false)).toBe("today");
  });

  it("builds links emails can use", () => {
    expect(blueprintTabPath("today")).toBe("/blueprint?tab=today");
    expect(blueprintTabPath("blueprint")).toBe("/blueprint?tab=blueprint");
  });
});
