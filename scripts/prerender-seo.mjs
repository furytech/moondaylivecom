// Post-build step: gives every public page its own served HTML head (title, meta description,
// self-referencing canonical, Open Graph, robots), so crawlers don't depend on JavaScript.
//
// Output (Vercel cleanUrls serves "<path>.html" at "<path>"):
//   dist/app.html            the untouched SPA shell; vercel.json rewrites unknown paths to it
//   dist/index.html          the home page
//   dist/<page>.html         one file per static page, transit page and live blog post
// Runs after prerender-library.mjs, which owns /library/[sign]-moon and needs the pristine index.html.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { fetchLivePosts } from "./lib/published-posts.mjs";

const dist = resolve("dist");
const seo = await import(pathToFileURL(resolve("dist-ssr/entry-server.js")).href);
const { PAGES, ZODIAC_SIGNS, SITE_URL, DEFAULT_OG_IMAGE, canonicalUrl, buildPostSeo, buildTransitPageSeo, signOgImage } = seo;

const template = readFileSync(resolve(dist, "index.html"), "utf8");
if (!template.includes('<div id="root"></div>')) throw new Error('prerender-seo: <div id="root"></div> not found in dist/index.html');
if (template.includes('rel="canonical"')) throw new Error("prerender-seo: dist/index.html already has a canonical; the SPA shell must not carry one");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function headFor({ title, description, canonical, indexable = true, ogImage = DEFAULT_OG_IMAGE, ogType = "website", schema = [] }) {
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
    ...schema.map((s) => `<script data-rh="true" type="application/ld+json">${JSON.stringify(s).replace(/</g, String.fromCharCode(92) + "u003c")}</script>`),
  ].filter(Boolean).join("\n    ");
}

function render(page) {
  return template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*>/, "")
    .replace(/<meta property="og:(title|description|type|url|image)"[^>]*>/g, "")
    .replace(/<meta name="twitter:image"[^>]*>/, "")
    .replace("</head>", `    ${headFor(page)}\n  </head>`);
}

const written = [];
function write(path, page) {
  const file = path === "/" ? resolve(dist, "index.html") : resolve(dist, `.${path}.html`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, render(page));
  written.push({ path, title: page.title, description: page.description, canonical: page.canonical });
}

// The pristine shell is the fallback for every path without its own file (admin, app routes, new posts).
writeFileSync(resolve(dist, "app.html"), template);

for (const p of PAGES) {
  write(p.path, { title: p.title, description: p.description, canonical: canonicalUrl(p.path), indexable: p.indexable });
}
for (const sign of ZODIAC_SIGNS) {
  const t = buildTransitPageSeo(sign);
  write(t.path, { title: t.title, description: t.description, canonical: t.canonical });
}

// Blog posts come from the database; without credentials the build still succeeds and they use the shell.
let posts = null;
try {
  posts = await fetchLivePosts("slug,category,title,excerpt,content,published_at,publish_at,created_at,meta_title,meta_description,image_url,zodiac_sign_tag,author,keywords");
} catch (err) {
  console.warn("prerender-seo: could not fetch blog posts, they will use the SPA shell:", err.message);
}
let postCount = 0;
for (const row of posts ?? []) {
  if (!row.slug) continue;
  const date = row.published_at || row.publish_at || row.created_at;
  const s = buildPostSeo({
    slug: row.slug, category: row.category, title: row.title, excerpt: row.excerpt, content: row.content,
    date, metaTitle: row.meta_title, metaDescription: row.meta_description,
  });
  write(s.path, {
    title: s.title, description: s.description, canonical: s.canonical, ogType: "article",
    ogImage: row.image_url || signOgImage(row.zodiac_sign_tag) || DEFAULT_OG_IMAGE,
    schema: [{
      "@context": "https://schema.org", "@type": "BlogPosting", headline: row.title, description: s.description,
      datePublished: date, dateModified: date, mainEntityOfPage: { "@type": "WebPage", "@id": s.canonical },
      author: { "@type": "Organization", name: row.author || "Moonday Live Team", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Moonday Live", url: SITE_URL, logo: { "@type": "ImageObject", url: DEFAULT_OG_IMAGE } },
      articleSection: row.category,
    }],
  });
  postCount++;
}

// Every page needs its own title and description; say so loudly if two collide.
for (const field of ["title", "description"]) {
  const seen = new Map();
  for (const w of written) {
    const key = w[field];
    if (seen.has(key)) console.warn(`prerender-seo: duplicate ${field} on ${seen.get(key)} and ${w.path}`);
    else seen.set(key, w.path);
  }
}
console.log(`prerender-seo: wrote ${written.length} pages (${postCount} blog posts) plus app.html`);
