import { describe, expect, it } from "vitest";
import { articleSchema, markdownToSafeHtml, renderPostArticle } from "@/lib/postHtml";
import { injectHead, injectRoot, postPage } from "@/lib/seoHead";

const TITLE = "The Moon Enters Aquarius: What to Feel, Notice, and Release";
const row = {
  slug: "the-moon-enters-aquarius-what-to-feel-notice-and-release-2026-10-19",
  category: "Transits",
  title: TITLE,
  excerpt: TITLE,
  content: `**${TITLE}**\n\nThe Moon ingresses at 2026-10-19 at 01:39:50 UTC and the mood loosens.\n\n## Practical heads-up\nWatch the group chat. [Blueprint](/blueprint) and [bad](javascript:alert(1)).\n\n- one\n- two`,
  published_at: "2026-10-19T01:39:50Z",
  zodiac_sign_tag: "Aquarius",
  author: "Moonday Live Team",
  read_time: 4,
};

describe("served post HTML", () => {
  const html = renderPostArticle(row);

  it("shows the title once, with ET times and the body text", () => {
    expect(html.split(TITLE).length - 1).toBe(1);
    expect(html).toContain("Sunday, Oct 18 at 9:39 PM ET");
    expect(html).not.toContain("01:39:50");
    expect(html).toContain("<h2>Practical heads-up</h2>");
    expect(html).toContain('<a href="/blueprint">Blueprint</a>');
    expect(html).toContain("October 18, 2026");
  });

  it("escapes markup and drops unsafe links", () => {
    const evil = markdownToSafeHtml('<script>alert(1)</script> **b** [x](javascript:alert(1)) [y](data:text/html,hi) <img src=x onerror=alert(1)>');
    expect(evil).not.toMatch(/<script|<img|javascript:|data:text/i);
    expect(evil).toContain("&lt;script&gt;");
    expect(evil).toContain("<strong>b</strong>");
    const quoted = renderPostArticle({ ...row, title: 'A "quoted" <title>', slug: "x", content: "Body." });
    expect(quoted).toContain("&lt;title&gt;");
    expect(quoted).not.toContain("<title>");
  });

  it("goes inside the app root and the head carries Article data", () => {
    const { page, body } = postPage({ ...row, updated_at: "2026-10-19T02:00:00Z" });
    const shell = '<html><head><title>x</title></head><body><div id="root"></div></body></html>';
    const out = injectRoot(injectHead(shell, page), body);
    expect(out).toContain('<div id="root" data-prerendered="1"><div class="min-h-screen');
    const ld = JSON.parse(out.match(/<script data-rh="true" type="application\/ld\+json">(.*?)<\/script>/)![1]);
    expect(ld).toMatchObject({
      "@type": "Article",
      headline: TITLE,
      datePublished: "2026-10-19T01:39:50Z",
      dateModified: "2026-10-19T02:00:00Z",
      author: { name: "Moonday Live" },
      mainEntityOfPage: { "@id": `https://moondaylive.com/blog/transits/${row.slug}` },
    });
    expect(ld.description).not.toContain(TITLE);
    expect(ld.image[0]).toMatch(/^https:\/\//);
    expect(articleSchema(row, { canonical: "c", description: "d", siteUrl: "s", logo: "l" }).dateModified).toBe("2026-10-19T01:39:50Z");
  });
});
