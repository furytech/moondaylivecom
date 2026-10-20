// Single source of truth for public URLs and per-page SEO.
// Pure on purpose (its only import, postText, is pure too): the React pages, the sitemap generator and the
// build-time prerender all use it, so the served HTML and the JS-rendered head can't drift.
//
// URL policy: every URL is absolute, lowercase, has no trailing slash and no query or hash.

import { excerptFromContent, localizeUtcTimes, openingParagraph, repeatsTitle } from "./postText.js";

export const SITE_URL = "https://moondaylive.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const BRAND_SUFFIX = "Moonday Live";

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

/** "/Blog/Transits/Foo/?x=1#top" -> "/blog/transits/foo". Root stays "/". */
export function normalizePath(input: string): string {
  let path = (input || "/").split("#")[0].split("?")[0];
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep the raw path if it has a malformed escape
  }
  path = path.toLowerCase().trim().replace(/\s+/g, "-").replace(/\/{2,}/g, "/");
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path || "/";
}

/** Absolute canonical URL for a path (normalised). */
export function canonicalUrl(path: string): string {
  const p = normalizePath(path);
  return p === "/" ? `${SITE_URL}/` : `${SITE_URL}${p}`;
}

export function categoryPath(cat: string): string {
  return (cat || "Guides").trim().toLowerCase().replace(/\s+/g, "-");
}

/** The one public path form for a blog post. Never build /blog/... URLs any other way. */
export function blogPostPath(category: string | null | undefined, slug: string): string {
  return `/blog/${categoryPath(category || "Guides")}/${slug.trim().toLowerCase()}`;
}

export function blogPostUrl(category: string | null | undefined, slug: string): string {
  return `${SITE_URL}${blogPostPath(category, slug)}`;
}

// ---------------------------------------------------------------------------
// Static pages
// ---------------------------------------------------------------------------

export interface PageSeo {
  path: string;
  title: string;
  description: string;
  /** false = served with noindex, kept out of the sitemap. */
  indexable: boolean;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: string;
  ogType?: string;
}

