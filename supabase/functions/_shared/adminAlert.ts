// Admin alert email through Resend (same sender and API as send-blueprint-email). The fetch is passed in so
// vitest can check the request without sending anything.

export const ALERT_FROM = "Moonday Live <noreply@moondaylive.com>";
export const DEFAULT_ADMIN_EMAIL = "mindglimmer@gmail.com";

export interface AdminEmail {
  subject: string;
  text: string;
}

export async function sendAdminEmail(
  email: AdminEmail,
  opts: { apiKey: string | undefined; to: string | undefined },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (!opts.apiKey) throw new Error("RESEND_API_KEY is not set");
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: ALERT_FROM, to: [opts.to || DEFAULT_ADMIN_EMAIL], subject: email.subject, text: email.text }),
  });
  if (!res.ok) throw new Error(`Resend HTTP ${res.status}`);
}

/** The email for a social posting problem. kind "failed" = failed twice in a row, "missed" = window ended unposted. */
export function socialAlertEmail(kind: "failed" | "missed", sign: string, detail: string): AdminEmail {
  const what = kind === "failed" ? "is failing to post" : "was missed";
  return {
    subject: `Moonday social post for ${sign} ${what}`,
    text: [
      detail,
      "",
      kind === "failed"
        ? "The hourly check keeps retrying until the transit ends. Check the Make scenario and the MAKE_SOCIAL_WEBHOOK_URL secret."
        : "The card is now marked Missed in Mission Control and will not post. Approve it again when its next transit comes round.",
      "",
      "You get one email per card per event.",
    ].join("\n"),
  };
}
