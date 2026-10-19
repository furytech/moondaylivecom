// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// URL rules live in src/lib/seo.ts: lowercase, no trailing slash, indexable pages only.
// Blog posts come live from the database so every published transit / guide is submitted.
// If the database can't be read, the existing sitemap is left alone rather than shrunk.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { buildSitemapEntries, renderSitemap } from "../src/lib/seo";
import { fetchLivePosts } from "./lib/published-posts.mjs";

try {
  const posts = await fetchLivePosts("slug,category,published_at,updated_at");
  if (posts === null) {
    console.warn("sitemap: no Supabase credentials, keeping the existing public/sitemap.xml");
  } else {
    const entries = buildSitemapEntries(posts);
    writeFileSync(resolve("public/sitemap.xml"), renderSitemap(entries));
    console.log(`sitemap.xml written (${entries.length} entries, ${posts.length} blog posts)`);
  }
} catch (err) {
  console.warn("sitemap: could not fetch blog posts, keeping the existing public/sitemap.xml:", (err as Error).message);
}