export const PAGES: PageSeo[] = [
  {
    path: "/",
    title: "Moon Sign & Daily Lunar Guidance | Moonday Live",
    description:
      "Ever wonder why today feels different? The Moon's 2.5-day cycle shapes your emotional climate. Discover your moon sign — free. Daily lunar guidance.",
    indexable: true, changefreq: "daily", priority: "1.0",
  },
  {
    path: "/pulse",
    title: "Today's Moon Sign & Phase — Live Now | Moonday Live",
    description:
      "Ever wonder why today feels different? The Moon's 2.5-day cycle shapes your emotional climate. Today's live moon sign & phase — free.",
    indexable: true, changefreq: "daily", priority: "0.9",
  },
  {
    path: "/moon-sign-horoscope",
    title: "Moon Sign Horoscope — Daily Lunar Reading | Moonday Live",
    description:
      "Your moon sign horoscope, refreshed with every lunar transit. Read today's emotional climate through the moon sign you were born under.",
    indexable: true, changefreq: "daily", priority: "0.9",
  },
  {
    path: "/lunar-climate",
    title: "Daily Lunar Climate — Read Today's Moon Weather | Moonday Live",
    description:
      "The daily lunar climate is the emotional weather the Moon creates as it moves through the zodiac. Read today's lunar climate, live.",
    indexable: true, changefreq: "daily", priority: "0.9",
  },
  {
    path: "/lunar-cycle-tracking",
    title: "Lunar Cycle Tracking — The Great Cycle, Daily | Moonday Live",
    description:
      "Lunar cycle tracking translates the Moon's 29.5-day journey into daily guidance for Mind, Soul, and Body. Follow the Great Cycle, live.",
    indexable: true, changefreq: "weekly", priority: "0.8",
  },
  {
    path: "/birthday-moon-phase",
    title: "Birthday Moon Phase Calculator — Free Moon Sign Lookup",
    description:
      "Free birthday moon phase calculator: enter your birth date to find the exact moon phase and moon sign you were born under. Instant result, no signup.",
    indexable: true, changefreq: "monthly", priority: "0.9",
  },
  {
    path: "/library",
    title: "Moon Sign Meanings — All 12 Zodiac Signs | Moonday Live",
    description:
      "What your moon sign means: explore all twelve zodiac moon signs — symbolism, emotional rhythm, and ritual for each.",
    indexable: true, changefreq: "weekly", priority: "0.8",
  },
  {
    path: "/blog",
    title: "Lunar Insights & Guides — Moonday Live Blog",
    description:
      "Guides, transits, features, and product updates from Moonday Live — the unified, ad-free lunar tracking dashboard.",
    indexable: true, changefreq: "daily", priority: "0.9",
  },
  {
    path: "/pricing",
    title: "Moon Sign Horoscope & Daily Forecast Pricing | Moonday Live",
    description:
      "Unlock precise astrology without a birth time. Get your daily moon sign horoscope, full Lunar Library, and personal blueprint. Luminary Tier from $6.88/month.",
    indexable: true, changefreq: "monthly", priority: "0.9",
  },
  {
    path: "/about",
    title: "About Moonday Live — Moon Sign & Lunar Guidance",
    description:
      "Modern moon sign astrology and lunar guidance — translating the Great Cycle into rituals for Mind, Soul, and Body.",
    indexable: true, changefreq: "monthly", priority: "0.7",
  },
  {
    path: "/faq",
    title: "FAQ — Moonday Live",
    description:
      "Answers about your Lunar Signature, the Luminary Tier, billing, cancellations, and how Moonday guides your Great Cycle.",
    indexable: true, changefreq: "monthly", priority: "0.7",
  },
  {
    path: "/contact",
    title: "Contact Moonday Live — Support & Inquiries",
    description:
      "Reach the Moonday Live concierge for account help, billing, or partnership inquiries. We respond within 48 hours.",
    indexable: true, changefreq: "yearly", priority: "0.6",
  },
  {
    path: "/privacy",
    title: "Privacy Policy — Moonday Live",
    description:
      "How Moonday Live collects, uses, and protects your personal and birth data — written plainly.",
    indexable: true, changefreq: "yearly", priority: "0.4",
  },
  {
    path: "/terms",
    title: "Terms of Service — Moonday Live",
    description:
      "The terms governing your use of Moonday Live, the Luminary Tier subscription, and account responsibilities.",
    indexable: true, changefreq: "yearly", priority: "0.4",
  },
  {
    path: "/refund",
    title: "Refund & Cancellation Policy — Moonday Live",
    description:
      "How cancellations, renewals, and refunds are handled for the Moonday Live Luminary Tier subscription.",
    indexable: true, changefreq: "yearly", priority: "0.4",
  },
  {
    path: "/disclaimer",
    title: "Disclaimer — Moonday Live",
    description:
      "Moonday Live is provided for entertainment and personal reflection only — not medical, legal, or financial advice.",
    indexable: true, changefreq: "yearly", priority: "0.4",
  },
  {
    path: "/triad-preview",
    title: "Your Triad — Forces Shaping Your Path",
    description:
      "Preview the cosmic forces that structure your nature: The Luminary and The Tide. Unlock the full Triad with Luminary.",
    indexable: true,
  },
  // Reachable without signing in, but kept out of search results.
  {
    path: "/login",
    title: "Sign In — Moonday Live",
    description: "Sign in to your Moonday Live blueprint and continue your lunar journey.",
    indexable: false,
  },
  {
    path: "/find-my-moon-sign",
    title: "Find Your Moon Sign — Moonday Live",
    description: "Enter your birthday and see your Sun and Moon sign right away. No account and no birth time needed.",
    indexable: false,
  },
  {
    path: "/signup",
    title: "Create Your Account — Moonday Live",
    description: "Create your free Moonday Live account with just an email and a password. Your birthday is already saved.",
    indexable: false,
  },
  {
    path: "/transition-quiz",
    title: "Moon-change birthday — Find Your True Moon",
    description: "A five-question Moon quiz for people born on a day the Moon changed signs.",
    indexable: false,
  },
];

export function pageSeo(path: string): PageSeo & { canonical: string; noindex: boolean } {
  const key = normalizePath(path);
  const page = PAGES.find((p) => p.path === key);
  if (!page) throw new Error(`seo: no page registered for ${key}`);
  return { ...page, canonical: canonicalUrl(page.path), noindex: !page.indexable };
}

// ---------------------------------------------------------------------------
// Per-sign pages
// ---------------------------------------------------------------------------

export const libraryPagePath = (sign: string) => `/library/${sign.toLowerCase()}-moon`;
export const transitPagePath = (sign: string) => `/transit/${sign.toLowerCase()}`;

export function buildTransitPageSeo(sign: string) {
  return {
    path: transitPagePath(sign),
    canonical: canonicalUrl(transitPagePath(sign)),
    title: `Moon in ${sign} Transit — What It Means Today | ${BRAND_SUFFIX}`,
    description: `Discover the emotional and somatic resonance of Moon in ${sign}. Read today's transit guidance, daily ritual, and astrological FAQs at Moonday Live.`,
  };
}

// ---------------------------------------------------------------------------
// Blog posts
// ---------------------------------------------------------------------------

