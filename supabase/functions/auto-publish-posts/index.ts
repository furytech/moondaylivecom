import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { reportError, errorText } from '../_shared/errorTracking.ts';
import { notifyTelegram } from '../_shared/telegram.ts';
import { sendSubstackDraft } from '../_shared/substackBridge.ts';


const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const cronSecret = req.headers.get('X-Cron-Secret');
    const { data: secretData, error: secretError } = await supabase
      .from('cron_secrets')
      .select('secret_value')
      .eq('name', 'auto-publish')
      .single();

    if (secretError) {
      await reportError({
        source: 'auto-publish-posts',
        severity: 'critical',
        message: `Cron secret lookup failed: ${secretError.message}`,
        context: { secretName: 'auto-publish' },
      });
    }

    if (secretError || !secretData || cronSecret !== secretData.secret_value) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    // Posts that should already be live but are still sitting approved signal a
    // stalled publish workflow — surface them even when this run succeeds.
    const staleCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: stale } = await supabase
      .from('blog_posts')
      .select('id, slug, publish_at')
      .in('status', ['approved', 'scheduled'])
      .lte('publish_at', staleCutoff);

    const { data, error } = await supabase
      .from('blog_posts')
      .update({ status: 'published', published_at: now })
      .in('status', ['approved', 'scheduled'])
      .lte('publish_at', now)
      .select();

    if (error) {
      await reportError({
        source: 'auto-publish-posts',
        severity: 'critical',
        message: `Failed to publish approved posts: ${error.message}`,
        context: { runAt: now },
      });
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ping the owner once per post that went live, with a deep link into the
    // editor so the Substack/Reddit hand-off can happen from a phone.
    let substackDrafted = 0;
    for (const post of data ?? []) {
      await notifyTelegram({
        kind: 'published',
        post_id: post.id,
        title: post.title,
        channel: 'Moonday Live blog',
      });

      // Email-to-draft bridge: the moment a transit post goes live, its
      // newsletter edition lands in the editor's inbox pre-formatted, so the
      // Substack hand-off is a paste instead of a rebuild.
      const bridge = await sendSubstackDraft(supabase, post);
      if (bridge.sent) {
        substackDrafted += 1;
        await notifyTelegram({
          kind: 'published',
          post_id: post.id,
          title: post.title,
          channel: 'Substack draft emailed — ready to paste',
        });
      }
    }

    if (stale && stale.length > 0) {
      await reportError({
        source: 'auto-publish-posts',
        severity: 'error',
        message: `${stale.length} approved post(s) overdue for publishing by more than 2 hours`,
        context: { overdue: stale.slice(0, 20) },
        throttleMinutes: 120,
      });
      for (const post of stale.slice(0, 5)) {
        await notifyTelegram({
          kind: 'missed',
          post_id: post.id,
          title: post.slug,
          channel: 'Scheduled publish overdue',
        });
      }
    }


    return new Response(
      JSON.stringify({ published: data?.length || 0, substack_drafted: substackDrafted, posts: data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    await reportError({
      source: 'auto-publish-posts',
      severity: 'critical',
      message: `Unhandled failure: ${errorText(err)}`,
      context: { stack: err instanceof Error ? err.stack?.slice(0, 1500) : undefined },
    });
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
