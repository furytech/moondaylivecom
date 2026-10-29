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
