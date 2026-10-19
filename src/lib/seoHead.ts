// Builds the served <head> for a page and writes it into the SPA shell.
// Shared by the build-time prerender (scripts/prerender-seo.mjs) and the Vercel function that serves
// posts published after the last deploy (api/blog-post.ts), so both produce identical HTML.

import { DEFAULT_OG_IMAGE, SITE_URL, buildPostBreadcrumb, buildPostSeo, signOgImage } from "./seo.js";
import { articleSchema, renderPostArticle } from "./postHtml.js";

export interface HeadPage {
  title: string;
  description: string;
  canonical: string;
  indexable?: boolean;
  ogImage?: string;
  ogType?: string;
  schema?: object[];
}

/** Blog post columns the head is built from. */
export interface PostRow {
  slug?: string | null;
  category: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  published_at?: string | null;
  publish_at?: string | null;
  created_at?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  image_url?: string | null;
  zodiac_sign_tag?: string | null;
  author?: string | null;
  reviewed_by?: string | null;
  read_time?: number | null;
  updated_at?: string | null;
}

export const POST_COLUMNS =
  "slug,category,title,excerpt,content,published_at,publish_at,created_at,meta_title,meta_description,image_url,zodiac_sign_tag,author,reviewed_by,read_time,updated_at,keywords";

const esc = (s: string) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function headFor({
  title, description, canonical, indexable = true, ogImage = DEFAULT_OG_IMAGE, ogType = "website", schema = [],
}: HeadPage): string {
  // data-rh marks these as react-helmet-async managed, so the client replaces them instead of duplicating.
  return [
    `<title data-rh="true">${esc(title)}</title>`,
    `<meta data-rh="true" name="description" content="${esc(description)}" />`,
    `<link data-rh="true" rel="canonical" href="${canonical}" />`,
    indexable ? null : `<meta data-rh="true" name="robots" content="noindex, nofollow" />`,
    `<meta data-rh="true" property="og:title" content="${esc(title)}" />`,
    `<meta data-rh="true" property="og:description" content="${esc(description)}" />`,
    `<meta data-rh="true" property="og:url" content="${canonical}" />`,
    `<meta data-rh="true" property="og:type" content="${ogType}" />`,
    `<meta data-rh="true" property="og:image" content="${ogImage}" />`,
    `<meta data-rh="true" property="og:site_name" content="Moonday Live" />`,
    `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`,
    `<meta data-rh="true" name="twitter:title" content="${esc(title)}" />`,
    `<meta data-rh="true" name="twitter:description" content="${esc(description)}" />`,
    `<meta data-rh="true" name="twitter:image" content="${ogImage}" />`,
    ...schema.map((s) => `<script data-rh="true" type="application/ld+json">${JSON.stringify(s).replace(/</g, "\\u003c")}</script>`),
  ].filter(Boolean).join("\n    ");
}

/** The untouched SPA shell in, a page with its own head out. */
export function injectHead(template: string, page: HeadPage): string {
  return template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*>/, "")
    .replace(/<meta property="og:(title|description|type|url|image)"[^>]*>/g, "")
    .replace(/<meta name="twitter:image"[^>]*>/, "")
    .replace("</head>", `    ${headFor(page)}\n  </head>`);
}

/** Puts a page's own markup inside the SPA root. data-prerendered tells the app the content is already there. */
export function injectRoot(html: string, inner: string): string {
  return html.replace('<div id="root"></div>', () => `<div id="root" data-prerendered="1">${inner}</div>`);
}

/** Path, head and served body for a published blog post. */
export function postPage(row: PostRow): { path: string; page: HeadPage; body: string } {
  const date = row.published_at || row.publish_at || row.created_at;
  const s = buildPostSeo({
    slug: row.slug || "", category: row.category, title: row.title, excerpt: row.excerpt, content: row.content,
    date, metaTitle: row.meta_title, metaDescription: row.meta_description,
  });
  return {
    path: s.path,
    body: renderPostArticle(row),
    page: {
      title: s.title,
      description: s.description,
      canonical: s.canonical,
      ogType: "article",
      ogImage: row.image_url || signOgImage(row.zodiac_sign_tag) || DEFAULT_OG_IMAGE,
      schema: [
        articleSchema(row, { canonical: s.canonical, description: s.description, siteUrl: SITE_URL, logo: DEFAULT_OG_IMAGE }),
        buildPostBreadcrumb({ title: row.title, canonical: s.canonical }),
      ],
    },
  };
}