export interface PostSeoInput {
  slug: string;
  category: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  /** ISO timestamp the post went live (published_at, falling back to publish_at). */
  date?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-16T12:56:58Z" -> "Oct 16, 2026" (UTC, so server and browser agree). */
export function shortDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:—-]+$/, "")}…`;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** First real paragraph of a markdown body, as plain text (a repeated title is skipped, UTC times shown in ET). */
export function firstParagraph(markdown: string, title?: string | null, refDate?: string | null): string {
  return localizeUtcTimes(openingParagraph(markdown, title), null, refDate).replace(/\s+/g, " ").trim();
}

/**
 * Title and description for a blog post. Transit posts for the same sign share a headline, so
 * the go-live date is part of the title and the description comes from the post's own opening.
 */
export function buildPostSeo(post: PostSeoInput) {
  const path = blogPostPath(post.category, post.slug);
  const canonical = `${SITE_URL}${path}`;
  const date = shortDate(post.date);
  const headline = (post.title || "").trim();

  let title: string;
  if (post.metaTitle?.trim()) {
    title = post.metaTitle.trim();
  } else if (post.category === "Transits" && date) {
    const short = headline.split(":")[0].trim() || headline;
    title = `${short}: ${date} — ${BRAND_SUFFIX}`;
  } else {
    title = `${clip(headline, 55)} — ${BRAND_SUFFIX}`;
  }

  // A stored meta description or excerpt that just repeats the title (older transit posts) is no description.
  const usable = (text?: string | null, min = 1) => {
    const t = (text || "").trim();
    return t.length >= min && !repeatsTitle(t, headline) ? t : "";
  };
  const description =
    usable(post.metaDescription) ||
    usable(post.excerpt, 60) ||
    excerptFromContent(post.content, headline, 155, post.date) ||
    firstParagraph(post.content || "", headline, post.date) ||
    headline;

  return { path, canonical, title, description: clip(localizeUtcTimes(description, null, post.date), 155) };
}

/**
 * Which sign a transit post belongs to, read from its slug ("the-moon-enters-aquarius-...").
 * Used to send removed transit posts to /transit/<sign>. Returns null when no sign is named.
 */
export function transitSignFromSlug(slug: string): (typeof ZODIAC_SIGNS)[number] | null {
  const s = (slug || "").toLowerCase();
  const entered = s.match(/moon-enters-([a-z]+)/)?.[1];
  const byEntry = ZODIAC_SIGNS.find((z) => z.toLowerCase() === entered);
  if (byEntry) return byEntry;
  return ZODIAC_SIGNS.find((z) => s.split("-").includes(z.toLowerCase())) ?? null;
}

/** Breadcrumb trail for structured data. Every item is a real, indexable URL (no ?category= filters). */
export function buildPostBreadcrumb(post: { title: string; canonical: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: canonicalUrl("/") },
      { "@type": "ListItem", position: 2, name: "Blog", item: canonicalUrl("/blog") },
      { "@type": "ListItem", position: 3, name: post.title, item: post.canonical },
    ],
  };
}

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

export interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: string;
}

export interface SitemapPost {
  slug: string;
  category: string;
  published_at?: string | null;
  updated_at?: string | null;
}

/** Indexable pages only: no noindex routes, no redirects, no private pages. */
export function buildSitemapEntries(posts: SitemapPost[]): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  for (const p of PAGES) {
    if (!p.indexable || !p.priority) continue;
    entries.push({ path: p.path, changefreq: p.changefreq, priority: p.priority });
    if (p.path === "/library") {
      for (const sign of ZODIAC_SIGNS) {
        entries.push({ path: libraryPagePath(sign), changefreq: "monthly", priority: "0.8" });
      }
    }
  }
  for (const sign of ZODIAC_SIGNS) {
    entries.push({ path: transitPagePath(sign), changefreq: "daily", priority: "0.8" });
  }
  const seen = new Set<string>();
  for (const p of posts) {
    if (!p.slug) continue;
    const path = blogPostPath(p.category, p.slug);
    if (seen.has(path)) continue;
    seen.add(path);
    const stamp = p.updated_at || p.published_at || null;
    entries.push({ path, lastmod: stamp ? stamp.slice(0, 10) : undefined, changefreq: "monthly", priority: "0.8" });
  }
  return entries;
}

export function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${canonicalUrl(e.path)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean).join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

/** Sign artwork used as the social image for a post, when the post has a sign tag. */
export function signOgImage(tag?: string | null): string | undefined {
  const wanted = (tag || "").trim().toLowerCase();
  const sign = ZODIAC_SIGNS.find((s) => s.toLowerCase() === wanted);
  return sign ? `${SITE_URL}/assets/signs/${sign}.png` : undefined;
}

/** Props for <SEO /> on a registered static page, so the component and the prerender share one source. */
export function seoProps(path: string) {
  const { title, description, canonical, noindex } = pageSeo(path);
  return { title, description, canonical, noindex };
}
