import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { reportError, errorText } from '../_shared/errorTracking.ts';
import {
  DISPATCH_POST_COLUMNS,
  resolveImageUrl,
  resolveSourceUrl,
  resolveTitle,
  SITE_URL,
  type DispatchPost,
} from '../_shared/dispatchPayloads.ts';

// facebook-post
// Publishes a transit straight to the Moonday Live Facebook Page through the
// Graph API (v20.0). No middleman: the permanent Page Access Token lives in
// project secrets and the call goes out from here.
//
// Body: { post_id } to publish a stored transit, or { message } for a manual
// test post. Admin (or service role) only.

const GRAPH = 'https://graph.facebook.com/v20.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

/** Strips markdown/HTML down to the plain prose Facebook actually renders. */
const toPlainText = (raw: string) =>
  raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/[*_`>]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/** Page-friendly composition: hook, body, link back to the site. */
function buildMessage(post: DispatchPost): string {
  const title = resolveTitle(post);
  const body = toPlainText(post.excerpt?.trim() || post.content || '');
  const trimmed = body.length > 1200 ? `${body.slice(0, 1200).trimEnd()}…` : body;
  return [title, trimmed, `Track the cycle live: ${resolveSourceUrl(post)}`]
    .filter(Boolean)
    .join('\n\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const token = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN')?.trim();
    const pageId = Deno.env.get('FACEBOOK_PAGE_ID')?.trim();
    if (!token || !pageId) {
      return json({ error: 'Facebook Page credentials are not configured yet.' }, 400);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!bearer) return json({ error: 'Unauthorized' }, 401);

    if (bearer !== Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      const { data: claims, error: claimsError } = await supabase.auth.getClaims(bearer);
      if (claimsError || !claims?.claims) return json({ error: 'Unauthorized' }, 401);
      const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
        _user_id: claims.claims.sub,
        _role: 'admin',
      });
      if (roleError || !isAdmin) return json({ error: 'Forbidden' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const postId = typeof body?.post_id === 'string' ? body.post_id.trim() : '';
    const manual = typeof body?.message === 'string' ? body.message.trim() : '';

    // Diagnostic: tells us whether the stored token is a Page token for this
    // Page (never returns the token itself).
    if (body?.diagnose === true) {
      const meRes = await fetch(
        `${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`,
      );
      const me = await meRes.json().catch(() => ({}));
      return json(
        {
          configured_page_id: pageId,
          token_identity_id: me?.id ?? null,
          token_identity_name: me?.name ?? null,
          token_is_page_token: me?.id === pageId,
          graph_error: me?.error?.message ?? null,
          pages: await (async () => {
            const r = await fetch(
              `${GRAPH}/me/accounts?fields=id,name&access_token=${encodeURIComponent(token)}`,
            );
            const d = await r.json().catch(() => ({}));
            return Array.isArray(d?.data)
              ? d.data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))
              : (d?.error?.message ?? null);
          })(),
        },
        200,
      );
    }

    let message = manual;
    let imageUrl: string | null = null;
    let link = SITE_URL;

    if (postId) {
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select(DISPATCH_POST_COLUMNS)
        .eq('id', postId)
        .maybeSingle();
      if (error) return json({ error: 'Database error loading the post.' }, 500);
      if (!post) return json({ error: 'Post not found.' }, 404);
      message = buildMessage(post);
      imageUrl = resolveImageUrl(post);
      link = resolveSourceUrl(post);
    }

    if (!message) return json({ error: 'Nothing to post: send post_id or message.' }, 400);
    if (message.length > 5000) message = `${message.slice(0, 5000)}…`;

    // The stored credential may be a User token; resolve the Page token from it.
    let pageToken = token;
    {
      const meRes = await fetch(`${GRAPH}/me?fields=id&access_token=${encodeURIComponent(token)}`);
      const me = await meRes.json().catch(() => ({}));
      if (me?.id && me.id !== pageId) {
        const accRes = await fetch(
          `${GRAPH}/me/accounts?fields=id,access_token&access_token=${encodeURIComponent(token)}`,
        );
        const acc = await accRes.json().catch(() => ({}));
        const match = Array.isArray(acc?.data)
          ? acc.data.find((p: { id: string }) => p.id === pageId)
          : null;
        if (!match?.access_token) {
          return json(
            { error: 'The stored Facebook token cannot manage this Page. Regenerate it.' },
            400,
          );
        }
        pageToken = match.access_token;
      }
    }

    // A photo post carries the sign graphic; without an image we post the link.
    const endpoint = imageUrl ? `${GRAPH}/${pageId}/photos` : `${GRAPH}/${pageId}/feed`;
    const form = new URLSearchParams({ access_token: pageToken });
    if (imageUrl) {
      form.set('url', imageUrl);
      form.set('caption', message);
    } else {
      form.set('message', message);
      if (postId) form.set('link', link);
    }

    const res = await fetch(endpoint, { method: 'POST', body: form });
    const result = await res.json().catch(() => ({}));

    if (!res.ok || result?.error) {
      const detail = result?.error?.message || `Graph API returned ${res.status}`;
      await reportError({
        source: 'facebook-post',
        severity: 'error',
        message: `Facebook publish failed: ${detail}`,
        context: { post_id: postId || null, status: res.status },
      });
      return json({ error: detail }, 400);
    }

    const fbId = result.post_id || result.id || null;
    return json(
      {
        ok: true,
        facebook_id: fbId,
        url: fbId ? `https://www.facebook.com/${fbId}` : null,
        with_image: !!imageUrl,
      },
      200,
    );
  } catch (e) {
    await reportError({
      source: 'facebook-post',
      severity: 'error',
      message: `Facebook publish crashed: ${errorText(e)}`,
      context: { stack: e instanceof Error ? e.stack?.slice(0, 1500) : undefined },
    });
    return json({ error: 'Internal error' }, 500);
  }
});
