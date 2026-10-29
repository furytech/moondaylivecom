import { describe, expect, it, vi } from "vitest";
import { makeWebhookHeaders, postToMake } from "../../supabase/functions/_shared/makeWebhook";
import { pushDue, type TransitRow } from "../../supabase/functions/_shared/socialDue";
import { socialAlertEmail } from "../../supabase/functions/_shared/adminAlert";

const URL_SECRET = "https://hook.example-make.com/abc123secretpath";
const KEY_SECRET = "key-SECRET-9f8e7d";

const okFetch = () => vi.fn(async (_u: unknown, _i?: RequestInit) => new Response("Accepted", { status: 200 }));
const sentHeaders = (f: ReturnType<typeof okFetch>) => (f.mock.calls[0][1] as RequestInit).headers as Record<string, string>;

describe("make webhook api key header", () => {
  it("sends x-make-apikey when the key is set", async () => {
    const f = okFetch();
    const status = await postToMake({ url: URL_SECRET, apiKey: KEY_SECRET }, { a: 1 }, f as unknown as typeof fetch);
    expect(status).toBe(200);
    expect(f.mock.calls[0][0]).toBe(URL_SECRET);
    expect(sentHeaders(f)["x-make-apikey"]).toBe(KEY_SECRET);
    expect(sentHeaders(f)["Content-Type"]).toBe("application/json");
  });

  it("omits the header when the key is unset or empty", async () => {
    for (const apiKey of [undefined, null, ""]) {
      const f = okFetch();
      await postToMake({ url: URL_SECRET, apiKey }, { a: 1 }, f as unknown as typeof fetch);
      expect(Object.keys(sentHeaders(f))).toEqual(["Content-Type"]);
    }
    expect(makeWebhookHeaders()).toEqual({ "Content-Type": "application/json" });
  });
});

describe("make webhook error output never carries the secrets", () => {
  const leaky = vi.fn(async () => {
    // Deno-style error text includes the request URL.
    throw new TypeError(`error sending request for url (${URL_SECRET}): connection refused, key ${KEY_SECRET}`);
  });

  it("a network error is reported without runtime text", async () => {
    const err = await postToMake({ url: URL_SECRET, apiKey: KEY_SECRET }, {}, leaky as unknown as typeof fetch).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("network error");
    expect(err.message).not.toContain(URL_SECRET);
    expect(err.message).not.toContain(KEY_SECRET);
  });

  it("a timeout is reported as timeout", async () => {
    const hang = vi.fn((_u: unknown, init?: RequestInit) =>
      new Promise<Response>((_res, rej) => init?.signal?.addEventListener("abort", () => rej(new Error(`aborted ${URL_SECRET}`)))));
    const err = await postToMake({ url: URL_SECRET, apiKey: KEY_SECRET, timeoutMs: 5 }, {}, hang as unknown as typeof fetch).catch((e) => e);
    expect(err.message).toBe("timeout");
  });

  it("logs, stored failure reasons and failure emails contain neither secret", async () => {
    const row = { id: "leo", sign: "Leo", status: "published", social_posted_at: null, social_fail_count: 1, social_fail_for: "2026-10-31T00:00:00.000Z" } as unknown as TransitRow;
    const now = Date.parse("2026-10-31T13:00:00Z");
    const logs: unknown[] = [];
    const reasons: string[] = [];
    const emails: string[] = [];
    const result = await pushDue({
      fetchCandidates: async () => [row],
      fetchWindows: async () => [{ sign: "Leo", start_time: "2026-10-31T13:00:00.000Z", end_time: "2026-11-02T13:00:00.000Z" }] as never,
      postToWebhook: () => postToMake({ url: URL_SECRET, apiKey: KEY_SECRET }, {}, leaky as unknown as typeof fetch),
      markPosted: async () => undefined,
      recordFailure: async (_r, reason) => { reasons.push(reason); return 2; },
      notify: async (a) => { const m = socialAlertEmail(a.kind, "Leo", a.detail); emails.push(JSON.stringify(m)); },
      markAlerted: async () => undefined,
      now: () => now,
      log: (step, details) => logs.push({ step, details }),
    });
    const everything = JSON.stringify({ result, logs, reasons, emails });
    expect(result.failed.length + result.posted.length).toBeGreaterThan(0);
    expect(everything).not.toContain(URL_SECRET);
    expect(everything).not.toContain(KEY_SECRET);
    expect(everything).not.toContain("example-make.com");
  });

  it("a non-2xx response is reported as the HTTP status only", async () => {
    const f = vi.fn(async () => new Response(`denied for ${KEY_SECRET}`, { status: 403 }));
    const status = await postToMake({ url: URL_SECRET, apiKey: KEY_SECRET }, {}, f as unknown as typeof fetch);
    expect(status).toBe(403);
  });
});
