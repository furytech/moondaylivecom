// Post-build step: writes static HTML for the 12 /library/[sign]-moon pages into dist/.
// Runs after `vite build` (client) and `vite build --ssr` (dist-ssr). Vercel serves these
// files before the SPA rewrite, so crawlers get the full content, head tags and JSON-LD
// without running JavaScript. The browser then mounts the React app over #root as usual.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const dist = resolve("dist");
const { LIBRARY_SIGNS, buildSignSeo, libraryPath, renderSignPage } = await import(
  pathToFileURL(resolve("dist-ssr/entry-server.js")).href
);

const template = readFileSync(resolve(dist, "index.html"), "utf8");
if (!template.includes('<div id="root"></div>')) throw new Error('prerender: <div id="root"></div> not found in dist/index.html');

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const OG_IMAGE = "https://moondaylive.com/og-image.png";

for (const sign of LIBRARY_SIGNS) {
  const seo = buildSignSeo(sign);
  // data-rh marks these as react-helmet-async managed, so the client replaces them instead of duplicating.
  const head = [
    `<title data-rh="true">${esc(seo.title)}</title>`,
    `<meta data-rh="true" name="description" content="${esc(seo.description)}" />`,
    `<link data-rh="true" rel="canonical" href="${seo.url}" />`,
    `<meta data-rh="true" property="og:title" content="${esc(seo.title)}" />`,
    `<meta data-rh="true" property="og:description" content="${esc(seo.description)}" />`,
    `<meta data-rh="true" property="og:url" content="${seo.url}" />`,
    `<meta data-rh="true" property="og:type" content="article" />`,
    `<meta data-rh="true" property="og:image" content="${OG_IMAGE}" />`,
    `<meta data-rh="true" property="og:site_name" content="Moonday Live" />`,
    `<meta data-rh="true" name="twitter:title" content="${esc(seo.title)}" />`,
    `<meta data-rh="true" name="twitter:description" content="${esc(seo.description)}" />`,
    ...seo.schema.map(
      (s) => `<script data-rh="true" type="application/ld+json">${JSON.stringify(s).replace(/</g, "\u003c")}</script>`,
    ),
  ].join("\n    ");

  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*>/, "")
    .replace(/<meta property="og:(title|description|type|url)"[^>]*>/g, "")
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${renderSignPage(sign)}</div>`);

  const dir = resolve(dist, "." + libraryPath(sign));
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), html);
}
console.log(`prerender: wrote ${LIBRARY_SIGNS.length} /library/[sign]-moon pages`);
