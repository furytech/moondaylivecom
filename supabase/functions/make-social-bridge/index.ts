import { createClient } from 'npm:@supabase/supabase-js@2';
import { dueRows, pushDue, type TransitRow, type TransitWindow } from '../_shared/socialDue.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-make-secret',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

function sanitize(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\r\n/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ');
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function toPayload(t: TransitRow & Record<string, any>) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co';
  const signKey = (t.id || t.sign || 'aries').toLowerCase().trim();
  const imageUrl = t.image_url || `${supabaseUrl}/storage/v1/object/public/transit-images/${signKey}.png`;
  return {
    ...t,
    image_url: imageUrl,
    media_url: imageUrl,
    transit_date: t.transit_date || null,
    copy: sanitize(t.copy),
    ritual_tip: sanitize(t.ritual_tip),
    transit_title: sanitize(t.transit_title),
    transit_aspect: sanitize(t.transit_aspect),
  };
}

/** Published, unposted transits (the candidates); the due rule then narrows them. */
async function fetchCandidates() {
  const { data, error } = await supabase
    .from('transits')
    .select('*')
    .eq('status', 'published')
    .is('social_posted_at', null);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<TransitRow & Record<string, any>>;
}

/** Moon windows that have not ended yet (about the next 90 days of them is plenty). */
async function fetchWindows(): Promise<TransitWindow[]> {
  const { data, error } = await supabase
    .from('moon_transitions')
    .select('sign, start_time, end_time')
    .gt('end_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).filter((w) => w.sign && w.start_time && w.end_time) as TransitWindow[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  const makeSecret = req.headers.get('X-Make-Secret') || req.headers.get('x-make-secret');
  const expectedSecret = Deno.env.get('MAKE_SOCIAL_SECRET');

  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const isAuthorized = !expectedSecret || (makeSecret === expectedSecret || bearerToken === expectedSecret);

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  let body: Record<string, unknown> = {};

  if (req.method === 'POST') {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  const { id, table } = body as { id?: string; table?: string };
  const requestedTable = url.searchParams.get('table') || table;
  const targetTable = requestedTable === 'blog_posts' ? 'blog_posts' : 'transits';

  // 0. Push mode (scheduled trigger): find due transits, POST each to the Make webhook, mark posted on a 2xx.
  if (req.method === 'POST' && body.mode === 'push') {
    if (!expectedSecret) return json({ error: 'MAKE_SOCIAL_SECRET is not set; push mode needs it' }, 500);
    const webhookUrl = Deno.env.get('MAKE_SOCIAL_WEBHOOK_URL');
    if (!webhookUrl) return json({ error: 'MAKE_SOCIAL_WEBHOOK_URL is not set' }, 500);
    try {
      const result = await pushDue({
        fetchCandidates,
        fetchWindows,
        postToWebhook: async (row) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
          try {
            const res = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event: 'transit.due', source: 'moonday-social-bridge', ...toPayload(row) }),
              signal: controller.signal,
            });
            await res.text().catch(() => undefined);
            return res.status;
          } finally {
            clearTimeout(timer);
          }
        },
        markPosted: async (rowId, at) => {
          const { error } = await supabase
            .from('transits')
            .update({ social_posted_at: at })
            .eq('id', rowId)
            .is('social_posted_at', null);
          if (error) throw new Error(error.message);
        },
        now: () => Date.now(),
        log: (step, details) => console.log(`[MAKE-SOCIAL-BRIDGE] ${step}`, details ? JSON.stringify(details) : ''),
      });
      return json({ mode: 'push', ...result });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : String(err) }, 500);
    }
  }

  // 1. Post-Syndication Callback: If an ID is provided, mark the item as posted
  if (req.method === 'POST' && id) {
    const selectedTable = table === 'blog_posts' ? 'blog_posts' : targetTable;
    const { error } = await supabase
      .from(selectedTable)
      .update({ social_posted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, table: selectedTable, id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 2. Poller Query: Bodyless POST or GET requests return published items ready for Make.com to distribute
  if (targetTable === 'transits') {
    // Only DUE records: published, unposted, post time (power hour on the first day of the transit, New York)
    // has passed, and the transit is not over. Approving early no longer posts early.
    try {
      const [candidates, windows] = await Promise.all([fetchCandidates(), fetchWindows()]);
      const due = dueRows(candidates, windows, Date.now())
        .sort((x, y) => String(x.published_at ?? '').localeCompare(String(y.published_at ?? '')))
        .slice(0, 12)
        .map(toPayload);

      return json({ table: 'transits', count: due.length, transits: due, posts: due });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : String(err) }, 500);
    }
  }

  // Default: blog_posts query for Make.com syndication
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(
      'id, title, slug, image_url, zodiac_sign_tag, ' +
      'facebook_post, instagram_post, twitter_post, ' +
      'threads_post, pinterest_post, reddit_post, status, published_at, social_posted_at, excerpt, content'
    )
    .eq('status', 'published')
    .is('social_posted_at', null)
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .order('published_at', { ascending: true })
    .limit(10);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const sanitizedPosts = (posts ?? []).map((post) => ({
    ...post,
    facebook_post: sanitize(post.facebook_post),
    instagram_post: sanitize(post.instagram_post),
    twitter_post: sanitize(post.twitter_post),
    threads_post: sanitize(post.threads_post),
    pinterest_post: sanitize(post.pinterest_post),
    reddit_post: sanitize(post.reddit_post),
  }));

  return new Response(
    JSON.stringify({
      table: 'blog_posts',
      count: sanitizedPosts.length,
      posts: sanitizedPosts,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});

