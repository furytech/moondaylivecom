import { createClient } from 'npm:@supabase/supabase-js@2'
import { reportError, errorText } from './errorTracking.ts'

/**
 * Reddit hand-off, webhook edition.
 *
 * Reddit is no longer posted to directly with OAuth credentials. Instead every
 * dispatch — automatic on publish, scheduled, or a manual admin retry — POSTs
 * the finished payload to the approval webhook, which owns the actual posting.
 *
 * Every outcome, success or failure, is written back onto the post row so the
 * channel audit page can say exactly what happened and when.
 */

type Client = ReturnType<typeof createClient>

const SITE_URL = 'https://moondaylive.com'

const WEBHOOK_URL =
  Deno.env.get('REDDIT_WEBHOOK_URL')?.trim() ||
  'http://192.241.153.228:8055/webhook/reddit-approval'

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
  opts: { force?: boolean } = {},
): Promise<PublishOutcome> {
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(
      'id, slug, title, category, reddit_post, reddit_status, reddit_scheduled_at, publish_at, published_at, image_url, constellation_graphic_path, zodiac_sign_tag',
    )
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

  const title = post.title?.trim() || `The Moon enters ${post.zodiac_sign_tag ?? 'a new sign'}`
  const postUrl = post.slug
    ? post.category
      ? `${SITE_URL}/blog/${post.category}/${post.slug}`
      : `${SITE_URL}/blog/${post.slug}`
    : SITE_URL

  const imageUrl =
    post.image_url?.trim() ||
    (post.constellation_graphic_path
      ? `${SITE_URL}${post.constellation_graphic_path.startsWith('/') ? '' : '/'}${post.constellation_graphic_path}`
      : null)

  // The scheduled instant is what the operator picked for Reddit; fall back to
  // the blog's instant so the webhook always receives a concrete time.
  const scheduledAt =
    post.reddit_scheduled_at || post.published_at || post.publish_at || new Date().toISOString()

  const payload = {
    post_id: post.id,
    title,
    body: copy,
    content: copy,
    scheduled_time: scheduledAt,
    scheduled_at: scheduledAt,
    subreddit: Deno.env.get('REDDIT_DEFAULT_SUBREDDIT')?.replace(/^\/?r\//, '').trim() || null,
    zodiac_sign: post.zodiac_sign_tag ?? null,
    image_url: imageUrl,
    source_url: postUrl,
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const raw = await res.text().catch(() => '')
    if (!res.ok) {
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

    return { ok: true, permalink: permalink ?? undefined, title }
  } catch (e) {
    const message = errorText(e)
    await recordFailure(supabase, postId, message)
    await reportError({
      source: 'reddit-auto-post',
      severity: 'error',
      message: `Reddit webhook dispatch failed for "${title}": ${message}`,
      context: { postId, webhook: WEBHOOK_URL },
      throttleMinutes: 30,
    })
    return { ok: false, reason: message, title }
  }
}
