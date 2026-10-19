// Pure helpers for the per-sign Library pages (/library/[sign]-moon).
// Shared by the React page and the build-time prerender script, so keep it free of browser APIs.
import { zodiacDeepContent } from "@/lib/zodiacDeepContent";
import { moonSignDeepDiveContent } from "@/lib/moonSignContent";
import { libraryArticles } from "@/content/library";

export const SITE_URL = "https://moondaylive.com";

export const LIBRARY_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export const signSlug = (sign: string) => `${sign.toLowerCase()}-moon`;
export const libraryPath = (sign: string) => `/library/${signSlug(sign)}`;
export const transitPath = (sign: string) => `/transit/${sign.toLowerCase()}`;

/** "cancer-moon" -> "Cancer"; anything else -> null. */
export function signFromSlug(slug: string | undefined): string | null {
  const match = /^([a-z]+)-moon$/.exec((slug || "").toLowerCase());
  if (!match) return null;
  return LIBRARY_SIGNS.find((s) => s.toLowerCase() === match[1]) ?? null;
}

function clip(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:—-]+$/, "")}…`;
}

export function buildSignSeo(sign: string) {
  const deep = zodiacDeepContent[sign];
  const dive = moonSignDeepDiveContent[sign];
  const archetype = dive?.archetype ?? "";
  const url = `${SITE_URL}${libraryPath(sign)}`;
  const h1 = archetype ? `${sign} Moon: ${archetype}` : `${sign} Moon`;
  const article = libraryArticles[sign];
  const title = article?.seoTitle ?? (archetype
    ? `${sign} Moon Sign Meaning: ${archetype} | Moonday Live`
    : `${sign} Moon Sign Meaning | Moonday Live`);
  const description = article?.seoDescription ?? clip(`${sign} Moon meaning: ${deep.essence.poetry}`, 155);

  const faqs = article?.faqs ?? [
    { question: `What does a ${sign} Moon mean?`, answer: dive.overview },
    {
      question: `What are ${sign} Moon strengths?`,
      answer: `${sign} Moon strengths: ${dive.strengths.join("; ")}.`,
    },
    { question: `What is the ${sign} Moon shadow?`, answer: deep.shadow.rawTruth },
  ];

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: h1,
      description,
      url,
      mainEntityOfPage: url,
      image: `${SITE_URL}/og-image.png`,
      author: { "@type": "Organization", name: "Moonday Live", url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: "Moonday Live",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/moonday-logo.png` },
      },
      about: { "@type": "Thing", name: `${sign} Moon` },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];

  return { sign, h1, title, description, url, faqs, schema };
}
