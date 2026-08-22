import { createClient } from 'npm:@supabase/supabase-js@2'
import { reportError, errorText } from './errorTracking.ts'
import { logDispatch } from './dispatchLog.ts'
import {
  DISPATCH_POST_COLUMNS,
  REDDIT_WEBHOOK_URL,
  buildRedditPayload,
  resolveTitle,
} from './dispatchPayloads.ts'

/**
 * Reddit hand-off, webhook edition.
 *
 * Reddit is no longer posted to directly with OAuth credentials. Instead every
 * dispatch — automatic on publish, scheduled, or a manual admin retry — POSTs
 * the finished payload to the approval webhook, which owns the actual posting.
 *
 * The payload comes from the shared builder so the admin preview screen shows
 * exactly this JSON, and every attempt is persisted to dispatch_logs.
 */

type Client = ReturnType<typeof createClient>

export interface PublishOutcome {
  ok: boolean
  skipped?: boolean
  reason?: string
  permalink?: string
  title?: string
}

async function recordFailure(supabase: Client, postId: string, message: string) {
  await supabase
    .from('blog_posts')
    .update({
      reddit_status: 'failed',
      reddit_error: message.slice(0, 500),
      reddit_attempted_at: new Date().toISOString(),
    })
    .eq('id', postId)
}

export async function publishPostToReddit(
  supabase: Client,
  postId: string,
  opts: { force?: boolean; triggerSource?: string } = {},
): Promise<PublishOutcome> {
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(DISPATCH_POST_COLUMNS)
    .eq('id', postId)
    .maybeSingle()

  if (error) return { ok: false, reason: error.message }
  if (!post) return { ok: false, reason: 'Post not found' }

  if (post.reddit_status === 'sent' && !opts.force) {
    return { ok: false, skipped: true, reason: 'already_sent' }
  }

  const copy = post.reddit_post?.trim()
  if (!copy) {
    return { ok: false, skipped: true, reason: 'no_reddit_copy' }
  }

  const title = resolveTitle(post)
  const payload = buildRedditPayload(post)
  const triggerSource = opts.triggerSource ?? 'auto'

  try {
    const res = await fetch(REDDIT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const raw = await res.text().catch(() => '')
    if (!res.ok) {
      await logDispatch(supabase, {
        postId,
        channel: 'reddit',
        status: 'failed',
        webhookUrl: REDDIT_WEBHOOK_URL,
        triggerSource,
        payload,
        responseStatus: res.status,
        responseBody: raw,
        error: `Reddit webhook returned ${res.status}`,
      })
      throw new Error(`Reddit webhook returned ${res.status}${raw ? `: ${raw.slice(0, 200)}` : ''}`)
    }

    // The webhook may echo back the live thread; take it when offered.
    let permalink: string | null = null
    try {
      const parsed = raw ? JSON.parse(raw) : null
      permalink = parsed?.permalink || parsed?.url || null
    } catch {
      permalink = null
    }

    const now = new Date().toISOString()
    await supabase
      .from('blog_posts')
      .update({
        reddit_status: 'sent',
        reddit_posted_at: now,
        reddit_attempted_at: now,
        reddit_permalink: permalink,
        reddit_error: null,
      })
      .eq('id', postId)

    await logDispatch(supabase, {
      postId,
      channel: 'reddit',
      status: 'sent',
      webhookUrl: REDDIT_WEBHOOK_URL,
      triggerSource,
      payload,
      responseStatus: res.status,
      responseBody: raw,
    })

    return { ok: true, permalink: permalink ?? undefined, title }
  } catch (e) {
    const message = errorText(e)
    await recordFailure(supabase, postId, message)
    await logDispatch(supabase, {
      postId,
      channel: 'reddit',
      status: 'failed',
      webhookUrl: REDDIT_WEBHOOK_URL,
      triggerSource,
      payload,
      error: message,
    })
    await reportError({
      source: 'reddit-auto-post',
      severity: 'error',
      message: `Reddit webhook dispatch failed for "${title}": ${message}`,
      context: { postId, webhook: REDDIT_WEBHOOK_URL },
      throttleMinutes: 30,
    })
    return { ok: false, reason: message, title }
  }
}
