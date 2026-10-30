import { describe, expect, it, vi } from "vitest";
import { hashtagsLine, makeWebhookHeaders, postToMake, sendTestSign } from "../../supabase/functions/_shared/makeWebhook";
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

describe("hashtags_line", () => {
  it("joins the array with single spaces", () => {
    expect(hashtagsLine(["#CancerZodiac", "#LunarSanctuary", "#IntuitiveFlow", "#MoondayLive"])).toBe(
      "#CancerZodiac #LunarSanctuary #IntuitiveFlow #MoondayLive",
    );
  });
  it("is an empty string for missing, empty or non-array values and skips blanks", () => {
    expect(hashtagsLine(undefined)).toBe("");
    expect(hashtagsLine(null)).toBe("");
    expect(hashtagsLine([])).toBe("");
    expect(hashtagsLine("#a #b")).toBe("");
    expect(hashtagsLine(["#a", " ", null, " #b "])).toBe("#a #b");
  });
  it("is added to the shared payload builder next to the unchanged hashtags array, for push and test_sign", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("supabase/functions/make-social-bridge/index.ts", "utf8");
    const builder = src.slice(src.indexOf("function toPayload"), src.indexOf("async function fetchCandidates"));
    expect(builder).toContain("...t,");
    expect(builder).toContain("hashtags_line: hashtagsLine(t.hashtags)");
    expect(builder).not.toMatch(/\n\s*hashtags:/);
    // Both the due push and the test_sign branch build their payload with toPayload.
    expect(src.match(/\.\.\.toPayload\(row, (ctx|ctx)\)/g)?.length).toBe(2);
  });
});

describe("test_sign test post", () => {
  const row = { id: "cancer", sign: "Cancer", status: "published", social_posted_at: null };
  const make = (over: Partial<Parameters<typeof sendTestSign<typeof row>>[1]> = {}) => {
    const f = okFetch();
    const loadRow = vi.fn(async (_s: string) => row as typeof row | null);
    const deps = {
      loadRow,
      buildPayload: (r: typeof row) => ({ event: "transit.due", ...r }),
      post: (p: unknown) => postToMake({ url: URL_SECRET, apiKey: KEY_SECRET }, p, f as unknown as typeof fetch),
      ...over,
    };
    return { f, loadRow, deps };
  };

  it("posts the payload once with the api key and returns only the status", async () => {
    const { f, loadRow, deps } = make();
    const out = await sendTestSign(" Cancer ", deps);
    expect(out).toEqual({ status: 200 });
    expect(loadRow).toHaveBeenCalledTimes(1);
    expect(loadRow).toHaveBeenCalledWith("cancer");
    expect(f).toHaveBeenCalledTimes(1);
    expect(sentHeaders(f)["x-make-apikey"]).toBe(KEY_SECRET);
    expect(JSON.parse((f.mock.calls[0][1] as RequestInit).body as string)).toMatchObject({ event: "transit.due", id: "cancer" });
  });

  it("reports a non-2xx status as the status, not as an error", async () => {
    const f = vi.fn(async () => new Response("no", { status: 500 }));
    const { deps } = make({ post: (p) => postToMake({ url: URL_SECRET }, p, f as unknown as typeof fetch) });
    expect(await sendTestSign("cancer", deps)).toEqual({ status: 500 });
  });

  it("rejects a missing or malformed sign without reading or posting", async () => {
    for (const bad of [undefined, null, 5, "", "../x", "cancer; drop", "a"]) {
      const { f, loadRow, deps } = make();
      expect(await sendTestSign(bad, deps)).toMatchObject({ httpStatus: 400 });
      expect(loadRow).not.toHaveBeenCalled();
      expect(f).not.toHaveBeenCalled();
    }
  });

  it("an unknown sign posts nothing", async () => {
    const { f, deps } = make({ loadRow: async () => null });
    expect(await sendTestSign("ophiuchus", deps)).toMatchObject({ httpStatus: 404 });
    expect(f).not.toHaveBeenCalled();
  });

  it("a network failure returns a plain error without the secrets", async () => {
    const { deps } = make({ post: (p) => postToMake({ url: URL_SECRET, apiKey: KEY_SECRET }, p, (async () => { throw new TypeError(`failed ${URL_SECRET} ${KEY_SECRET}`); }) as unknown as typeof fetch) });
    const out = await sendTestSign("cancer", deps);
    expect(out).toEqual({ error: "network error", httpStatus: 502 });
    expect(JSON.stringify(out)).not.toContain(KEY_SECRET);
    expect(JSON.stringify(out)).not.toContain("example-make.com");
  });

  it("the handler wiring is read-only: index.ts test branch has no writes, alerts or due rule", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("supabase/functions/make-social-bridge/index.ts", "utf8");
    const branch = src.slice(src.indexOf("body.test_sign !== undefined"), src.indexOf("const result = await pushDue"));
    expect(branch).toContain("sendTestSign");
    for (const forbidden of [".update(", ".insert(", ".upsert(", ".delete(", "sendAdminEmail", "pushDue", "markPosted", "claim"]) {
      expect(branch).not.toContain(forbidden);
    }
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
