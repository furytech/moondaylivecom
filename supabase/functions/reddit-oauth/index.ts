import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * Reddit OAuth callback — one-time setup helper.
 *
 * Flow:
 * 1. Admin visits this function URL in a browser.
 * 2. If REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET are set, they see an
 *    "Authorize Reddit" link.
 * 3. Reddit redirects back here with ?code=XXX.
 * 4. This function exchanges the code for an access_token + refresh_token.
 * 5. The refresh_token is stored in the cron_secrets table (name:
 *    'reddit_refresh_token') so the reddit-auto-post function can read it
 *    at runtime without any manual secret copy-paste.
 */

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const REDDIT_CLIENT_ID = Deno.env.get('REDDIT_CLIENT_ID');
const REDDIT_CLIENT_SECRET = Deno.env.get('REDDIT_CLIENT_SECRET');
const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/reddit-oauth`;

function html(body: string, status = 200): Response {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Moonday Live — Reddit Setup</title><style>
      body{font-family:system-ui,-apple-system,sans-serif;background:#011124;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:2rem}
      .card{background:#0a1a3a;border:1px solid #1e3a5f;border-radius:16px;padding:2.5rem;max-width:520px;text-align:center}
      h1{font-size:1.4rem;margin:0 0 1rem;color:#a5b4fc}
      p{line-height:1.6;color:#94a3b8;margin:0.75rem 0}
      a.btn{display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:0.85rem 2rem;border-radius:10px;font-weight:600;margin-top:1rem;font-size:1rem}
      a.btn:hover{background:#818cf8}
      .ok{color:#4ade80;font-size:2rem;margin-bottom:0.5rem}
      .err{color:#f87171}
      code{background:#1e293b;padding:0.2rem 0.4rem;border-radius:4px;font-size:0.85rem;color:#93c5fd;word-break:break-all}
    </style></head><body><div class="card">${body}</div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  // Reddit redirected with an error (user denied, etc.)
  if (error) {
    return html(
      `<div class="err">❌</div><h1>Authorization denied</h1><p>Reddit returned: <code>${error}</code></p><p>You can try again by visiting this page directly.</p>`,
    );
  }

  // We have a code — exchange it for tokens
  if (code) {
    if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
      return html(
        `<div class="err">⚠️</div><h1>Secrets not set</h1><p>REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET must be saved as secrets before completing authorization.</p>`,
      );
    }

    try {
      const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`)}`,
          'User-Agent': 'MoondayLive/1.0 by u/moondaylive',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
        }),
      });

      const tokens = await tokenRes.json();

      if (!tokens.refresh_token) {
        const detail = tokens.error_description || tokens.error || JSON.stringify(tokens);
        return html(
          `<div class="err">❌</div><h1>Token exchange failed</h1><p>Reddit did not return a refresh token.</p><p><code>${detail}</code></p>`,
        );
      }

      // Store the refresh token in cron_secrets (delete first to avoid dupes)
      await supabase.from('cron_secrets').delete().eq('name', 'reddit_refresh_token');
      const { error: insertError } = await supabase.from('cron_secrets').insert({
        name: 'reddit_refresh_token',
        secret_value: tokens.refresh_token,
      });

      if (insertError) {
        return html(
          `<div class="err">❌</div><h1>Storage failed</h1><p>Token received but could not be stored: <code>${insertError.message}</code></p>`,
        );
      }

      return html(
        `<div class="ok">✅</div><h1>Reddit connected!</h1><p>Your refresh token has been stored securely. Reddit auto-posting is ready to go.</p><p>You can close this page.</p>`,
      );
    } catch (err) {
      return html(
        `<div class="err">❌</div><h1>Error</h1><p><code>${(err as Error).message}</code></p>`,
      );
    }
  }

  // No code — show the authorization page
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    return html(
      `<div class="err">⚠️</div><h1>Secrets not set yet</h1><p>Save <code>REDDIT_CLIENT_ID</code> and <code>REDDIT_CLIENT_SECRET</code> as project secrets first, then revisit this page.</p>`,
    );
  }

  const state = crypto.randomUUID();
  const authUrl =
    `https://www.reddit.com/api/v1/authorize` +
    `?client_id=${encodeURIComponent(REDDIT_CLIENT_ID)}` +
    `&response_type=code` +
    `&state=${state}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&duration=permanent` +
    `&scope=submit%20identity`;

  return html(
    `<h1>Connect Reddit to Moonday Live</h1>` +
    `<p>Click below to authorize the Moonday Live Reddit app. This grants permission to submit posts to your subreddit on your behalf.</p>` +
    `<p style="font-size:0.85rem;color:#64748b">Scope: <code>submit</code> + <code>identity</code> · Duration: permanent</p>` +
    `<a href="${authUrl}" class="btn">Authorize Reddit →</a>`,
  );
});
