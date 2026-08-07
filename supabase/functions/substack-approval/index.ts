import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { reportError, errorText } from '../_shared/errorTracking.ts';

// substack-approval
// Receives the reviewed Substack payload from the Moonday admin dashboard and
// forwards it to the n8n production webhook. Routing through the backend
// avoids the HTTPS→HTTP mixed-content block that would occur if the browser
// sent the request directly to the n8n webhook.

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const N8N_WEBHOOK_URL = Deno.env.get('N8N_SUBSTACK_WEBHOOK_URL');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claims?.claims) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const userId = claims.claims.sub;
  const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });

  if (roleError || !isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const payload = await req.json();

    // Admins may override the destination from the dashboard; fall back to the
    // configured secret when the field is empty.
    const { webhook_url: overrideUrl, ...forwardPayload } = payload ?? {};
    let targetUrl = N8N_WEBHOOK_URL;
    if (typeof overrideUrl === 'string' && overrideUrl.trim()) {
      let parsed: URL;
      try {
        parsed = new URL(overrideUrl.trim());
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid webhook URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return new Response(
          JSON.stringify({ error: 'Webhook URL must use http or https' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      targetUrl = parsed.toString();
    }

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Substack webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const n8nResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forwardPayload),
    });

    const n8nBody = await n8nResponse.text();

    if (!n8nResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'n8n returned an error', n8n_status: n8nResponse.status, n8n_body: n8nBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, n8n_status: n8nResponse.status }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    await reportError({
      source: 'substack-approval',
      severity: 'critical',
      message: `Substack approval forward failed: ${errorText(e)}`,
      context: { stack: e instanceof Error ? e.stack?.slice(0, 1500) : undefined },
    });
    return new Response(
      JSON.stringify({ error: e.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
