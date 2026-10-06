import { describe, it, expect } from "vitest";
import { getFAQsBySlug, transitFAQs } from "@/data/transitFAQs";

describe("transitFAQs dataset and helpers", () => {
  it("contains complete FAQ entries for all 12 zodiac signs", () => {
    expect(transitFAQs.length).toBe(12);

    for (const signData of transitFAQs) {
      expect(signData.sign).toBeDefined();
      expect(signData.slug).toBeDefined();
      expect(signData.faqs.length).toBe(3);
      for (const faq of signData.faqs) {
        expect(faq.question).toBeTruthy();
        expect(faq.answer).toBeTruthy();
      }
    }
  });

  it("retrieves FAQs by slug and sign name case-insensitively", () => {
    const ariesFaqs = getFAQsBySlug("aries");
    expect(ariesFaqs.length).toBe(3);
    expect(ariesFaqs[0].question).toContain("Moon in Aries");

    const leoFaqs = getFAQsBySlug("Leo");
    expect(leoFaqs.length).toBe(3);
    expect(leoFaqs[0].question).toContain("Moon in Leo");

    const piscesFaqs = getFAQsBySlug("PISCES");
    expect(piscesFaqs.length).toBe(3);
    expect(piscesFaqs[0].question).toContain("Moon in Pisces");
  });

  it("returns empty array for invalid slug", () => {
    expect(getFAQsBySlug("unknown-sign")).toEqual([]);
  });

  it("calculates correct neighboring signs in the zodiac wheel", () => {
    const ZODIAC_ORDER = [
      "aries", "taurus", "gemini", "cancer", "leo", "virgo",
      "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
    ];

    function getNeighbors(slug: string) {
      const idx = ZODIAC_ORDER.indexOf(slug.toLowerCase());
      const prev = ZODIAC_ORDER[(idx - 1 + 12) % 12];
      const next = ZODIAC_ORDER[(idx + 1) % 12];
      return { prev, next };
    }

    expect(getNeighbors("aries")).toEqual({ prev: "pisces", next: "taurus" });
    expect(getNeighbors("leo")).toEqual({ prev: "cancer", next: "virgo" });
    expect(getNeighbors("pisces")).toEqual({ prev: "aquarius", next: "aries" });
  });

  it("generates valid FAQPage JSON-LD structure", () => {
    const faqs = getFAQsBySlug("taurus");
    const faqPageSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    };

    expect(faqPageSchema["@type"]).toBe("FAQPage");
    expect(faqPageSchema.mainEntity.length).toBe(3);
    expect(faqPageSchema.mainEntity[0].name).toBe("What does Moon in Taurus mean?");
    expect(faqPageSchema.mainEntity[0].acceptedAnswer.text).toContain("strongest placement");
  });
});
