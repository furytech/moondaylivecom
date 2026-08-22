import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * Persistent record of every outgoing dispatch: what we sent, where, and what
 * n8n said back. Logging must never break a publish, so failures are swallowed.
 */

type Client = ReturnType<typeof createClient>

export interface DispatchLogEntry {
  postId: string | null
  channel: 'blog' | 'substack' | 'reddit'
  status: 'sent' | 'failed' | 'skipped'
  webhookUrl?: string | null
  triggerSource?: string | null
  payload: unknown
  responseStatus?: number | null
  responseBody?: string | null
  error?: string | null
}

export async function logDispatch(supabase: Client, entry: DispatchLogEntry) {
  try {
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
    })
  } catch (_e) {
    // Never let audit logging take down a dispatch.
  }
}
