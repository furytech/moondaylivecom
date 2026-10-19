// Serves /sitemap.xml (vercel.json rewrite) straight from the database, so a transit post is listed
// minutes after it goes live, with no deploy. URL rules live in src/lib/seo.ts.
import type { IncomingMessage, ServerResponse } from "node:http";
import { buildSitemapEntries, renderSitemap, type SitemapPost } from "../src/lib/seo.js";
import { fetchLivePosts } from "./_lib/posts.js";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  let posts: SitemapPost[] = [];
  let complete = true;
  try {
    posts = await fetchLivePosts<SitemapPost>("slug,category,published_at,updated_at");
  } catch (err) {
    // Still answer with every static page rather than an error; retry sooner than usual.
    complete = false;
    console.error("sitemap: could not read blog posts:", (err as Error).message);
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    complete ? "public, s-maxage=300, stale-while-revalidate=3600" : "public, s-maxage=30",
  );
  res.end(renderSitemap(buildSitemapEntries(posts)));
}
