import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  excerptFromContent,
  formatInstant,
  formatLocalDate,
  localizeUtcTimes,
  repeatsTitle,
  stripLeadingTitle,
} from "@/lib/postText";
import { buildPostSeo } from "@/lib/seo";

const TITLE = "The Moon Enters Aquarius: What to Feel, Notice, and Release";

describe("repeated titles", () => {
  it("detects exact and near matches but not real sentences", () => {
    expect(repeatsTitle(TITLE, TITLE)).toBe(true);
    expect(repeatsTitle(`**${TITLE}**`, TITLE)).toBe(true);
    expect(repeatsTitle("The Moon Enters Aquarius: What to Feel, Notice and Release", TITLE)).toBe(true);
    expect(repeatsTitle("The Moon slips into Aquarius on Sunday evening and the mood loosens.", TITLE)).toBe(false);
  });

  it("strips a leading heading or bold title only", () => {
    expect(stripLeadingTitle(`# ${TITLE}\n\nOpening.`, TITLE)).toBe("Opening.");
    expect(stripLeadingTitle(`**${TITLE}**\n\nOpening.`, TITLE)).toBe("Opening.");
    expect(stripLeadingTitle(`\n## ${TITLE}\nOpening.`, TITLE)).toBe("Opening.");
    expect(stripLeadingTitle("Opening.\n\n## Section", TITLE)).toBe("Opening.\n\n## Section");
    expect(stripLeadingTitle(`Opening.\n\n# ${TITLE}`, TITLE)).toContain(TITLE);
  });
});

describe("local times", () => {
  it("formats an instant in a zone, with ET as the fallback", () => {
    expect(formatInstant("2026-10-19T01:39:50Z", "America/New_York")).toBe("Sunday, Oct 18 at 9:39 PM");
    expect(formatInstant("2026-10-19T01:39:50Z")).toBe("Sunday, Oct 18 at 9:39 PM ET");
    expect(formatInstant("2026-10-19T01:39:50Z", "Europe/Paris")).toBe("Monday, Oct 19 at 3:39 AM");
    expect(formatInstant("2026-10-19T01:39:50Z", "UTC")).toBe("Monday, Oct 19 at 1:39 AM UTC");
  });

  it("rewrites UTC stamps in prose and leaves everything else alone", () => {
    const text = "It lands 2026-10-19 at 01:39:50 UTC. Also 2026-09-19T04:54:44.237Z UTC and a plain 2026-10-19 date.";
    expect(localizeUtcTimes(text)).toBe(
      "It lands Sunday, Oct 18 at 9:39 PM ET. Also Saturday, Sep 19 at 12:54 AM ET and a plain 2026-10-19 date.",
    );
    expect(localizeUtcTimes(text, "America/Los_Angeles")).toContain("Sunday, Oct 18 at 6:39 PM.");
  });

  it("shows the visible date in the same zone as the time", () => {
    expect(formatLocalDate("2026-10-19T01:39:50Z", "America/New_York")).toBe("October 18, 2026");
    expect(formatLocalDate("2026-10-19T01:39:50Z")).toBe("October 18, 2026");
  });
});

describe("excerpts and descriptions", () => {
  const body =
    "At 2026-10-19 at 01:39:50 UTC the Moon moves into Aquarius, and the mood loosens. Plans feel optional for a day or two. Nothing here is a forecast.\n\n## Practical heads-up\nMore.";

  it("builds a short summary from the opening paragraph, never the title", () => {
    const e = excerptFromContent(`# ${TITLE}\n\n${body}`, TITLE);
    expect(e).not.toContain(TITLE);
    expect(e).toMatch(/^At Sunday, Oct 18 at 9:39 PM ET the Moon moves into Aquarius/);
    expect(e.length).toBeLessThanOrEqual(160);
    expect(e.length).toBeGreaterThan(60);
  });

  it("uses the cleaned opening for meta description when excerpt and meta repeat the title", () => {
    const seo = buildPostSeo({
      slug: "the-moon-enters-aquarius-2026-10-19",
      category: "Transits",
      title: TITLE,
      excerpt: TITLE,
      metaDescription: TITLE,
      content: `**${TITLE}**\n\n${body}`,
      date: "2026-10-19T01:39:50Z",
    });
    expect(seo.description).not.toContain(TITLE);
    expect(seo.description).toContain("the Moon moves into Aquarius");
    expect(seo.description).not.toMatch(/UTC|01:39/);
  });

  it("keeps the edge-function copy identical", () => {
    const a = readFileSync("src/lib/postText.ts", "utf8");
    const b = readFileSync("supabase/functions/_shared/postText.ts", "utf8");
    expect(b).toBe(a);
  });
});

describe("older timestamp wordings", () => {
  it("localizes dated and bare UTC clocks", () => {
    expect(localizeUtcTimes("on October 14, 2026, at 00:59:19 UTC.")).toBe("on Tuesday, Oct 13 at 8:59 PM ET.");
    expect(localizeUtcTimes("At 12:56 UTC on October 16, 2026, the Moon moves")).toBe("Friday, Oct 16 at 8:56 AM ET, the Moon moves");
    expect(localizeUtcTimes("into Scorpio at 15:21:09 UTC.", null, "2026-10-11T15:21:09Z")).toBe("into Scorpio at 11:21 AM ET.");
    expect(localizeUtcTimes("into Scorpio at 15:21:09 UTC.")).toBe("into Scorpio at 15:21:09 UTC.");
    expect(localizeUtcTimes("at 15:21 UTC", "America/Los_Angeles", "2026-10-11T15:21:09Z")).toBe("at 8:21 AM");
  });

  it("gives a short opening sentence a second one", () => {
    const e = excerptFromContent(
      "The Moon crosses the threshold into Scorpio. The water sign asks for depth over speed, and the first night of the transit tends to feel quieter than the calendar suggests.",
      "T",
    );
    expect(e.length).toBeGreaterThan(110);
    expect(e.length).toBeLessThanOrEqual(160);
  });
});
