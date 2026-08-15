import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Telegram notifier for the Journal pipeline.
 *
 * Replaces the old Twilio SMS path: instead of paying per message we push an
 * admin-only Telegram message with a deep link straight into the post editor
 * (`/admin/blog?post=<id>`), so approving a transit is one tap on a phone.
 *
 * Body shapes:
 *   { kind: "test" }
 *   { kind: "published" | "approval" | "missed", post_id, title, channel?, when? }
 */

const ADMIN_BASE = "https://moondaylive.com/admin/blog";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");

    // Notifications are a convenience layer — never let a missing connector
    // break the caller (publishing must succeed even if Telegram is down).
    if (!TELEGRAM_BOT_TOKEN) {
      return json({ sent: false, error: "Telegram bot token is not configured." });
    }
    if (!TELEGRAM_CHAT_ID) {
      return json({
        sent: false,
        error: "TELEGRAM_CHAT_ID is not set — message the bot once, then save your chat id.",
      });
    }

    const body = await req.json().catch(() => ({}));
    const kind = String(body.kind || "test");
    const title = body.title ? escapeHtml(String(body.title)) : "";
    const channel = body.channel ? escapeHtml(String(body.channel)) : "";
    const when = body.when ? escapeHtml(String(body.when)) : "";
    const link = body.post_id ? `${ADMIN_BASE}?post=${body.post_id}` : ADMIN_BASE;

    let text: string;
    switch (kind) {
      case "published":
        text = `🌙 <b>Published</b>\n${title}\n${channel ? `Channel: ${channel}\n` : ""}<a href="${link}">Open in Journal Admin</a>`;
        break;
      case "approval":
        text = `📝 <b>Ready for review</b>\n${title}\n${when ? `Goes out: ${when}\n` : ""}<a href="${link}">Approve in Journal Admin</a>`;
        break;
      case "missed":
        text = `⚠️ <b>Not sent</b>\n${title}\n${channel ? `Channel: ${channel}\n` : ""}<a href="${link}">Fix it now</a>`;
        break;
      default:
        text = `✅ <b>Moonday Live</b>\nTelegram notifications are wired up.\n<a href="${ADMIN_BASE}">Journal Admin</a>`;
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error(`Telegram API failed [${response.status}]: ${details}`);
      return json({ sent: false, status: response.status, error: details });
    }

    const result = await response.json();
    if (result?.ok === false) {
      console.error("Telegram rejected the message:", result);
      return json({ sent: false, error: result.description || "Telegram rejected the message." });
    }

    return json({ sent: true, message_id: result?.result?.message_id ?? null });
  } catch (err) {
    console.error("telegram-notify error:", err);
    return json({ sent: false, error: (err as Error).message }, 500);
  }
});
