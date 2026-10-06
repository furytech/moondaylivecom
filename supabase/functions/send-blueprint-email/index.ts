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

function formatBehaviors(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>;
          return String(obj.title || obj.behavior || obj.name || obj.text || '').trim();
        }
        return String(item).trim();
      })
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return formatBehaviors(parsed);
    } catch {
      return [raw.trim()];
    }
  }
  return [];
}

function buildBlueprintEmailHtml({
  firstName,
  sunSign,
  moonSign,
  combinationTitle,
  solarEssence,
  lunarEssence,
  combinationSynthesis,
  behaviors,
  email,
}: {
  firstName: string;
  sunSign: string;
  moonSign: string;
  combinationTitle: string;
  solarEssence: string;
  lunarEssence: string;
  combinationSynthesis: string;
  behaviors: string[];
  email: string;
}): string {
  // Format synthesis paragraphs
  const synthesisParagraphs = combinationSynthesis
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const synthesisHtml = synthesisParagraphs.length > 0
    ? synthesisParagraphs.map((p) => `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.75; color: #e2e8f0; font-family: Georgia, serif; font-style: italic;">${p}</p>`).join('')
    : `<p style="margin: 0; font-size: 16px; line-height: 1.75; color: #e2e8f0; font-family: Georgia, serif; font-style: italic;">${combinationSynthesis}</p>`;

  const behaviorsListHtml = behaviors.length > 0
    ? behaviors.map((b) => `<li style="margin-bottom: 10px; color: #cbd5e1; font-size: 14px; line-height: 1.6;">${b}</li>`).join('')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Moonday Blueprint is here, ${firstName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060d17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #060d17; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #0d1726; border: 1px solid #1f2d42; border-radius: 16px; overflow: hidden; padding: 36px 28px;">
          <!-- Top Eyebrow -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.25em; color: #f3d077; font-weight: 600; margin-bottom: 6px;">
                ✦ NATAL BLUEPRINT · CORE IDENTITY ✦
              </div>
              <div style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.08em;">
                MOONDAY LIVE
              </div>
            </td>
          </tr>

          <!-- Hero Heading: combination_title in gold -->
          <tr>
            <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid rgba(243, 208, 119, 0.2);">
              <h1 style="margin: 0 0 10px 0; font-size: 28px; line-height: 1.25; color: #f3d077; font-weight: 700; font-family: Georgia, serif; text-shadow: 0 0 20px rgba(243, 208, 119, 0.25);">
                ${combinationTitle}
              </h1>
              <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em; color: #94a3b8;">
                ${sunSign} Sun • ${moonSign} Moon
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 24px 0 18px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
              Greetings ${firstName},<br><br>
              Your natal blueprint maps the profound architecture of your inner cosmos. Here is your archetypal essence:
            </td>
          </tr>

          <!-- Solar & Lunar Essences Side-by-Side -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="48%" valign="top" style="background-color: #111e33; border: 1px solid #1e2c45; border-radius: 12px; padding: 18px;">
                    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #f3d077; font-weight: 600; margin-bottom: 8px;">
                      ☀️ Natal Sun · Conscious Drive
                    </div>
                    <div style="font-size: 14px; line-height: 1.55; color: #e2e8f0;">
                      ${solarEssence}
                    </div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" valign="top" style="background-color: #111e33; border: 1px solid #1e2c45; border-radius: 12px; padding: 18px;">
                    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #c4b5fd; font-weight: 600; margin-bottom: 8px;">
                      🌙 Natal Moon · Instinctual Sanctuary
                    </div>
                    <div style="font-size: 14px; line-height: 1.55; color: #e2e8f0;">
                      ${lunarEssence}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Full combination_synthesis -->
          <tr>
            <td style="padding: 24px 0; border-top: 1px solid #1e2c45; border-bottom: 1px solid #1e2c45;">
              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #f3d077; font-weight: 600; margin-bottom: 14px;">
                Archetypal Synthesis
              </div>
              <div>
                ${synthesisHtml}
              </div>
            </td>
          </tr>

          <!-- default_behaviors as a list -->
          ${behaviorsListHtml ? `
          <tr>
            <td style="padding: 24px 0;">
              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #94a3b8; font-weight: 600; margin-bottom: 12px;">
                Core Instincts & Behavioral Patterns
              </div>
              <ul style="margin: 0; padding-left: 20px;">
                ${behaviorsListHtml}
              </ul>
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button: Unlock Your Daily Activation -->
          <tr>
            <td align="center" style="padding: 28px 0 16px 0; border-top: 1px solid #1e2c45;">
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; max-width: 440px;">
                Every day, transiting lunar degrees activate your natal placements. Unlock your full daily forecast, somatic rituals, and personal triad intelligence.
              </p>
              <a href="https://moondaylive.com/pricing" style="display: inline-block; background-color: #f3d077; color: #060d17; text-decoration: none; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 36px; border-radius: 999px; box-shadow: 0 4px 16px rgba(243, 208, 119, 0.35);">
                Unlock Your Daily Activation
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px; border-top: 1px solid #1f2d42; color: #64748b; font-size: 12px; line-height: 1.6;">
              Moonday Live · Conscious Astrology<br>
              Sent to ${email} · <a href="https://moondaylive.com/pricing" style="color: #94a3b8; text-decoration: underline;">Upgrade to Luminary</a> · <a href="https://moondaylive.com/account" style="color: #94a3b8; text-decoration: underline;">Manage Account</a>
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
        .select('combination_title, combination_synthesis, solar_essence, lunar_essence, default_behaviors')
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
    const solarEssence = blueprint?.solar_essence || `Conscious vitality, core identity, and purpose powered by ${sunSign}.`;
    const lunarEssence = blueprint?.lunar_essence || `Instinctual sanctuary, emotional landscape, and subconscious processing tuned to ${moonSign}.`;
    const combinationSynthesis = blueprint?.combination_synthesis ||
      `The synergy of ${sunSign} and ${moonSign} weaves outward ambition with inward sanctuary. Living in conscious alignment requires recognizing both your solar path and your lunar resting place.`;
    const behaviors = formatBehaviors(blueprint?.default_behaviors);

    const subject = `Your Moonday Blueprint is here, ${firstName}`;
    const emailHtml = buildBlueprintEmailHtml({
      firstName,
      sunSign,
      moonSign,
      combinationTitle,
      solarEssence,
      lunarEssence,
      combinationSynthesis,
      behaviors,
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
          console.log('[send-blueprint-email] Email sent via Resend API successfully to', email);
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
        template_name: 'blueprint-welcome',
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
        message: 'Blueprint email processed successfully',
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
