// Server-side Telegram ping used by the Journal pipeline.
//
// Notifications are a convenience layer: this helper NEVER throws, so a Telegram
// outage or missing secret can't break publishing or draft generation.

import { inAwakeWindow } from "./channels.ts";

const TELEGRAM_FN_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-notify`;

export interface TelegramPing {
  kind: "published" | "approval" | "missed";
  post_id?: string | null;
  title?: string | null;
  channel?: string | null;
  when?: string | null;
}

export async function notifyTelegram(payload: TelegramPing): Promise<void> {
  // Sleep guard: the operator sleeps 19:30-05:00. Purely informational
  // "published" pings are dropped overnight; action pings are only ever
  // scheduled inside waking hours by their callers.
  if (payload.kind === "published" && !inAwakeWindow(new Date())) return;

  try {
    await fetch(TELEGRAM_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("notifyTelegram failed (ignored):", err);
  }
}
