export type BlogCategory = "Guides" | "Transits" | "Features" | "Product Updates";

export interface BlogPost {
  slug: string;
  title: string;
  category: BlogCategory;
  excerpt: string;
  author: string;
  date: string; // ISO
  readMinutes: number;
  keywords: string[];
  featured?: boolean;
  /** Markdown-lite content. Supports: `## `, `### `, `> `, `- `, blank lines, and `[[callout:label|href]]`. */
  content: string;
}

export const CATEGORIES: BlogCategory[] = ["Guides", "Transits", "Features", "Product Updates"];

export const POSTS: BlogPost[] = [
  {
    slug: "unified-daily-moon-tracker",
    title:
      "Got Tired of Switching Between 3 Different Sites Just to Track the Moon — So I Built a Unified Daily Tool",
    category: "Guides",
    excerpt:
      "The moon-tracking web is fragmented — astronomy here, astrology there, birth charts somewhere else. Here's how Moonday Live pulls it into one ad-free dashboard.",
    author: "Moonday Live Team",
    date: "2026-07-22",
    readMinutes: 4,
    keywords: [
      "moon tracker",
      "daily moon",
      "moon phase",
      "moon sign",
      "birth chart",
      "lunar dashboard",
    ],
    featured: true,
    content: `If you track the moon daily, you've probably noticed how fragmented the tools are across the web.

- The astronomical sites give you exact live phase tracking and illumination, but zero context on astrology or sign placements.
- The legacy astrology sites give you sign interpretations, but their UI is stuck in the early 2000s, packed with ad banners, and rarely offer live visual phase data or personalization.
- The birth chart tools sit somewhere else entirely, making it clunky to compare your personal natal phase against the active sky.

We built Moonday Live to solve this exact fragmentation into one unified, ad-free experience.

## What Moonday Live Brings Together in One Dashboard

[[tiles:1. Live Phase & Astronomical Precision||Real-time visual phase tracking and illumination without digging through clunky tables. The current phase, sign, and illumination update seamlessly as the sky changes—no page refresh, no tab switching, no intrusive ads.;;2. Direct Moon Sign Integration||Instant zodiac sign placements paired directly with active phase dynamics. You see not only what the moon is doing, but where it's doing it—all in a single glance.;;3. Birthday Personalization||A built-in Birthday Moon Phase calculator that maps your exact natal birth phase and sign alongside today's active sky, letting you compare your personal lunar signature against the current climate.]]

[[callout:Calculate Your Birthday Moon Phase|/birthday-moon-phase]]

> One dashboard. Live phase, live sign, your natal moon — no ads, no tab-switching, no 2003 UI.

## Why This Matters for Daily Tracking

Most people don't want three logins and three interpretations. They want a single, honest view of the sky today and how it relates to *them*. That's the entire design brief behind Moonday Live — a command center for the moon, not a scrapbook of ten open tabs.`,
  },
];

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}

export function getRelated(slug: string, category: BlogCategory, limit = 3) {
  return POSTS.filter((p) => p.slug !== slug && p.category === category).slice(0, limit);
}

export function categoryPath(cat: BlogCategory) {
  return cat.toLowerCase().replace(/\s+/g, "-");
}
