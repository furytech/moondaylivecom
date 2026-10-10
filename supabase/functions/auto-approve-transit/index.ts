import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { reportError } from '../_shared/errorTracking.ts';

// auto-approve-transit
// Automatically approves the current moon sign's transit AND its journal article.
// 1. Reads current moon sign from moon_transitions (where now() is between start_time and end_time)
// 2. Transits table: if the sign's record is 'pending', sets it to 'published' (unchanged behavior;
//    already-published is fine and no longer stops the run).
// 3. Journal article: finds the newest draft Transits article for that sign whose publish_at
//    (the ingress) has arrived, and sets it to 'approved'. auto-publish-posts then publishes it
//    on its next run and fires the channel hand-offs.
// 4. Returns JSON with what was approved.
//
// The article step is idempotent and only looks at articles whose ingress is recent
// (MAX_ARTICLE_AGE_HOURS), so a stale draft from an earlier cycle is never approved by surprise.

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// An article is only auto-approved while its ingress is this recent.
const MAX_ARTICLE_AGE_HOURS = 6;

function normalizeSign(raw: string): string {
  const clean = raw.trim().toLowerCase();
  const matched = ZODIAC_SIGNS.find((s) => s.toLowerCase() === clean);
  return matched || (raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[auto-approve-transit] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // Verify authorization: accepts X-Cron-Secret, Bearer service_role key, or x-internal-auth header
  const cronSecret = req.headers.get('X-Cron-Secret') || req.headers.get('x-cron-secret');
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  const internalHeader = req.headers.get('x-internal-auth');

  let isAuthorized = (bearerToken && bearerToken === supabaseServiceKey) ||
                     (internalHeader && internalHeader === supabaseServiceKey);

  if (!isAuthorized && cronSecret) {
    const { data: secretData } = await supabase
      .from('cron_secrets')
      .select('secret_value')
      .eq('name', 'auto-approve-transit')
      .maybeSingle();

    if (secretData && secretData.secret_value === cronSecret) {
      isAuthorized = true;
    }
  }

  // Fallback to generic auto-publish cron secret if shared
  if (!isAuthorized && cronSecret) {
    const { data: fallbackSecret } = await supabase
      .from('cron_secrets')
      .select('secret_value')
      .eq('name', 'auto-publish')
      .maybeSingle();

    if (fallbackSecret && fallbackSecret.secret_value === cronSecret) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const nowIso = new Date().toISOString();

    // 1. Reads the current moon sign from the moon_transitions table (where now() is between start_time and end_time)
    let currentMoonSign: string | null = null;
    let ingressStartIso: string | null = null;

    const { data: windowRow, error: windowError } = await supabase
      .from('moon_transitions')
      .select('sign, to_sign, start_time, end_time')
      .lte('start_time', nowIso)
      .gte('end_time', nowIso)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (windowRow) {
      currentMoonSign = windowRow.sign || windowRow.to_sign || null;
      ingressStartIso = windowRow.start_time ?? null;
    }

    // Fallback if start_time / end_time columns are empty or during transition table migration:
    // query by transition_at <= now() ordered by transition_at desc
    if (!currentMoonSign) {
      const { data: transitionRow } = await supabase
        .from('moon_transitions')
        .select('sign, to_sign, from_sign, transition_at')
        .lte('transition_at', nowIso)
        .order('transition_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (transitionRow) {
        currentMoonSign = transitionRow.sign || transitionRow.to_sign || null;
        ingressStartIso = transitionRow.transition_at ?? null;
      }
    }

    if (!currentMoonSign) {
      return new Response(
        JSON.stringify({
          error: 'Current moon sign could not be determined from moon_transitions',
          now: nowIso,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const targetSign = normalizeSign(currentMoonSign);

    // 2. Finds the matching transit record in the transits table where sign matches the current moon sign and status = 'pending'
    const { data: pendingTransit, error: transitLookupError } = await supabase
      .from('transits')
      .select('id, sign, status')
      .ilike('sign', targetSign)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();

    if (transitLookupError) {
      await reportError({
        source: 'auto-approve-transit',
        severity: 'error',
        message: `Failed to query transits: ${transitLookupError.message}`,
        context: { targetSign },
      });
      return new Response(
        JSON.stringify({ error: transitLookupError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Transits table: publish the pending record. Already-published is fine —
    //    the journal article below is what actually drives the channels.
    let transitResult: { id: string | null; status: string | null; transitApproved: boolean } = {
      id: null,
      status: null,
      transitApproved: false,
    };

    if (pendingTransit) {
      const publishedAt = new Date().toISOString();
      const { data: updatedTransit, error: updateError } = await supabase
        .from('transits')
        .update({
          status: 'published',
          published_at: publishedAt,
          updated_at: publishedAt,
        })
        .eq('id', pendingTransit.id)
        .select('id, sign, status, published_at')
        .single();

      if (updateError) {
        await reportError({
          source: 'auto-approve-transit',
          severity: 'critical',
          message: `Failed to update transit status: ${updateError.message}`,
          context: { id: pendingTransit.id, sign: pendingTransit.sign },
        });
        return new Response(
          JSON.stringify({ error: updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      transitResult = { id: updatedTransit.id, status: updatedTransit.status, transitApproved: true };
    } else {
      const { data: publishedTransit } = await supabase
        .from('transits')
        .select('id, status')
        .ilike('sign', targetSign)
        .eq('status', 'published')
        .limit(1)
        .maybeSingle();
      transitResult = {
        id: publishedTransit?.id ?? null,
        status: publishedTransit?.status ?? null,
        transitApproved: false,
      };
    }

    // 4. Journal article: approve the newest draft Transits article for this sign
    //    whose ingress (publish_at) has arrived and is recent.
    const oldestAllowed = new Date(Date.now() - MAX_ARTICLE_AGE_HOURS * 60 * 60 * 1000).toISOString();
    const { data: article, error: articleLookupError } = await supabase
      .from('blog_posts')
      .select('id, slug, status, publish_at, content, substack_post')
      .eq('category', 'Transits')
      .eq('zodiac_sign_tag', targetSign)
      .gte('publish_at', oldestAllowed)
      .lte('publish_at', nowIso)
      .order('publish_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (articleLookupError) {
      await reportError({
        source: 'auto-approve-transit',
        severity: 'error',
        message: `Failed to look up journal article: ${articleLookupError.message}`,
        context: { targetSign },
      });
      return new Response(
        JSON.stringify({ error: articleLookupError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let articleResult: { id: string | null; slug: string | null; status: string | null; approved: boolean; note?: string } = {
      id: null,
      slug: null,
      status: null,
      approved: false,
    };

    if (!article) {
      articleResult.note = `No Transits article for ${targetSign} with an ingress in the last ${MAX_ARTICLE_AGE_HOURS} hours`;
      // This job runs every 30 minutes, so only raise an alert while the ingress is
      // fresh (an article should exist by now). Later in the sign's window a missing
      // article is expected and stays quiet.
      const ingressAgeMs = ingressStartIso ? Date.now() - new Date(ingressStartIso).getTime() : Infinity;
      if (ingressAgeMs >= 0 && ingressAgeMs <= MAX_ARTICLE_AGE_HOURS * 60 * 60 * 1000) {
        await reportError({
          source: 'auto-approve-transit',
          severity: 'error',
          message: articleResult.note,
          context: { targetSign, nowIso, ingressStartIso },
          throttleMinutes: 120,
        });
      }
    } else if (article.status !== 'draft') {
      // Already approved / scheduled / published — nothing to do.
      articleResult = {
        id: article.id,
        slug: article.slug,
        status: article.status,
        approved: false,
        note: `Article already ${article.status}`,
      };
    } else if (!article.content?.trim()) {
      articleResult = {
        id: article.id,
        slug: article.slug,
        status: article.status,
        approved: false,
        note: 'Article has no content — not approved',
      };
      await reportError({
        source: 'auto-approve-transit',
        severity: 'error',
        message: `Article for ${targetSign} has no content; not approved`,
        context: { id: article.id, slug: article.slug },
        throttleMinutes: 120,
      });
    } else {
      const { data: approvedArticle, error: approveError } = await supabase
        .from('blog_posts')
        .update({ status: 'approved' })
        .eq('id', article.id)
        .eq('status', 'draft')
        .select('id, slug, status')
        .single();

      if (approveError) {
        await reportError({
          source: 'auto-approve-transit',
          severity: 'critical',
          message: `Failed to approve journal article: ${approveError.message}`,
          context: { id: article.id, slug: article.slug },
        });
        return new Response(
          JSON.stringify({ error: approveError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      articleResult = {
        id: approvedArticle.id,
        slug: approvedArticle.slug,
        status: approvedArticle.status,
        approved: true,
      };
    }

    // 5. Return what happened
    return new Response(
      JSON.stringify({
        sign: targetSign,
        transit: transitResult,
        article: articleResult,
        approved: transitResult.transitApproved || articleResult.approved,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const errorMsg = (err as Error)?.message || 'Internal server error';
    await reportError({
      source: 'auto-approve-transit',
      severity: 'critical',
      message: `Unexpected error: ${errorMsg}`,
    });
    return new Response(
      JSON.stringify({ error: errorMsg }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
