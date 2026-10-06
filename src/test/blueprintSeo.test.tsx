import { describe, it, expect } from "vitest";

describe("Blueprint SEO hierarchy & structured data logic", () => {
  it("formats dynamic title and meta description based on current and natal signs", () => {
    const currentSign = "Gemini";
    const natalSign = "Cancer";

    const title = `Moon in ${currentSign} Today — What It Means For You | Moonday Live`;
    const description = `The Moon is in ${currentSign}. Discover what this transit means for your ${natalSign} energy today. Get your personalized lunar reading at Moonday Live.`;

    expect(title).toBe("Moon in Gemini Today — What It Means For You | Moonday Live");
    expect(description).toBe(
      "The Moon is in Gemini. Discover what this transit means for your Cancer energy today. Get your personalized lunar reading at Moonday Live."
    );
  });

  it("generates WebApplication and Article structured data for search engines", () => {
    const currentSign = "Scorpio";
    const natalSign = "Aries";
    const todayIso = "2026-10-06";

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          name: "Moonday Live",
          url: "https://moondaylive.com/blueprint",
        },
        {
          "@type": "Article",
          headline: `Moon in ${currentSign} Today — What It Means For You`,
          name: `Moon in ${currentSign} Today`,
          description: `The Moon is in ${currentSign}. Discover what this transit means for your ${natalSign} energy today.`,
          datePublished: todayIso,
          about: {
            "@type": "Thing",
            name: `Moon in ${currentSign}`,
          },
        },
      ],
    };

    const graph = structuredData["@graph"];
    const webApp = graph.find((item) => item["@type"] === "WebApplication");
    const article = graph.find((item) => item["@type"] === "Article");

    expect(webApp).toBeDefined();
    expect(article).toBeDefined();
    expect(article?.name).toBe("Moon in Scorpio Today");
    expect(article?.about.name).toBe("Moon in Scorpio");
    expect(article?.datePublished).toBe(todayIso);
  });
});
