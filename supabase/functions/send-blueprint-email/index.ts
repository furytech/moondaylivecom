// supabase/functions/send-blueprint-email/index.ts
// Triggered by the on_auth_user_email_confirmed DB trigger (auth.users.email_confirmed_at NULL -> value)
// Sends the Blueprint combination email via Resend

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ─── Env ───────────────────────────────────────────────────────────────────
const RESEND_API_KEY            = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Optional alternate auth: Bearer SEND_BLUEPRINT_SECRET.
const FUNCTION_SECRET = Deno.env.get("SEND_BLUEPRINT_SECRET");

// ─── Constants ─────────────────────────────────────────────────────────────
const FROM_ADDRESS   = "Moonday Live <noreply@moondaylive.com>";
const BLUEPRINT_URL  = "https://moondaylive.com/blueprint";

// ─── Helpers ───────────────────────────────────────────────────────────────
function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

// ─── Email HTML ────────────────────────────────────────────────────────────
function buildEmailHtml(opts: {
  firstName: string;
  sunSign: string;
  moonSign: string;
  combinationTitle: string;
  synthesisText: string;
}): string {
  const { firstName, sunSign, moonSign, combinationTitle, synthesisText } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Blueprint is ready</title>
</head>
<body style="margin:0;padding:0;background:#0d0d14;font-family:Georgia,serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background:#0d0d14;min-width:100%;">
  <tr><td align="center" style="padding:40px 16px;">

    <table role="presentation" width="100%" style="max-width:560px;
           background:#13131f;border:1px solid rgba(212,175,55,.25);
           border-radius:12px;overflow:hidden;">

      <!-- HEADER -->
      <tr><td style="padding:36px 40px 24px;text-align:center;
                     border-bottom:1px solid rgba(212,175,55,.15);">
        <p style="margin:0 0 6px;color:#d4af37;font-size:11px;
                  letter-spacing:.15em;text-transform:uppercase;">
          Moonday Live
        </p>
        <h1 style="margin:0;color:#f0e8cc;font-size:26px;font-weight:normal;
                   line-height:1.35;">
          Your Blueprint is ready,&nbsp;${firstName}
        </h1>
      </td></tr>

      <!-- NATAL BADGE -->
      <tr><td style="padding:28px 40px 0;text-align:center;">
        <p style="margin:0 0 6px;color:#8a7a5a;font-size:11px;
                  letter-spacing:.14em;text-transform:uppercase;">
          Your natal combination
        </p>
        <p style="margin:0;color:#d4af37;font-size:14px;letter-spacing:.1em;">
          ☀&thinsp;${cap(sunSign)} Sun &nbsp;&middot;&nbsp; ☽&thinsp;${cap(moonSign)} Moon
        </p>
      </td></tr>

      <!-- COMBINATION TITLE -->
      <tr><td style="padding:10px 40px 24px;text-align:center;">
        <h2 style="margin:0;color:#f0e8cc;font-size:22px;font-weight:normal;
                   font-style:italic;line-height:1.4;">
          ${combinationTitle}
        </h2>
      </td></tr>

      <!-- DIVIDER -->
      <tr><td style="padding:0 40px;">
        <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,175,55,.4),transparent);"></div>
      </td></tr>

      <!-- SYNTHESIS TEXT -->
      <tr><td style="padding:28px 40px;">
        <p style="margin:0;color:#c4b89a;font-size:15px;line-height:1.85;">
          ${synthesisText}
        </p>
      </td></tr>

      <!-- DIVIDER -->
      <tr><td style="padding:0 40px 28px;">
        <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,175,55,.4),transparent);"></div>
      </td></tr>

      <!-- WHAT NEXT LABEL -->
      <tr><td style="padding:0 40px 18px;text-align:center;">
        <p style="margin:0;color:#8a7a5a;font-size:12px;letter-spacing:.12em;
                  text-transform:uppercase;">
          What happens next?
        </p>
      </td></tr>

      <!-- PRIMARY CTA — BLUEPRINT -->
      <tr><td style="padding:0 40px 36px;text-align:center;">
        <a href="${BLUEPRINT_URL}"
           style="display:inline-block;background:#d4af37;color:#0d0d14;
                  text-decoration:none;font-family:Georgia,serif;font-size:14px;
                  font-weight:bold;letter-spacing:.07em;padding:15px 36px;
                  border-radius:6px;">
          Open my Blueprint
        </a>
        <p style="margin:12px 0 0;color:#6a5e42;font-size:11px;line-height:1.5;">
          When you're ready to see how each Moon shift meets your chart, Luminary is here.
        </p>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="padding:18px 40px 26px;text-align:center;
                     border-top:1px solid rgba(212,175,55,.15);">
        <p style="margin:0 0 3px;color:#6a5e42;font-size:11px;">
          You received this because you signed up at moondaylive.com
        </p>
        <p style="margin:0;color:#6a5e42;font-size:11px;">
          &copy; 2026 Moonday Live
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Main handler ──────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth: DB trigger sends X-Cron-Secret (stored in public.cron_secrets);
    // Bearer SEND_BLUEPRINT_SECRET is also accepted if configured.
    let authorized = false;
    const cronSecret = req.headers.get("x-cron-secret");
    if (cronSecret) {
      const { data: secretRow } = await supabase
          .from("cron_secrets")
          .select("secret_value")
          .eq("name", "send-blueprint-email")
          .maybeSingle();
      authorized = !!secretRow && secretRow.secret_value === cronSecret;
    }
    if (!authorized && FUNCTION_SECRET) {
      authorized = req.headers.get("authorization") === `Bearer ${FUNCTION_SECRET}`;
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    const payload = await req.json();

    // Only the email-confirmation trigger sends the Blueprint email.
    // Legacy user_profiles INSERT/UPDATE webhooks are ignored.
    if (payload.type !== "EMAIL_CONFIRMED" || !payload.user_id) {
      return new Response(
          JSON.stringify({ skipped: true, reason: "not an EMAIL_CONFIRMED event" }),
          { status: 200, headers }
      );
    }

    const user_id: string = payload.user_id;

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("natal_sun_sign, natal_moon_sign, first_name, email, blueprint_email_sent_at")
        .eq("user_id", user_id)
        .maybeSingle();

    if (!profile) {
      console.error("No profile for confirmed user:", user_id);
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers });
    }

    const sun_sign = profile.natal_sun_sign;
    const moon_sign = profile.natal_moon_sign;
    let email: string | null = profile.email ?? payload.email ?? null;

    // Friendly first name — use first_name, fallback to "friend"
    const firstName = profile.first_name?.trim() || "friend";

    if (!sun_sign || !moon_sign) {
      console.error("Missing natal_sun_sign or natal_moon_sign", user_id);
      return new Response(
          JSON.stringify({ error: "Missing sun_sign or moon_sign" }),
          { status: 400, headers }
      );
    }

    // Fetch email from auth.users if not available
    if (!email) {
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(user_id);
      if (authError || !authData?.user?.email) {
        console.error("Could not fetch email for user:", user_id, authError);
        return new Response(
            JSON.stringify({ error: "Could not resolve user email" }),
            { status: 500, headers }
        );
      }
      email = authData.user.email!;
    }

    // ── Idempotency: atomically claim the send (once per user) ──
    const { data: claimed } = await supabase
        .from("user_profiles")
        .update({ blueprint_email_sent_at: new Date().toISOString() })
        .eq("user_id", user_id)
        .is("blueprint_email_sent_at", null)
        .select("user_id");

    if (!claimed || claimed.length === 0) {
      console.log("Blueprint already sent, skipping:", user_id);
      return new Response(
          JSON.stringify({ skipped: true, reason: "already_sent" }),
          { status: 200, headers }
      );
    }

    const releaseClaim = () =>
        supabase.from("user_profiles").update({ blueprint_email_sent_at: null }).eq("user_id", user_id);

    // ── Fetch combination profile ──────────────────────────────────────────
    const { data: combo, error: comboError } = await supabase
        .from("combination_profiles")
        .select("combination_title, combination_synthesis")
        .eq("sun_sign", sun_sign)
        .eq("moon_sign", moon_sign)
        .maybeSingle();

    if (comboError || !combo) {
      console.error("Combination profile not found:", { sun_sign, moon_sign }, comboError);
      await releaseClaim();
      return new Response(
          JSON.stringify({ error: "Combination profile not found", sun_sign, moon_sign }),
          { status: 404, headers }
      );
    }

    // Resolve synthesis text
    const synthesisText: string =
        combo.combination_synthesis ??
        "Your unique natal combination carries a signature only you embody. Explore it fully in your Luminary profile.";

    const combinationTitle: string =
        combo.combination_title ?? `${cap(sun_sign)} Sun · ${cap(moon_sign)} Moon`;

    // ── Build & send email via Resend ─────────────────────────────────────
    const html = buildEmailHtml({ firstName, sunSign: sun_sign, moonSign: moon_sign, combinationTitle, synthesisText });

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        subject: `Your Blueprint is ready, ${firstName}`,
        html,
      }),
    });

    const resendBody = await resendRes.json();

    // ── Log to email_send_log ─────────────────────────────────────────────
    if (!resendRes.ok) {
      console.error("Resend error:", resendBody);
      await releaseClaim();
      await supabase.from("email_send_log").insert({
        user_id,
        email_type: "blueprint",
        status: "failed",
        error_detail: JSON.stringify(resendBody),
      });
      return new Response(
          JSON.stringify({ error: "Email delivery failed", detail: resendBody }),
          { status: 500, headers }
      );
    }

    await supabase.from("email_send_log").insert({
      user_id,
      email_type: "blueprint",
      status: "sent",
      resend_id: resendBody.id,
    });

    console.log("Blueprint email sent:", { user_id, email, resend_id: resendBody.id });
    return new Response(
        JSON.stringify({ success: true, resend_id: resendBody.id }),
        { status: 200, headers }
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Unhandled error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers });
  }
});
