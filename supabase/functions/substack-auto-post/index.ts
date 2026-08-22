import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { reportError, errorText } from '../_shared/errorTracking.ts';
import { notifyTelegram } from '../_shared/telegram.ts';
import { publishPostToSubstack } from '../_shared/substackPublish.ts';

// substack-auto-post
// Hands one transit edition to the Substack n8n webhook. Callable by the
// internal pipeline (service role) or by an admin from the Journal dashboard.

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const postId = typeof body?.post_id === 'string' ? body.post_id.trim() : '';
    if (!postId) return json({ error: 'post_id is required' }, 400);

    const authHeader = req.headers.get('Authorization') ?? '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!bearer) return json({ error: 'Unauthorized' }, 401);

    const isServiceRole = bearer === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!isServiceRole) {
      const { data: claims, error: claimsError } = await supabase.auth.getClaims(bearer);
      if (claimsError || !claims?.claims) return json({ error: 'Unauthorized' }, 401);

      const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
        _user_id: claims.claims.sub,
        _role: 'admin',
      });
      if (roleError || !isAdmin) return json({ error: 'Forbidden' }, 403);
    }

    const result = await publishPostToSubstack(supabase, postId, {
      force: body?.force === true,
      triggerSource: 'manual',
    });

    if (!result.ok) {
      if (result.skipped) return json({ skipped: true, reason: result.reason }, 200);
      return json({ error: result.reason }, 400);
    }

    await notifyTelegram({
      kind: 'published',
      post_id: postId,
      title: result.title,
      channel: `Substack — sent to the n8n webhook${result.url ? `: ${result.url}` : ''}`,
    });

    return json({ ok: true, url: result.url }, 200);
  } catch (e) {
    await reportError({
      source: 'substack-auto-post',
      severity: 'error',
      message: `Substack auto-post failed: ${errorText(e)}`,
      context: { stack: e instanceof Error ? e.stack?.slice(0, 1500) : undefined },
    });
    return json({ error: 'Internal error' }, 500);
  }
});
