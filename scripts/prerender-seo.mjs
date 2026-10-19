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
const { PAGES, ZODIAC_SIGNS, canonicalUrl, buildTransitPageSeo, POST_COLUMNS, injectHead, injectRoot, postPage, renderPage, faqPageSchema, RENDERED_PATHS } = seo;

const template = readFileSync(resolve(dist, "index.html"), "utf8");
if (!template.includes('<div id="root"></div>')) throw new Error('prerender-seo: <div id="root"></div> not found in dist/index.html');
if (template.includes('rel="canonical"')) throw new Error("prerender-seo: dist/index.html already has a canonical; the SPA shell must not carry one");

function render(page, inner) {
  const html = injectHead(template, page);
  return inner ? injectRoot(html, inner) : html;
}

const written = [];
function write(path, page, inner) {
  const file = path === "/" ? resolve(dist, "index.html") : resolve(dist, `.${path}.html`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, render(page, inner));
  written.push({ path, title: page.title, description: page.description, canonical: page.canonical });
}

// The pristine shell is the fallback for every path without its own file (admin and app routes; posts published after this build get their head from api/blog-post.ts).
writeFileSync(resolve(dist, "app.html"), template);

// Blog posts come from the database; without credentials the build still succeeds and they use the shell.
let posts = null;
try {
  posts = await fetchLivePosts(POST_COLUMNS);
} catch (err) {
  console.warn("prerender-seo: could not fetch blog posts, they will use the SPA shell:", err.message);
}
// The page's real React markup goes into #root, so crawlers read the full text without running JavaScript.
// A page that cannot render here still gets its head and falls back to the empty shell.
const unrendered = [];
function body(path, rows) {
  if (!RENDERED_PATHS.includes(path) && !path.startsWith("/transit/")) return undefined;
  try {
    return renderPage(path, rows);
  } catch (err) {
    unrendered.push(path);
    console.warn(`prerender-seo: could not render ${path}:`, err.message);
    return undefined;
  }
}

for (const p of PAGES) {
  write(p.path, { title: p.title, description: p.description, canonical: canonicalUrl(p.path), indexable: p.indexable, schema: p.path === "/faq" ? [faqPageSchema()] : [] }, body(p.path, posts ?? []));
}
for (const sign of ZODIAC_SIGNS) {
  const t = buildTransitPageSeo(sign);
  write(t.path, { title: t.title, description: t.description, canonical: t.canonical }, body(t.path, posts ?? []));
}

let postCount = 0;
for (const row of posts ?? []) {
  if (!row.slug) continue;
  const { path, page, body: postBody } = postPage(row);
  write(path, page, postBody);
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
if (unrendered.length) throw new Error(`prerender-seo: pages missing their served content: ${unrendered.join(", ")}`);
console.log(`prerender-seo: wrote ${written.length} pages (${postCount} blog posts) plus app.html`);
