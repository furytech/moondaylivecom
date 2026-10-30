import { describe, expect, it, vi } from "vitest";
import { processStripeEvent, type StripeEventLike, type ClaimResult } from "../../supabase/functions/_shared/stripeWebhookCore";
import { cancellationEmail, sendCancellationEmail, CANCEL_LINE } from "../../supabase/functions/_shared/cancellationEmail";

const END = Math.floor(Date.parse("2026-11-20T12:00:00Z") / 1000);

const makeDeps = (claim: ClaimResult = "claimed", sendFails = false) => ({
  claimEvent: vi.fn(async () => claim),
  releaseEvent: vi.fn(async () => {}),
  getCustomerEmail: vi.fn(async () => "member@example.com"),
  listSubscriptions: vi.fn(async () => [{ id: "sub_1", status: "active" }]),
  findUserIdByEmail: vi.fn(async () => "user-1"),
  updateProfileByUserId: vi.fn(async () => ({})),
  updateProfileByEmail: vi.fn(async () => ({})),
  sendCancellationEmail: vi.fn(async () => { if (sendFails) throw new Error("Resend HTTP 500"); }),
  log: vi.fn(),
});

const updated = (object: Record<string, unknown>, previous?: Record<string, unknown>, id = "evt_c1"): StripeEventLike => ({
  id,
  type: "customer.subscription.updated",
  data: { object: { id: "sub_1", status: "active", customer: "cus_1", created: 100, ...object }, previous_attributes: previous },
});

describe("cancellation confirmation email", () => {
  it("sends once when the subscription is set to cancel at period end", async () => {
    const deps = makeDeps();
    const res = await processStripeEvent(updated({ cancel_at_period_end: true, current_period_end: END }, { cancel_at_period_end: false }), deps);
    expect(res.status).toBe(200);
    expect(deps.sendCancellationEmail).toHaveBeenCalledTimes(1);
    const [to, endsAt] = deps.sendCancellationEmail.mock.calls[0] as unknown as [string, Date];
    expect(to).toBe("member@example.com");
    expect(endsAt.toISOString()).toBe("2026-11-20T12:00:00.000Z");
  });

  it("works for a scheduled cancel_at and the period end under items (newer API)", async () => {
    const a = makeDeps();
    await processStripeEvent(updated({ cancel_at: END }, { cancel_at: null }), a);
    expect(a.sendCancellationEmail).toHaveBeenCalledTimes(1);
    const b = makeDeps();
    await processStripeEvent(updated({ cancel_at_period_end: true, items: { data: [{ current_period_end: END }] } }, { cancel_at_period_end: false }), b);
    expect((b.sendCancellationEmail.mock.calls[0] as unknown as [string, Date])[1].getTime()).toBe(END * 1000);
  });

  it("a repeated webhook (duplicate event id) sends nothing", async () => {
    const deps = makeDeps("duplicate");
    const res = await processStripeEvent(updated({ cancel_at_period_end: true, current_period_end: END }, { cancel_at_period_end: false }), deps);
    expect(res.body.duplicate).toBe(true);
    expect(deps.sendCancellationEmail).not.toHaveBeenCalled();
  });

  it("does not send for renewals, payment failures, resuming or edits to an already-cancelling subscription", async () => {
    const cases: Array<[Record<string, unknown>, Record<string, unknown> | undefined]> = [
      [{ status: "active", current_period_end: END + 1000 }, { current_period_end: END }],           // renewal
      [{ status: "past_due" }, { status: "active" }],                                               // payment failure
      [{ status: "active", cancel_at_period_end: false }, { cancel_at_period_end: true }],          // resumed
      [{ cancel_at_period_end: true, current_period_end: END }, { default_payment_method: "pm_1" }], // already cancelling
      [{ cancel_at_period_end: true }, { cancel_at_period_end: true }],
      [{ status: "active" }, undefined],
    ];
    for (const [obj, prev] of cases) {
      const deps = makeDeps();
      await processStripeEvent(updated(obj, prev), deps);
      expect(deps.sendCancellationEmail).not.toHaveBeenCalled();
    }
  });

  it("does not send for created or deleted events", async () => {
    for (const type of ["customer.subscription.created", "customer.subscription.deleted"]) {
      const deps = makeDeps();
      const ev = updated({ cancel_at_period_end: true, current_period_end: END }, { cancel_at_period_end: false });
      await processStripeEvent({ ...ev, type }, deps);
      expect(deps.sendCancellationEmail).not.toHaveBeenCalled();
    }
  });

  it("an email failure is logged but does not fail the webhook, and access is still synced", async () => {
    const deps = makeDeps("claimed", true);
    const res = await processStripeEvent(updated({ cancel_at_period_end: true, current_period_end: END }, { cancel_at_period_end: false }), deps);
    expect(res.status).toBe(200);
    expect(deps.updateProfileByEmail).toHaveBeenCalled();
    expect(deps.releaseEvent).not.toHaveBeenCalled();
  });
});

describe("cancellation email content and send", () => {
  it("shows the end date, how to resume, support contact and the cancel line", () => {
    const e = cancellationEmail(new Date(END * 1000));
    for (const body of [e.text, e.html]) {
      expect(body).toContain("November 20, 2026");
      expect(body).toContain("moondaylive.com/account");
      expect(body).toContain("support@moondaylive.com");
    }
    expect(e.text).toContain(CANCEL_LINE);
    expect(CANCEL_LINE).toBe("You can cancel anytime from your Account page: moondaylive.com/account");
    expect(e.subject).toMatch(/cancellation is confirmed/i);
  });

  it("posts to Resend from noreply with support as reply-to, and throws on a failed send", async () => {
    const f = vi.fn(async (_u: unknown, _i?: RequestInit) => new Response("{}", { status: 200 }));
    await sendCancellationEmail("a@b.com", new Date(END * 1000), "re_key", f as unknown as typeof fetch);
    const body = JSON.parse((f.mock.calls[0][1] as RequestInit).body as string);
    expect(f.mock.calls[0][0]).toBe("https://api.resend.com/emails");
    expect(body).toMatchObject({ from: "Moonday Live <noreply@moondaylive.com>", to: ["a@b.com"], reply_to: "support@moondaylive.com" });
    await expect(sendCancellationEmail("a@b.com", new Date(), undefined, f as unknown as typeof fetch)).rejects.toThrow();
    const bad = vi.fn(async () => new Response("no", { status: 500 }));
    await expect(sendCancellationEmail("a@b.com", new Date(), "k", bad as unknown as typeof fetch)).rejects.toThrow("Resend HTTP 500");
  });
});
