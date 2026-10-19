// Read-only access to published blog posts for the Vercel functions, using the public anon key
// (the same rows the site shows). No new secrets: the project's existing VITE_SUPABASE_* variables.
// Underscore-prefixed folders under api/ are not exposed as routes.

const LEGACY_PROJECT = "hzlpnmvboqhzthvjlves";
const PAGE_SIZE = 1000; // PostgREST returns at most 1,000 rows per request, so page through.

function credentials() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase URL or anon key is not set for this deployment");
  if (url.includes(LEGACY_PROJECT)) throw new Error("refusing to read from the legacy Supabase project");
  return { url, key };
}

/** Published and already live: status published, and no publish_at in the future. */
function liveFilter() {
  return `status=eq.published&or=(publish_at.is.null,publish_at.lte.${new Date().toISOString()})`;
}

async function get(path: string) {
  const { url, key } = credentials();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function fetchLivePosts<T>(select: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page: T[] = await get(
      `blog_posts?select=${select}&${liveFilter()}&order=published_at.desc.nullslast,slug.asc&limit=${PAGE_SIZE}&offset=${offset}`,
    );
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

/** One live post by slug (case-insensitive), or null when it is unpublished, scheduled or gone. Slug must be [a-z0-9-]. */
export async function fetchLivePostBySlug<T>(select: string, slug: string): Promise<T | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const rows: T[] = await get(`blog_posts?select=${select}&slug=ilike.${slug}&${liveFilter()}&limit=1`);
  return rows[0] ?? null;
}
