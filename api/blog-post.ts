// Handles /blog/:category/:slug for posts that have no prerendered file (vercel.json rewrite; files
// written at build time are served before this runs). Three cases:
//   - live post (published after the last deploy): the SPA shell with the post's own title,
//     description and canonical written into the HTML, same as the build does.
//   - wrong category or capitals: redirect to the one lowercase URL.
//   - unpublished, scheduled or deleted: a transit post goes to /transit/<sign>; anything else gets
//     the app shell with a 404 status (the app then sends the visitor to /blog).
import type { IncomingMessage, ServerResponse } from "node:http";
import { SITE_URL, transitPagePath, transitSignFromSlug } from "../src/lib/seo.js";
import { POST_COLUMNS, injectHead, injectRoot, postPage, type PostRow } from "../src/lib/seoHead.js";
import { fetchLivePostBySlug } from "./_lib/posts.js";

const CACHE_OK = "public, s-maxage=300, stale-while-revalidate=86400";
const CACHE_SHORT = "public, s-maxage=300";

let shell: { html: string; at: number } | null = null;

/** The untouched SPA shell (dist/app.html, served at /app). Own deployment first, production as a fallback. */
async function appShell(host: string | undefined): Promise<string> {
  if (shell && Date.now() - shell.at < 60_000) return shell.html;
  const own = host && /^(.+\.vercel\.app|(www\.)?moondaylive\.com)$/.test(host) ? `https://${host}` : SITE_URL;
  let lastError: unknown;
  for (const origin of new Set([own, SITE_URL])) {
    try {
      const res = await fetch(`${origin}/app`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        shell = { html: await res.text(), at: Date.now() };
        return shell.html;
      }
      lastError = new Error(`${origin}/app answered ${res.status}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

function redirect(res: ServerResponse, status: number, location: string, cache: string) {
  res.statusCode = status;
  res.setHeader("Location", location);
  res.setHeader("Cache-Control", cache);
  res.end();
}

function send(res: ServerResponse, status: number, html: string, cache: string, method?: string) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", cache);
  res.end(method === "HEAD" ? undefined : html);
}

/** category and slug come from the rewrite's query; fall back to the path in case the platform leaves it as requested. */
function requested(req: IncomingMessage) {
  const url = new URL(req.url || "/", SITE_URL);
  const [, , pathCategory = "", pathSlug = ""] = url.pathname.split("/");
  const clean = (s: string) => decodeURIComponent(s).trim().toLowerCase();
  try {
    return {
      category: clean(url.searchParams.get("category") || pathCategory),
      slug: clean(url.searchParams.get("slug") || pathSlug),
    };
  } catch {
    return { category: "", slug: "" };
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const { category, slug } = requested(req);
  const host = (req.headers["x-forwarded-host"] || req.headers.host) as string | undefined;

  let row: PostRow | null;
  try {
    row = await fetchLivePostBySlug<PostRow>(POST_COLUMNS, slug);
  } catch (err) {
    // The database could not be read. Don't redirect or 404 on a hiccup; serve the plain shell, uncached.
    console.error("blog-post: lookup failed:", (err as Error).message);
    try {
      return send(res, 200, await appShell(host), "no-store", req.method);
    } catch {
      res.statusCode = 502;
      return res.end("Temporarily unavailable");
    }
  }

  if (row) {
    const { path, page, body } = postPage(row);
    if (path !== `/blog/${category}/${slug}`) return redirect(res, 301, path, CACHE_SHORT);
    try {
      return send(res, 200, injectRoot(injectHead(await appShell(host), page), body), CACHE_OK, req.method);
    } catch (err) {
      console.error("blog-post: could not load the app shell:", (err as Error).message);
      res.statusCode = 502;
      return res.end("Temporarily unavailable");
    }
  }

  if (category === "transits") {
    // Temporary on purpose: an unpublished or scheduled post may come back at this URL.
    const sign = transitSignFromSlug(slug);
    return redirect(res, 302, sign ? transitPagePath(sign) : "/blog", CACHE_SHORT);
  }

  try {
    return send(res, 404, await appShell(host), CACHE_SHORT, req.method);
  } catch {
    res.statusCode = 404;
    return res.end("Not found");
  }
}
