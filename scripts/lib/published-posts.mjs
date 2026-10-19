// Build-time helper used by prerender-seo.mjs (api/_lib/posts.ts is the runtime twin for the Vercel functions).
// Reads live published blog posts with the public anon key (the same rows the site shows).
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const LEGACY_PROJECT = "hzlpnmvboqhzthvjlves";
const PAGE_SIZE = 1000; // PostgREST returns at most 1,000 rows per request, so page through.

/** Returns published, already-live posts, or null when the build has no Supabase credentials. */
export async function fetchLivePosts(select) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  if (url.includes(LEGACY_PROJECT)) throw new Error("refusing to read from the legacy Supabase project");

  const now = new Date().toISOString();
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const query =
      `${url}/rest/v1/blog_posts?select=${select}` +
      `&status=eq.published&or=(publish_at.is.null,publish_at.lte.${now})` +
      `&order=published_at.desc.nullslast,slug.asc&limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await fetch(query, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}
