import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { reportError, errorText } from '../_shared/errorTracking.ts';

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

    if (stale && stale.length > 0) {
      await reportError({
        source: 'auto-publish-posts',
        severity: 'error',
        message: `${stale.length} approved post(s) overdue for publishing by more than 2 hours`,
        context: { overdue: stale.slice(0, 20) },
        throttleMinutes: 120,
      });
    }

    return new Response(
      JSON.stringify({ published: data?.length || 0, posts: data }),
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
