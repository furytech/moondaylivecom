// Cancellation confirmation email, sent through Resend when a member sets their subscription to end at the
// close of the paid period. The fetch is passed in so vitest can check the request without sending anything.

export const CANCEL_FROM = "Moonday Live <noreply@moondaylive.com>";
export const SUPPORT_EMAIL = "support@moondaylive.com";
export const ACCOUNT_URL = "https://moondaylive.com/account";
export const CANCEL_LINE = `You can cancel anytime from your Account page: moondaylive.com/account`;

export function formatEndDate(endsAt: Date): string {
  return endsAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export interface CancellationEmail {
  subject: string;
  text: string;
  html: string;
}

export function cancellationEmail(endsAt: Date): CancellationEmail {
  const date = formatEndDate(endsAt);
  const lines = [
    "Your Luminary cancellation is confirmed.",
    "",
    `You will not be charged again. Your Luminary access continues until ${date} (UTC), the end of the period you have already paid for. After that your account returns to the free Blueprint.`,
    "",
    `Changed your mind? Before ${date}, open your Account page and choose Manage or cancel membership: ${ACCOUNT_URL}`,
    "",
    "Payments are non-refundable; see our Refund & Cancellation Policy: https://moondaylive.com/refund",
    "",
    `Questions? Write to ${SUPPORT_EMAIL}.`,
    "",
    CANCEL_LINE,
  ];
  const html = `<div style="font-family:Georgia,serif;color:#222;line-height:1.6;max-width:560px">
<p><strong>Your Luminary cancellation is confirmed.</strong></p>
<p>You will not be charged again. Your Luminary access continues until <strong>${date} (UTC)</strong>, the end of the period you have already paid for. After that your account returns to the free Blueprint.</p>
<p>Changed your mind? Before ${date}, open your <a href="${ACCOUNT_URL}">Account page</a> and choose Manage or cancel membership.</p>
<p>Payments are non-refundable; see our <a href="https://moondaylive.com/refund">Refund &amp; Cancellation Policy</a>.</p>
<p>Questions? Write to <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
<p style="color:#666;font-size:14px">You can cancel anytime from your Account page: <a href="${ACCOUNT_URL}">moondaylive.com/account</a></p>
</div>`;
  return { subject: "Your Luminary cancellation is confirmed", text: lines.join("\n"), html };
}

export async function sendCancellationEmail(
  to: string,
  endsAt: Date,
  apiKey: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  const email = cancellationEmail(endsAt);
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: CANCEL_FROM, to: [to], reply_to: SUPPORT_EMAIL, subject: email.subject, text: email.text, html: email.html }),
  });
  if (!res.ok) throw new Error(`Resend HTTP ${res.status}`);
}
