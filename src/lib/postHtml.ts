// Served HTML for a blog post: the article as plain, escaped HTML that goes inside <div id="root">.
// Used by the build prerender (scripts/prerender-seo.mjs) and by the Vercel function that serves posts
// published after the last deploy (api/blog-post.ts), so crawlers get the full text without JavaScript.
// React replaces it on load; BlogPost shows it as its loading state so nothing flashes.
//
// Nothing here trusts the post: every piece of text is escaped, markup comes only from this file's own
// templates, and links are limited to http(s), mailto and site-relative URLs.

import { blogPostPath, ZODIAC_SIGNS, signOgImage, DEFAULT_OG_IMAGE } from "./seo.js";
import { formatLocalDate, localizeUtcTimes, repeatsTitle, stripLeadingTitle } from "./postText.js";
import { getFAQsBySlug } from "../data/transitFAQs.js";

export interface PostHtmlRow {
  slug?: string | null;
  category: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  published_at?: string | null;
  publish_at?: string | null;
  created_at?: string | null;
  author?: string | null;
  reviewed_by?: string | null;
  read_time?: number | null;
  zodiac_sign_tag?: string | null;
  image_url?: string | null;
}

export const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** http(s), mailto and site-relative links only; anything else (javascript:, data:, ...) becomes plain text. */
function safeHref(raw: string): string | null {
  const url = raw.trim();
  if (/^(https?:\/\/|mailto:)/i.test(url) || (url.startsWith("/") && !url.startsWith("//"))) return esc(url);
  return null;
}

const MARK = "\u0000";

