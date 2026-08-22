import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * Persistent record of every outgoing dispatch: what we sent, where, and what
 * n8n said back. Logging must never break a publish, so failures are swallowed.
 *
 * The log is also the source of truth for the duplicate guard: before any
 * channel is dispatched — manually or by the scheduler — we ask this table
 * whether the same post already went out clean on that channel.
 */

type Client = ReturnType<typeof createClient>

export type DispatchChannel = 'blog' | 'substack' | 'reddit'

/**
 * Coarse failure categories so the audit page can group repeats instead of
 * showing thirty variations of the same stack trace.
 */
export type DispatchErrorType =
  | 'webhook_unreachable'
  | 'webhook_timeout'
  | 'webhook_rejected'
  | 'webhook_server_error'
  | 'invalid_response'
  | 'database_error'
  | 'unknown'

export function classifyDispatchError(
  message: string,
  responseStatus?: number | null,
): DispatchErrorType {
  const m = (message || '').toLowerCase()

  if (typeof responseStatus === 'number' && responseStatus > 0) {
    if (responseStatus >= 500) return 'webhook_server_error'
    if (responseStatus === 408 || responseStatus === 504) return 'webhook_timeout'
    if (responseStatus >= 400) return 'webhook_rejected'
  }

  if (m.includes('timeout') || m.includes('timed out') || m.includes('aborted')) {
    return 'webhook_timeout'
  }
  if (
    m.includes('econnrefused') ||
    m.includes('connection refused') ||
    m.includes('dns') ||
    m.includes('failed to fetch') ||
    m.includes('error sending request') ||
    m.includes('network')
  ) {
    return 'webhook_unreachable'
  }
  if (m.includes('json') || m.includes('unexpected token')) return 'invalid_response'
  if (m.includes('row-level security') || m.includes('permission denied')) return 'database_error'
  return 'unknown'
}

export interface DispatchLogEntry {
  postId: string | null
  channel: DispatchChannel
  status: 'sent' | 'failed' | 'skipped'
  webhookUrl?: string | null
  triggerSource?: string | null
  payload: unknown
  responseStatus?: number | null
  responseBody?: string | null
  error?: string | null
  errorType?: DispatchErrorType | null
}

export async function logDispatch(supabase: Client, entry: DispatchLogEntry) {
  try {
    const errorType =
      entry.status === 'failed'
        ? entry.errorType ?? classifyDispatchError(entry.error ?? '', entry.responseStatus)
        : null

    await supabase.from('dispatch_logs').insert({
      post_id: entry.postId,
      channel: entry.channel,
      status: entry.status,
      webhook_url: entry.webhookUrl ?? null,
      trigger_source: entry.triggerSource ?? null,
      request_payload: entry.payload ?? {},
      response_status: entry.responseStatus ?? null,
      response_body: entry.responseBody ? entry.responseBody.slice(0, 4000) : null,
      error: entry.error ? entry.error.slice(0, 1000) : null,
      error_type: errorType,
    })
  } catch (_e) {
    // Never let audit logging take down a dispatch.
  }
}

export interface PriorSuccess {
  id: string
  created_at: string
  trigger_source: string | null
  response_status: number | null
}

/**
 * The most recent clean delivery of this post on this channel, if any.
 *
 * "Clean" means the webhook accepted it (status `sent`, no error recorded).
 * A failed attempt never blocks a retry — only a confirmed success does.
 */
export async function findPriorSuccess(
  supabase: Client,
  postId: string,
  channel: DispatchChannel,
): Promise<PriorSuccess | null> {
  try {
    const { data } = await supabase
      .from('dispatch_logs')
      .select('id, created_at, trigger_source, response_status')
      .eq('post_id', postId)
      .eq('channel', channel)
      .eq('status', 'sent')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (data as PriorSuccess) ?? null
  } catch (_e) {
    // If the guard itself cannot read, fail open — never block a publish.
    return null
  }
}
