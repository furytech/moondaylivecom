import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface RequestBody {
  email: string;
  userId?: string | null;
  firstName?: string;
  sunSign: string;
  moonSign: string;
  blueprint?: {
    combination_title?: string;
    combination_synthesis?: string;
    solar_essence?: string;
    lunar_essence?: string;
    default_behaviors?: unknown;
  } | null;
}

function getFirstSentence(text?: string | null): string {
  if (!text) return "";
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\.\s*\n+/g, ". ")
    .replace(/\n+/g, " ")
    .trim();
  const match = normalized.match(/^.*?[.!?](\s|$)/);
  if (match) return match[0].trim();
  const firstDot = normalized.indexOf(".");
  if (firstDot !== -1) return normalized.slice(0, firstDot + 1).trim();
  return normalized ? `${normalized}.` : "";
}

function buildWelcomeTeaserEmailHtml({
  firstName,
  sunSign,
  moonSign,
  combinationTitle,
  firstSentence,
  email,
}: {
  firstName: string;
  sunSign: string;
  moonSign: string;
  combinationTitle: string;
  firstSentence: string;
  email: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Moonday, ${firstName} — your Blueprint is waiting</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060d17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #060d17; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #0d1726; border: 1px solid #1f2d42; border-radius: 16px; overflow: hidden; padding: 40px 32px; text-align: center;">
          <!-- Top Eyebrow -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.25em; color: #f3d077; font-weight: 600; margin-bottom: 6px;">
                ✦ NATAL BLUEPRINT · CORE IDENTITY ✦
              </div>
              <div style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.08em;">
                MOONDAY LIVE
              </div>
            </td>
          </tr>

          <!-- Hero Heading: You are [combination_title] in large text -->
          <tr>
            <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid rgba(243, 208, 119, 0.15);">
              <h1 style="margin: 0 0 12px 0; font-size: 32px; line-height: 1.25; color: #f3d077; font-weight: 700; font-family: Georgia, serif; text-shadow: 0 0 24px rgba(243, 208, 119, 0.25);">
                You are ${combinationTitle}
              </h1>
              <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em; color: #94a3b8;">
                ${sunSign} Sun • ${moonSign} Moon
              </div>
            </td>
          </tr>

          <!-- Teaser Synthesis: One sentence only -->
          <tr>
            <td align="center" style="padding: 28px 0 16px 0;">
              ${firstSentence ? `
              <p style="margin: 0 0 24px 0; font-size: 18px; line-height: 1.7; color: #e2e8f0; font-family: Georgia, serif; font-style: italic; max-width: 480px;">
                "${firstSentence}"
              </p>
              ` : ''}

              <!-- Teaser Line -->
              <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #94a3b8; max-width: 460px;">
                Your full Blueprint — your behaviors, your patterns, your shadow — is inside the app
              </p>

              <!-- Single CTA Button -->
              <a href="https://moondaylive.com/blueprint" style="display: inline-block; background-color: #f3d077; color: #060d17; text-decoration: none; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.12em; padding: 16px 36px; border-radius: 999px; box-shadow: 0 4px 16px rgba(243, 208, 119, 0.35);">
                See Your Full Blueprint
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 36px; border-top: 1px solid #1f2d42; color: #64748b; font-size: 12px; line-height: 1.6;">
              Moonday Live · Conscious Astrology<br>
              Sent to ${email} · <a href="https://moondaylive.com/blueprint" style="color: #94a3b8; text-decoration: underline;">Open Blueprint</a> · <a href="https://moondaylive.com/account" style="color: #94a3b8; text-decoration: underline;">Manage Account</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    const body: RequestBody = await req.json();
    const { email, sunSign, moonSign } = body;
    const firstName = body.firstName?.trim() || 'Cosmic Traveler';

    if (!email || !sunSign || !moonSign) {
      return new Response(
        JSON.stringify({ error: 'email, sunSign, and moonSign are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure user_profiles has natal_sun_sign and natal_moon_sign persisted
    if (body.userId || email) {
      try {
        const profileUpdates: Record<string, unknown> = {
          natal_sun_sign: sunSign,
          natal_moon_sign: moonSign,
          moon_sign: moonSign,
        };
        if (firstName && firstName !== 'Cosmic Traveler') {
          profileUpdates.first_name = firstName;
        }

        if (body.userId) {
          await supabase
            .from('user_profiles')
            .update(profileUpdates)
            .eq('user_id', body.userId);
        } else {
          await supabase
            .from('user_profiles')
            .update(profileUpdates)
            .eq('email', email);
        }
      } catch (profileUpdateErr) {
        console.warn('[send-blueprint-email] Warning persisting natal signs to user_profiles:', profileUpdateErr);
      }
    }

    // 1. Query combination_profiles table if blueprint data is missing
    let blueprint = body.blueprint;
    if (!blueprint?.combination_title || !blueprint?.combination_synthesis) {
      const { data, error } = await supabase
        .from('combination_profiles')
        .select('combination_title, combination_synthesis')
        .eq('sun_sign', sunSign)
        .eq('moon_sign', moonSign)
        .maybeSingle();

      if (error) {
        console.warn('[send-blueprint-email] Error fetching combination profile:', error.message);
      }
      if (data) {
        blueprint = data;
      }
    }

    const combinationTitle = blueprint?.combination_title || `${sunSign} Sun • ${moonSign} Moon Archetype`;
    const rawSynthesis = blueprint?.combination_synthesis ||
      `The synergy of ${sunSign} and ${moonSign} weaves outward ambition with inward sanctuary.`;
    const firstSentence = getFirstSentence(rawSynthesis);

    // Subject: "Welcome to Moonday, [first_name] — your Blueprint is waiting"
    const subject = `Welcome to Moonday, ${firstName} — your Blueprint is waiting`;
    const emailHtml = buildWelcomeTeaserEmailHtml({
      firstName,
      sunSign,
      moonSign,
      combinationTitle,
      firstSentence,
      email,
    });

    // 2. Send via Resend setup (sender: noreply@moondaylive.com)
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || Deno.env.get('SMTP_PASS') || Deno.env.get('RESEND_KEY');

    let sendSuccess = false;
    let sendResult: unknown = null;
    let errorMessage: string | null = null;

    if (resendApiKey) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Moonday Live <noreply@moondaylive.com>',
            to: [email],
            subject,
            html: emailHtml,
          }),
        });

        if (resendRes.ok) {
          sendSuccess = true;
          sendResult = await resendRes.json();
          console.log('[send-blueprint-email] Welcome teaser email sent via Resend API to', email);
        } else {
          const errText = await resendRes.text();
          errorMessage = `Resend API returned ${resendRes.status}: ${errText}`;
          console.error('[send-blueprint-email] Resend API error:', errorMessage);
        }
      } catch (sendErr) {
        errorMessage = (sendErr as Error)?.message || String(sendErr);
        console.error('[send-blueprint-email] Exception sending via Resend API:', errorMessage);
      }
    } else {
      console.warn('[send-blueprint-email] RESEND_API_KEY or SMTP_PASS not set. Logging email payload.');
      sendSuccess = true;
      sendResult = { simulated: true, recipient: email };
    }

    // Log to email_send_log
    await supabase
      .from('email_send_log')
      .insert({
        template_name: 'blueprint-welcome-teaser',
        recipient_email: email,
        status: sendSuccess ? 'sent' : 'failed',
        error_message: errorMessage,
      })
      .catch(() => undefined);

    if (!sendSuccess && errorMessage) {
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome teaser email processed successfully',
        recipient: email,
        subject,
        result: sendResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const errorMsg = (err as Error)?.message || 'Internal server error';
    console.error('[send-blueprint-email] Unhandled error:', errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