function inline(text: string): string {
  // Links and code are pulled out first so emphasis markers inside them are left alone.
  const stash: string[] = [];
  const hold = (html: string) => `${MARK}${stash.push(html) - 1}${MARK}`;
  const pulled = text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "")
    .replace(/`([^`]+)`/g, (_m, c) => hold(`<code>${esc(c)}</code>`))
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) => {
      const safe = safeHref(href);
      return hold(safe ? `<a href="${safe}">${esc(label)}</a>` : esc(label));
    });
  return esc(pulled)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/(^|[\s(])_([^_\n]+)_/g, "$1<em>$2</em>")
    .replace(new RegExp(`${MARK}(\\d+)${MARK}`, "g"), (_m, i) => stash[Number(i)]);
}

/** Markdown to escaped HTML: headings, paragraphs, lists, quotes, rules, links, bold, italic, code. */
export function markdownToSafeHtml(markdown: string): string {
  const blocks = (markdown || "").replace(/\r\n/g, "\n").replace(/^---[\s\S]*?---\s*/, "").split(/\n{2,}/);
  const html: string[] = [];
  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;
    if (/^(-{3,}|\*{3,})$/.test(block)) {
      html.push("<hr />");
      continue;
    }
    const lines = block.split("\n");
    // A heading may sit directly above its paragraph with no blank line between.
    let i = 0;
    while (i < lines.length && /^#{1,6}\s+\S/.test(lines[i])) {
      const m = lines[i].match(/^(#{1,6})\s+(.*)$/)!;
      const level = Math.min(Math.max(m[1].length, 2), 4);
      html.push(`<h${level}>${inline(m[2].trim())}</h${level}>`);
      i++;
    }
    const rest = lines.slice(i);
    if (!rest.length) continue;
    if (rest.every((l) => /^\s*[-*+]\s+/.test(l))) {
      html.push(`<ul>${rest.map((l) => `<li>${inline(l.replace(/^\s*[-*+]\s+/, ""))}</li>`).join("")}</ul>`);
    } else if (rest.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
      html.push(`<ol>${rest.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("")}</ol>`);
    } else if (rest.every((l) => /^\s*>/.test(l))) {
      html.push(`<blockquote><p>${inline(rest.map((l) => l.replace(/^\s*>\s?/, "")).join(" "))}</p></blockquote>`);
    } else {
      html.push(`<p>${inline(rest.join(" "))}</p>`);
    }
  }
  return html.join("\n");
}

/** The sign a transit post is about, matched the way the React page does it. */
function signOf(row: PostHtmlRow) {
  if (row.category !== "Transits") return null;
  const tag = (row.zodiac_sign_tag || "").toLowerCase();
  const slug = (row.slug || "").toLowerCase();
  const title = (row.title || "").toLowerCase();
  const idx = ZODIAC_SIGNS.findIndex(
    (s) => s.toLowerCase() === tag || slug.includes(s.toLowerCase()) || title.includes(s.toLowerCase()),
  );
  return idx === -1 ? null : { idx, sign: ZODIAC_SIGNS[idx] };
}

/** Everything inside <div id="root"> for a post: breadcrumb, title, byline, body, links and FAQs. */
export function renderPostArticle(row: PostHtmlRow): string {
  const date = row.published_at || row.publish_at || row.created_at || "";
  const title = (row.title || "").trim();
  const body = markdownToSafeHtml(localizeUtcTimes(stripLeadingTitle(row.content, title), null, date));
  const excerpt = (row.excerpt || "").trim();
  const showExcerpt = excerpt && !repeatsTitle(excerpt, title);
  const category = row.category || "Guides";
  const image = row.image_url || signOgImage(row.zodiac_sign_tag) || null;
  const about = signOf(row);
  const faqs = about ? getFAQsBySlug(about.sign.toLowerCase()) : [];
  const prev = about ? ZODIAC_SIGNS[(about.idx + 11) % 12] : null;
  const next = about ? ZODIAC_SIGNS[(about.idx + 1) % 12] : null;
  const catLink = `/blog?category=${encodeURIComponent(category.toLowerCase().replace(/\s+/g, "-"))}`;
  const byline = [
    esc(row.author || "Moonday Live Team"),
    esc(formatLocalDate(date, null)),
    row.read_time ? `${esc(row.read_time)} min read` : "",
    row.reviewed_by ? `Human-reviewed by ${esc(row.reviewed_by)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    `<div class="min-h-screen bg-background flex flex-col relative">`,
    `<main class="flex-1 flex flex-col items-center pt-[68px] pb-6 px-6 relative z-20">`,
    `<article class="w-full max-w-3xl mx-auto" data-path="${esc(blogPostPath(category, row.slug || ""))}">`,
    `<nav aria-label="Breadcrumb" class="mb-8 text-xs md:text-sm text-cream-muted"><a href="/">Home</a> / <a href="/blog">Blog</a> / <a href="${esc(catLink)}">${esc(category)}</a></nav>`,
    image
      ? `<img src="${esc(image)}" alt="${esc(row.zodiac_sign_tag || "Constellation")} constellation card" class="mx-auto mb-8 h-48 md:h-64 w-full object-contain" />`
      : "",
    `<header class="mb-10">`,
    `<h1 class="font-display text-2xl md:text-[32px] leading-snug tracking-tight text-foreground font-normal">${esc(title)}</h1>`,
    `<p class="mt-4 text-xs text-cream-muted/80">${byline}</p>`,
    showExcerpt
      ? `<p class="mt-5 text-[15px] md:text-base text-cream-muted/85 leading-relaxed italic">${esc(localizeUtcTimes(excerpt, null, date))}</p>`
      : "",
    `</header>`,
    `<div class="article-body">${body}</div>`,
    `<p><a href="/blueprint">Open the Dashboard</a></p>`,
    about && prev && next
      ? `<nav aria-label="Related pathways"><h2>Related Pathways</h2><p><a href="/blueprint">Discover Your Moon Blueprint</a> · <a href="/pricing">Unlock Luminary Access</a></p><p><a href="/transit/${prev.toLowerCase()}">Moon in ${prev}</a> · <a href="/transit/${next.toLowerCase()}">Moon in ${next}</a></p></nav>`
      : "",
    faqs.length
      ? `<section aria-label="Frequently asked questions about Moon in ${esc(about!.sign)}"><h2>Frequently Asked Questions</h2>${faqs
          .map((f) => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`)
          .join("")}</section>`
      : "",
    `</article>`,
    `</main>`,
    `</div>`,
  ].join("");
}

/** Article structured data for a post. Author is the brand; image falls back to the default social card. */
export function articleSchema(
  row: PostHtmlRow & { updated_at?: string | null },
  info: { canonical: string; description: string; siteUrl: string; logo: string },
) {
  const datePublished = row.published_at || row.publish_at || row.created_at || undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: row.title,
    description: info.description,
    image: [row.image_url || signOgImage(row.zodiac_sign_tag) || DEFAULT_OG_IMAGE],
    datePublished,
    dateModified: row.updated_at || datePublished,
    author: { "@type": "Organization", name: "Moonday Live", url: info.siteUrl },
    publisher: { "@type": "Organization", name: "Moonday Live", url: info.siteUrl, logo: { "@type": "ImageObject", url: info.logo } },
    mainEntityOfPage: { "@type": "WebPage", "@id": info.canonical },
    articleSection: row.category,
  };
}
