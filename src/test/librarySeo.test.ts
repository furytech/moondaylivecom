import { describe, it, expect } from "vitest";
import { libraryArticles } from "@/content/library";
import { LIBRARY_SIGNS, buildSignSeo, signFromSlug, libraryPath } from "@/lib/librarySeo";

describe("Library per-sign SEO", () => {
  it("maps slugs to signs and rejects junk", () => {
    expect(signFromSlug("cancer-moon")).toBe("Cancer");
    expect(signFromSlug("cancer")).toBeNull();
    expect(signFromSlug("ophiuchus-moon")).toBeNull();
    expect(libraryPath("Cancer")).toBe("/library/cancer-moon");
  });

  it("builds title, h1, canonical and a unique ~150 char description for all 12", () => {
    const descriptions = new Set<string>();
    for (const sign of LIBRARY_SIGNS) {
      const seo = buildSignSeo(sign);
      expect(seo.h1).toMatch(new RegExp(`^${sign} Moon: The `));
      // Signs with a long-form article carry their own title; the rest use the generic pattern.
      if (!libraryArticles[sign]) expect(seo.title).toBe(`${sign} Moon Sign Meaning: ${seo.h1.split(": ")[1]} | Moonday Live`);
      expect(seo.url).toBe(`https://moondaylive.com/library/${sign.toLowerCase()}-moon`);
      expect(seo.description.length).toBeGreaterThan(80);
      expect(seo.description.length).toBeLessThanOrEqual(155);
      descriptions.add(seo.description);
    }
    expect(descriptions.size).toBe(12);
  });

  it("emits Article and a 3-question FAQPage", () => {
    const seo = buildSignSeo("Aries");
    const [article, faq] = seo.schema as any[];
    expect(article["@type"]).toBe("Article");
    expect(faq["@type"]).toBe("FAQPage");
    expect(faq.mainEntity.map((q: any) => q.name)).toEqual([
      "What does a Aries Moon mean?",
      "What are Aries Moon strengths?",
      "What is the Aries Moon shadow?",
    ]);
  });

  it("Cancer, the model page, carries its own title and a 5-question FAQPage", () => {
    const seo = buildSignSeo("Cancer");
    expect(seo.title).toBe("Cancer Moon Meaning: Emotions, Love and Needs | Moonday Live");
    const faq = (seo.schema as any[])[1];
    expect(faq.mainEntity).toHaveLength(5);
    expect(faq.mainEntity[0].name).toBe("What does a Cancer Moon mean?");
  });
});
