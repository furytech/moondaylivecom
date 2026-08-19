import { createClient } from 'npm:@supabase/supabase-js@2'
import { reportError, errorText } from './errorTracking.ts'

/**
 * Substack hand-off, webhook edition.
 *
 * Mirrors the Reddit pipeline exactly: every dispatch — automatic on publish,
 * scheduled, or a manual admin send — POSTs a flat payload to the n8n webhook,
 * which owns the actual delivery to Substack. Outcomes are stamped on the post
 * row so the channel audit page can say what happened and when.
 *
 * Plain HTTP on the default endpoint is intentional (internal n8n box).
 */

type Client = ReturnType<typeof createClient>

const SITE_URL = 'https://moondaylive.com'

const WEBHOOK_URL =
  Deno.env.get('SUBSTACK_WEBHOOK_URL')?.trim() ||
  'http://192.241.153.228:8055/webhook/substack-post'

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
  opts: { force?: boolean } = {},
): Promise<SubstackOutcome> {
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(
      'id, slug, title, excerpt, category, substack_post, substack_status, substack_scheduled_at, publish_at, published_at, image_url, constellation_graphic_path, zodiac_sign_tag',
    )
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

  const title = post.title?.trim() || `The Moon enters ${post.zodiac_sign_tag ?? 'a new sign'}`
  const sourceUrl = post.slug
    ? post.category
      ? `${SITE_URL}/blog/${post.category}/${post.slug}`
      : `${SITE_URL}/blog/${post.slug}`
    : SITE_URL

  const imageUrl =
    post.image_url?.trim() ||
    (post.constellation_graphic_path
      ? `${SITE_URL}${post.constellation_graphic_path.startsWith('/') ? '' : '/'}${post.constellation_graphic_path}`
      : null)

  const scheduledAt =
    post.substack_scheduled_at || post.published_at || post.publish_at || new Date().toISOString()

  // Flat payload — no nested wrappers — so n8n can map fields directly.
  const payload = {
    post_id: post.id,
    slug: post.slug ?? null,
    title,
    body: copy,
    content: copy,
    excerpt: post.excerpt ?? null,
    subject: title,
    status: 'publish',
    scheduled_time: scheduledAt,
    scheduled_at: scheduledAt,
    zodiac_sign: post.zodiac_sign_tag ?? null,
    image_url: imageUrl,
    source_url: sourceUrl,
    canonical: sourceUrl,
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const raw = await res.text().catch(() => '')
    if (!res.ok) {
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

    return { ok: true, title, url: url ?? undefined }
  } catch (e) {
    const message = errorText(e)
    await recordFailure(supabase, postId, message)
    await reportError({
      source: 'substack-auto-post',
      severity: 'error',
      message: `Substack webhook dispatch failed for "${title}": ${message}`,
      context: { postId, webhook: WEBHOOK_URL },
      throttleMinutes: 30,
    })
    return { ok: false, reason: message, title }
  }
}
