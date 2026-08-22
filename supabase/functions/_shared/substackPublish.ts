import { createClient } from 'npm:@supabase/supabase-js@2'
import { reportError, errorText } from './errorTracking.ts'
import { logDispatch } from './dispatchLog.ts'
import {
  DISPATCH_POST_COLUMNS,
  SUBSTACK_WEBHOOK_URL,
  buildSubstackPayload,
  resolveTitle,
} from './dispatchPayloads.ts'

/**
 * Substack hand-off, webhook edition.
 *
 * Mirrors the Reddit pipeline exactly: every dispatch — automatic on publish,
 * scheduled, or a manual admin send — POSTs a flat payload to the n8n webhook,
 * which owns the actual delivery to Substack. Outcomes are stamped on the post
 * row and persisted to dispatch_logs.
 *
 * Plain HTTP on the default endpoint is intentional (internal n8n box).
 */

type Client = ReturnType<typeof createClient>

export interface SubstackOutcome {
  ok: boolean
  skipped?: boolean
  reason?: string
  title?: string
  url?: string
}

async function recordFailure(supabase: Client, postId: string, message: string) {
  await supabase
    .from('blog_posts')
    .update({
      substack_status: 'failed',
      substack_error: message.slice(0, 500),
    })
    .eq('id', postId)
}

export async function publishPostToSubstack(
  supabase: Client,
  postId: string,
  opts: { force?: boolean; triggerSource?: string } = {},
): Promise<SubstackOutcome> {
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(DISPATCH_POST_COLUMNS)
    .eq('id', postId)
    .maybeSingle()

  if (error) return { ok: false, reason: error.message }
  if (!post) return { ok: false, reason: 'Post not found' }

  if (post.substack_status === 'sent' && !opts.force) {
    return { ok: false, skipped: true, reason: 'already_sent' }
  }

  const copy = post.substack_post?.trim()
  if (!copy) {
    return { ok: false, skipped: true, reason: 'no_substack_copy' }
  }

  const title = resolveTitle(post)
  const payload = buildSubstackPayload(post)
  const triggerSource = opts.triggerSource ?? 'auto'

  try {
    const res = await fetch(SUBSTACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const raw = await res.text().catch(() => '')
    if (!res.ok) {
      await logDispatch(supabase, {
        postId,
        channel: 'substack',
        status: 'failed',
        webhookUrl: SUBSTACK_WEBHOOK_URL,
        triggerSource,
        payload,
        responseStatus: res.status,
        responseBody: raw,
        error: `Substack webhook returned ${res.status}`,
      })
      throw new Error(
        `Substack webhook returned ${res.status}${raw ? `: ${raw.slice(0, 200)}` : ''}`,
      )
    }

    let url: string | null = null
    try {
      const parsed = raw ? JSON.parse(raw) : null
      url = parsed?.url || parsed?.permalink || null
    } catch {
      url = null
    }

    await supabase
      .from('blog_posts')
      .update({
        substack_status: 'sent',
        substack_sent_at: new Date().toISOString(),
        substack_error: null,
      })
      .eq('id', postId)

    await logDispatch(supabase, {
      postId,
      channel: 'substack',
      status: 'sent',
      webhookUrl: SUBSTACK_WEBHOOK_URL,
      triggerSource,
      payload,
      responseStatus: res.status,
      responseBody: raw,
    })

    return { ok: true, title, url: url ?? undefined }
  } catch (e) {
    const message = errorText(e)
    await recordFailure(supabase, postId, message)
    await logDispatch(supabase, {
      postId,
      channel: 'substack',
      status: 'failed',
      webhookUrl: SUBSTACK_WEBHOOK_URL,
      triggerSource,
      payload,
      error: message,
    })
    await reportError({
      source: 'substack-auto-post',
      severity: 'error',
      message: `Substack webhook dispatch failed for "${title}": ${message}`,
      context: { postId, webhook: SUBSTACK_WEBHOOK_URL },
      throttleMinutes: 30,
    })
    return { ok: false, reason: message, title }
  }
}
