import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  CLAIM_STALE_MINUTES,
  dueItems,
  earliestApproval,
  postedForApproval,
  pushDue,
  transitTimesLine,
  type DueItem,
  type PushContext,
  type TransitRow,
  type TransitWindow,
} from '../_shared/socialDue.ts';
import { DEFAULT_ADMIN_EMAIL, sendAdminEmail, socialAlertEmail } from '../_shared/adminAlert.ts';

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

function toPayload(t: TransitRow & Record<string, any>, ctx?: PushContext) {
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
    ...(ctx
      ? {
          // The moment the Moon enters the sign (UTC), and one ready-made line for the post text.
          transit_start_utc: new Date(ctx.window.start_time).toISOString(),
          transit_end_utc: new Date(ctx.window.end_time).toISOString(),
          transit_times_line: transitTimesLine(Date.parse(ctx.window.start_time)),
          scheduled_post_utc: new Date(ctx.postAt).toISOString(),
          schedule_profile: 'primary',
        }
      : {}),
  };
}

/** Published, unposted transits (the candidates); the due rule then narrows them. */
async function fetchCandidates() {
  const { data, error } = await supabase
    .from('transits')
    .select('*')
    .eq('status', 'published');
  if (error) throw new Error(error.message);
  // The due rule decides which are unposted for their CURRENT approval (a marker older than the approval is stale).
  return ((data ?? []) as Array<TransitRow & Record<string, any>>).filter((r) => !postedForApproval(r));
}

/** Moon windows that had not ended at sinceMs (a missed card's window must still be known). */
async function fetchWindows(sinceMs: number): Promise<TransitWindow[]> {
  const { data, error } = await supabase
    .from('moon_transitions')
    .select('sign, start_time, end_time')
    .gt('end_time', new Date(sinceMs).toISOString())
    .order('start_time', { ascending: true })
    .limit(600);
  if (error) throw new Error(error.message);
  return (data ?? []).filter((w) => w.sign && w.start_time && w.end_time) as TransitWindow[];
}

const log = (step: string, details?: unknown) =>
  console.log(`[MAKE-SOCIAL-BRIDGE] ${step}`, details ? JSON.stringify(details) : '');

// The sending / failure / alert columns come from a migration that may not be applied yet. Every write to them
// is allowed to fail quietly so posting itself never depends on it.
/** PostgREST filter: no post yet for this approval (never posted, or the marker predates the approval). */
const unpostedFilter = (approvedAt: string | null) =>
  approvedAt ? `social_posted_at.is.null,social_posted_at.lt.${new Date(approvedAt).toISOString()}` : 'social_posted_at.is.null';

const claimStale = () => new Date(Date.now() - CLAIM_STALE_MINUTES * 60000).toISOString();

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
        postToWebhook: async (row, ctx) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
          try {
            const res = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event: 'transit.due', source: 'moonday-social-bridge', ...toPayload(row, ctx) }),
              signal: controller.signal,
            });
            await res.text().catch(() => undefined);
            return res.status;
          } finally {
            clearTimeout(timer);
          }
        },
        markPosted: async (rowId, at, approvedAt) => {
          const unposted = unpostedFilter(approvedAt);
          const full = await supabase
            .from('transits')
            .update({ social_posted_at: at, social_sending_at: null, social_fail_count: 0, social_last_error: null })
            .eq('id', rowId)
            .or(unposted);
          if (!full.error) return;
          // The extra columns may not exist yet: record the post itself.
          const { error } = await supabase
            .from('transits')
            .update({ social_posted_at: at })
            .eq('id', rowId)
            .or(unposted);
          if (error) throw new Error(error.message);
        },
        claim: async (rowId, nowMs, approvedAt) => {
          const { data, error } = await supabase
            .from('transits')
            .update({ social_sending_at: new Date(nowMs).toISOString() })
            .eq('id', rowId)
            .or(unpostedFilter(approvedAt))
            .or(`social_sending_at.is.null,social_sending_at.lt.${claimStale()}`)
            .select('id');
          if (error) {
            log('claim unavailable (migration not applied?), sending without it', { reason: error.message });
            return true;
          }
          return (data ?? []).length > 0;
        },
        release: async (rowId) => {
          await supabase.from('transits').update({ social_sending_at: null }).eq('id', rowId);
        },
        recordFailure: async (row: TransitRow & Record<string, any>, reason) => {
          const sameApproval = row.social_fail_for === row.published_at;
          const count = (sameApproval ? Number(row.social_fail_count) || 0 : 0) + 1;
          const { error } = await supabase
            .from('transits')
            .update({ social_fail_count: count, social_fail_for: row.published_at ?? null, social_last_error: reason.slice(0, 300), social_sending_at: null })
            .eq('id', row.id);
          if (error) {
            log('could not store the failure (migration not applied?)', { reason: error.message });
            return 1;
          }
          return count;
        },
        notify: async (alert) =>
          sendAdminEmail(socialAlertEmail(alert.kind, String(alert.row.sign ?? alert.row.id), alert.detail), {
            apiKey: Deno.env.get('RESEND_API_KEY'),
            to: Deno.env.get('ADMIN_ALERT_EMAIL') || DEFAULT_ADMIN_EMAIL,
          }),
        markAlerted: async (rowId, kind, windowKey) => {
          const field = kind === 'failed' ? 'social_fail_alert_for' : 'social_missed_alert_for';
          const { error } = await supabase.from('transits').update({ [field]: windowKey }).eq('id', rowId);
          if (error) throw new Error(error.message);
        },
        now: () => Date.now(),
        log,
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
    // Only DUE records: approved, unposted, post time reached, transit not over (see _shared/socialDue.ts).
    try {
      const candidates = await fetchCandidates();
      const windows = await fetchWindows(earliestApproval(candidates, Date.now()));
      const due = dueItems(candidates, windows, Date.now())
        .sort((x: DueItem<TransitRow>, y: DueItem<TransitRow>) => x.postAt - y.postAt)
        .slice(0, 12)
        .map((i) => toPayload(i.row, { window: i.window, postAt: i.postAt }));

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

