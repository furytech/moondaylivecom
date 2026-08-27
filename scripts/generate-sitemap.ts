// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Static routes are hard-coded; blog posts are pulled live from the database so
// every published transit / guide article gets submitted to Google automatically.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://moondaylive.com";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://hzlpnmvboqhzthvjlves.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/pulse", changefreq: "daily", priority: "0.9" },
  { path: "/moon-sign-horoscope", changefreq: "daily", priority: "0.9" },
  { path: "/lunar-climate", changefreq: "daily", priority: "0.9" },
  { path: "/lunar-cycle-tracking", changefreq: "weekly", priority: "0.8" },
  { path: "/birthday-moon-phase", changefreq: "monthly", priority: "0.9" },
  { path: "/my-moon-card", changefreq: "monthly", priority: "0.8" },
  { path: "/transition-quiz", changefreq: "monthly", priority: "0.7" },
  { path: "/library", changefreq: "weekly", priority: "0.8" },
  { path: "/lenses", changefreq: "weekly", priority: "0.8" },
  { path: "/blog", changefreq: "daily", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/pricing", changefreq: "monthly", priority: "0.9" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "yearly", priority: "0.6" },
  { path: "/login", changefreq: "yearly", priority: "0.5" },
  { path: "/signup", changefreq: "yearly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.4" },
  { path: "/terms", changefreq: "yearly", priority: "0.4" },
  { path: "/refund", changefreq: "yearly", priority: "0.4" },
  { path: "/disclaimer", changefreq: "yearly", priority: "0.4" },
];

function categoryPath(cat: string) {
  return (cat || "Guides").toLowerCase().replace(/\s+/g, "-");
}

async function fetchPostEntries(): Promise<SitemapEntry[]> {
  if (!SUPABASE_KEY) {
    console.warn("sitemap: no Supabase key available, writing static routes only");
    return [];
  }
  const now = new Date().toISOString();
  const url =
    `${SUPABASE_URL}/rest/v1/blog_posts` +
    `?select=slug,category,published_at,updated_at,publish_at` +
    `&status=eq.published&or=(publish_at.is.null,publish_at.lte.${now})`;

  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const rows = (await res.json()) as Array<{
      slug: string;
      category: string;
      published_at?: string | null;
      updated_at?: string | null;
    }>;
    return rows
      .filter((r) => r.slug)
      .map((r) => {
        const stamp = r.updated_at || r.published_at || null;
        return {
          path: `/blog/${categoryPath(r.category)}/${r.slug}`,
          lastmod: stamp ? stamp.slice(0, 10) : undefined,
          changefreq: "monthly" as const,
          priority: "0.8",
        };
      });
  } catch (err) {
    console.warn("sitemap: could not fetch blog posts —", (err as Error).message);
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const postEntries = await fetchPostEntries();
const entries = [...staticEntries, ...postEntries];
writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries, ${postEntries.length} blog posts)`);
