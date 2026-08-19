import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { reportError, errorText } from '../_shared/errorTracking.ts';
import { sendSubstackDraft } from '../_shared/substackBridge.ts';

// substack-bridge-send
// Admin-triggered resend of the formatted Substack edition. The bridge fires
// automatically on publish; this exists for reruns after an edit.

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const { data: claims, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace('Bearer ', ''),
    );
    if (claimsError || !claims?.claims) return json({ error: 'Unauthorized' }, 401);

    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: claims.claims.sub,
      _role: 'admin',
    });
    if (roleError || !isAdmin) return json({ error: 'Forbidden' }, 403);

    const body = await req.json().catch(() => ({}));
    const postId = typeof body?.post_id === 'string' ? body.post_id.trim() : '';
    if (!postId) return json({ error: 'post_id is required' }, 400);

    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select(
        'id, slug, title, category, substack_post, zodiac_sign_tag, publish_at, published_at, substack_bridge_sent_at',
      )
      .eq('id', postId)
      .maybeSingle();

    if (postError) return json({ error: postError.message }, 500);
    if (!post) return json({ error: 'Post not found' }, 404);

    const result = await sendSubstackDraft(supabase, post, { force: true });

    if (!result.sent) {
      const reasons: Record<string, string> = {
        no_substack_copy: 'This post has no newsletter copy yet — generate it first.',
        no_recipients: 'No admin email is configured to receive the draft.',
      };
      return json(
        { error: reasons[result.reason ?? ''] ?? 'Could not send the draft.', reason: result.reason },
        400,
      );
    }

    return json({ ok: true, recipients: result.recipients }, 200);
  } catch (e) {
    await reportError({
      source: 'substack-bridge-send',
      severity: 'error',
      message: `Manual Substack draft send failed: ${errorText(e)}`,
    });
    return json({ error: 'Internal error' }, 500);
  }
});
