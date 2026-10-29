/** POST to the Make webhook. The webhook URL and API key are secrets: nothing here returns, logs or throws them.
 *  A failed request is reported as an HTTP status, "timeout" or "network error", never the runtime's own error
 *  text, which can include the request URL. */

export interface MakeWebhookConfig {
  url: string;
  /** MAKE_SOCIAL_WEBHOOK_KEY. When empty or unset, no x-make-apikey header is sent. */
  apiKey?: string | null;
  timeoutMs?: number;
}

export function makeWebhookHeaders(apiKey?: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["x-make-apikey"] = apiKey;
  return headers;
}

export interface TestSendDeps<R> {
  /** Read one record by sign slug (read-only). null = no such record. */
  loadRow(sign: string): Promise<R | null>;
  /** Same payload push mode sends for this record. */
  buildPayload(row: R): Promise<unknown> | unknown;
  /** POST once to the webhook; resolves the HTTP status. */
  post(payload: unknown): Promise<number>;
}

export type TestSendResult = { status: number } | { error: string; httpStatus: number };

/** Manual test post for one sign. Writes nothing, checks no due rule, sends no alert: it reads the one record,
 *  posts once and returns only the webhook's HTTP status. */
export async function sendTestSign<R>(testSign: unknown, deps: TestSendDeps<R>): Promise<TestSendResult> {
  const sign = typeof testSign === "string" ? testSign.toLowerCase().trim() : "";
  if (!/^[a-z]{3,20}$/.test(sign)) return { error: "test_sign must be a sign slug such as cancer", httpStatus: 400 };
  const row = await deps.loadRow(sign);
  if (!row) return { error: "no such sign", httpStatus: 404 };
  try {
    return { status: await deps.post(await deps.buildPayload(row)) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "network error", httpStatus: 502 };
  }
}

/** Resolves the HTTP status. Rejects with a message that contains neither the URL nor the key. */
export async function postToMake(
  config: MakeWebhookConfig,
  payload: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 10000);
  try {
    const res = await fetchImpl(config.url, {
      method: "POST",
      headers: makeWebhookHeaders(config.apiKey),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    await res.text().catch(() => undefined);
    return res.status;
  } catch (err) {
    throw new Error(controller.signal.aborted ? "timeout" : "network error");
  } finally {
    clearTimeout(timer);
  }
}
