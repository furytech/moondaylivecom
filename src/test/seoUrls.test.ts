import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PAGES,
  ZODIAC_SIGNS,
  blogPostPath,
  blogPostUrl,
  buildPostSeo,
  buildSitemapEntries,
  canonicalUrl,
  normalizePath,
  renderSitemap,
  seoProps,
} from "@/lib/seo";
import { LIBRARY_SIGNS } from "@/lib/librarySeo";
import { postUrl } from "@/lib/channels";
import { redditSourceUrl } from "@/lib/redditFormat";

describe("URL policy: absolute, lowercase, no trailing slash", () => {
  it("normalises paths", () => {
    expect(normalizePath("/Blog/Transits/Some-Slug/")).toBe("/blog/transits/some-slug");
    expect(normalizePath("/blog/transits/x?utm=1#top")).toBe("/blog/transits/x");
    expect(normalizePath("/blog/Product%20Updates/x")).toBe("/blog/product-updates/x");
    expect(normalizePath("")).toBe("/");
    expect(canonicalUrl("/About/")).toBe("https://moondaylive.com/about");
    expect(canonicalUrl("/")).toBe("https://moondaylive.com/");
  });

  it("builds one lowercase form for every blog post", () => {
    expect(blogPostPath("Transits", "The-Moon-Enters-Leo")).toBe("/blog/transits/the-moon-enters-leo");
    expect(blogPostPath("Product Updates", "x")).toBe("/blog/product-updates/x");
    expect(blogPostUrl("Guides", "x")).toBe("https://moondaylive.com/blog/guides/x");
  });

  it("share and dispatch helpers never emit the capitalised category", () => {
    const post = { category: "Transits", slug: "the-moon-enters-aquarius-2026-10-19" };
    const want = "https://moondaylive.com/blog/transits/the-moon-enters-aquarius-2026-10-19";
    expect(postUrl(post)).toBe(want);
    expect(redditSourceUrl(post)).toBe(want);
  });
});

describe("static page SEO", () => {
  it("gives every page a unique title and description and a clean canonical", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const page of PAGES) {
      const { canonical, title, description } = seoProps(page.path);
      expect(canonical).toBe(canonicalUrl(page.path));
      expect(canonical).toBe(canonical.toLowerCase());
      expect(canonical.endsWith("/") && page.path !== "/").toBe(false);
      expect(title.length).toBeGreaterThan(10);
      expect(description.length).toBeGreaterThan(40);
      titles.add(title);
      descriptions.add(description);
    }
    expect(titles.size).toBe(PAGES.length);
    expect(descriptions.size).toBe(PAGES.length);
  });

  it("serves sign-in and quiz pages as noindex", () => {
    for (const path of ["/login", "/signup", "/transition-quiz"]) {
      expect(seoProps(path).noindex).toBe(true);
    }
  });

  it("keeps the sign list in step with the Library", () => {
    expect([...ZODIAC_SIGNS]).toEqual([...LIBRARY_SIGNS]);
  });
});

describe("blog post SEO", () => {
  const capricorn = (date: string, opening: string) => ({
    slug: `the-moon-enters-capricorn-what-to-feel-notice-and-release-${date.slice(0, 10)}`,
    category: "Transits",
    title: "The Moon Enters Capricorn: What to Feel, Notice, and Release",
    excerpt: " The Moon Enters Capricorn: What to Feel, Notice, and Release",
    content: `# The Moon Enters Capricorn: What to Feel, Notice, and Release\n\n## Astronomical baseline\n${opening}\n\n## Practical heads-up\nMore text.`,
    date,
  });

  it("makes same-sign transit posts unique", () => {
    const a = buildPostSeo(capricorn("2026-10-16T12:56:58Z", "At 12:56 UTC on October 16, 2026, the Moon moves into Capricorn."));
    const b = buildPostSeo(capricorn("2026-09-19T04:54:44Z", "The mood shifts sharply at 2026-09-19T04:54:44.237Z UTC. The Moon steps into Capricorn."));
    expect(a.title).not.toBe(b.title);
    expect(a.description).not.toBe(b.description);
    expect(a.title).toContain("Oct 16, 2026");
    expect(b.title).toContain("Sep 19, 2026");
    expect(b.description).not.toMatch(/T04:54/);
    expect(a.description).not.toBe("The Moon Enters Capricorn: What to Feel, Notice, and Release");
    expect(a.canonical).toBe(`https://moondaylive.com${a.path}`);
    expect(a.path).toBe(a.path.toLowerCase());
  });

  it("prefers an explicit meta title and description", () => {
    const seo = buildPostSeo({
      ...capricorn("2026-10-16T12:56:58Z", "x"),
      metaTitle: "Custom title",
      metaDescription: "Custom description",
    });
    expect(seo.title).toBe("Custom title");
    expect(seo.description).toBe("Custom description");
  });
});

describe("sitemap", () => {
  const posts = [
    { slug: "The-Moon-Enters-Leo-2026-08-01", category: "Transits", published_at: "2026-08-01T00:00:00Z" },
    { slug: "the-moon-enters-leo-2026-08-01", category: "Transits", published_at: "2026-08-01T00:00:00Z" },
    { slug: "guide-one", category: "Guides", updated_at: "2026-09-01T10:00:00Z" },
  ];
  const entries = buildSitemapEntries(posts);
  const locs = entries.map((e) => canonicalUrl(e.path));

  it("lists only lowercase, unique URLs", () => {
    for (const loc of locs) expect(loc).toBe(loc.toLowerCase());
    expect(new Set(locs).size).toBe(locs.length);
    expect(renderSitemap(entries)).not.toMatch(/\/blog\/[A-Z]/);
  });

  it("includes every Library sign page and the transit posts", () => {
    for (const sign of ZODIAC_SIGNS) {
      expect(locs).toContain(`https://moondaylive.com/library/${sign.toLowerCase()}-moon`);
    }
    expect(locs).toContain("https://moondaylive.com/blog/transits/the-moon-enters-leo-2026-08-01");
    expect(locs).toContain("https://moondaylive.com/blog/guides/guide-one");
  });

  it("leaves out noindex and private pages", () => {
    for (const path of ["/login", "/signup", "/transition-quiz", "/lenses", "/my-moon-card", "/blueprint", "/account", "/admin"]) {
      expect(locs).not.toContain(canonicalUrl(path));
    }
  });
});

describe("vercel.json", () => {
  const config = JSON.parse(readFileSync(resolve(__dirname, "../../vercel.json"), "utf8"));

  it("301s capitalised blog paths to lowercase", () => {
    const find = (source: string) => config.redirects.find((r: { source: string }) => r.source === source);
    for (const [from, to] of [
      ["/blog/Transits/:slug", "/blog/transits/:slug"],
      ["/blog/Guides/:slug", "/blog/guides/:slug"],
      ["/blog/Features/:slug", "/blog/features/:slug"],
      ["/blog/Product%20Updates/:slug", "/blog/product-updates/:slug"],
    ]) {
      expect(find(from)?.destination).toBe(to);
      expect(find(from)?.permanent).toBe(true);
    }
    // Vercel matches paths case-sensitively; a lowercase source would redirect to itself forever.
    for (const r of config.redirects) expect(r.source).not.toBe(r.destination);
  });

  it("uses one trailing-slash policy and falls back to the untouched app shell", () => {
    expect(config.trailingSlash).toBe(false);
    expect(config.cleanUrls).toBe(true);
    const last = config.rewrites[config.rewrites.length - 1];
    expect(last).toEqual({ source: "/(.*)", destination: "/app" });
  });
});
