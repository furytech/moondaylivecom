import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { reportError } from '../_shared/errorTracking.ts';

// auto-approve-transit
// Automatically approves and publishes the transit for the current moon sign.
// 1. Reads current moon sign from moon_transitions (where now() is between start_time and end_time)
// 2. Finds matching pending transit record in transits table (sign matches current moon sign and status = 'pending')
// 3. Sets that record's status to 'published'
// 4. Returns JSON response with the approved transit id and sign

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

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

    if (!pendingTransit) {
      // Check whether the transit is already published
      const { data: publishedTransit } = await supabase
        .from('transits')
        .select('id, sign, status, published_at')
        .ilike('sign', targetSign)
        .eq('status', 'published')
        .limit(1)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          message: publishedTransit
            ? `Transit for ${targetSign} is already published`
            : `No pending transit found for ${targetSign}`,
          id: publishedTransit?.id ?? null,
          sign: targetSign,
          status: publishedTransit?.status ?? null,
          approved: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Sets that record's status to 'published'
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

    // 4. Returns a JSON response with the approved transit id and sign
    return new Response(
      JSON.stringify({
        id: updatedTransit.id,
        sign: updatedTransit.sign,
        status: updatedTransit.status,
        published_at: updatedTransit.published_at,
        approved: true,
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
