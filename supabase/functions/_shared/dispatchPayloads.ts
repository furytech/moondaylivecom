/**
 * Single source of truth for every outgoing channel payload.
 *
 * Both the live dispatchers (redditPublish / substackPublish / auto-publish)
 * and the admin "preview payload" endpoint build their JSON here, so what the
 * operator reviews before approving a transit is byte-for-byte what n8n later
 * receives.
 */

export const SITE_URL = 'https://moondaylive.com'

/** Columns every builder needs. Keep dispatchers and preview reading the same set. */
export const DISPATCH_POST_COLUMNS =
  'id, slug, title, excerpt, category, content, status, reddit_post, reddit_status, reddit_scheduled_at, reddit_posted_at, substack_post, substack_status, substack_scheduled_at, substack_sent_at, publish_at, published_at, image_url, constellation_graphic_path, zodiac_sign_tag, meta_title, meta_description, keywords, author, guest_display_name'

// deno-lint-ignore no-explicit-any
export type DispatchPost = Record<string, any>

export const REDDIT_WEBHOOK_URL =
  Deno.env.get('REDDIT_WEBHOOK_URL')?.trim() ||
  'http://192.241.153.228:8055/webhook/reddit-approval'

export const SUBSTACK_WEBHOOK_URL =
  Deno.env.get('SUBSTACK_WEBHOOK_URL')?.trim() ||
  'http://192.241.153.228:8055/webhook/substack-post'

export function resolveSourceUrl(post: DispatchPost): string {
  if (!post.slug) return SITE_URL
  return post.category
    ? `${SITE_URL}/blog/${post.category}/${post.slug}`
    : `${SITE_URL}/blog/${post.slug}`
}

/** image_url first, constellation graphic second — same rule everywhere. */
export function resolveImageUrl(post: DispatchPost): string | null {
  const direct = post.image_url?.trim()
  if (direct) return direct
  if (post.constellation_graphic_path) {
    const path = post.constellation_graphic_path
    return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  }
  return null
}

export function resolveTitle(post: DispatchPost): string {
  return post.title?.trim() || `The Moon enters ${post.zodiac_sign_tag ?? 'a new sign'}`
}

/** The Moonday "M" mark, served from the site so every channel can hotlink it. */
export const BRAND_LOGO_URL = `${SITE_URL}/moonday-logo.png`

/** Hosted CTA button image (navy pill, lime border, logo) every channel can hotlink. */
export const BRAND_CTA_URL = `${SITE_URL}/moonday-cta-button.png`

/**
 * Clickable button for channels that accept raw HTML (Substack).
 * A linked <img> survives Substack's sanitizer where styled anchors get
 * flattened into plain text links — this is the reliable "button".
 */
export function brandButtonHtml(href: string = SITE_URL): string {
  return `<p style="text-align:center;margin:28px 0;"><a href="${href}" target="_blank" rel="noopener"><img src="${BRAND_CTA_URL}" alt="Check your moon sign on MoondayLive.com" width="520" style="width:100%;max-width:520px;height:auto;border:0;display:inline-block;" /></a></p>`
}

/** Markdown equivalent (logo image link) for markdown-only surfaces. */
export function brandButtonMarkdown(href: string = SITE_URL): string {
  return `[![Moonday Live](${BRAND_LOGO_URL})](${href})\n\n**[Read this on MoondayLive.com](${href})**`
}

/** Reddit self-posts don't render images, so the mark becomes a plain link line. */
export function brandLinkReddit(href: string = SITE_URL): string {
  return `[Moonday Live -> ${href.replace(/^https?:\/\//, '')}](${href})`
}

/** Top + bottom brand buttons around a body. */
function wrapBrand(body: string, href: string, button: string): string {
  return `${button}\n\n${body.trim()}\n\n${button}`
}

/**
 * Reddit renders a blank line between blocks as a full paragraph gap (the
 * "double spacing" the operator sees). A bare single newline is the opposite
 * problem: Reddit's markdown joins those lines into one run-on paragraph.
 *
 * The single-spaced result Reddit actually honours is a Markdown hard break:
 * two trailing spaces before the newline.
 */
export function singleSpace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('  \n')
    .trim()
}

export function buildRedditPayload(post: DispatchPost) {
  const scheduledAt =
    post.reddit_scheduled_at || post.published_at || post.publish_at || new Date().toISOString()
  const sourceUrl = resolveSourceUrl(post)
  const link = brandLinkReddit(sourceUrl)
  const copy = singleSpace(post.reddit_post ?? '')
  // Body single-spaced; brand links in their own paragraphs so Reddit renders
  // them as standalone lines at the top and bottom.
  const body = `${link}\n\n${copy}\n\n${link}`


  return {
    post_id: post.id,
    slug: post.slug ?? null,
    title: resolveTitle(post),
    body,
    content: body,
    status: 'publish',
    scheduled_time: scheduledAt,
    scheduled_at: scheduledAt,
    subreddit: Deno.env.get('REDDIT_DEFAULT_SUBREDDIT')?.replace(/^\/?r\//, '').trim() || null,
    zodiac_sign: post.zodiac_sign_tag ?? null,
    image_url: resolveImageUrl(post),
    source_url: sourceUrl,
  }
}

export function buildSubstackPayload(post: DispatchPost) {
  const scheduledAt =
    post.substack_scheduled_at || post.published_at || post.publish_at || new Date().toISOString()
  const title = resolveTitle(post)
  const subtitle = (post.meta_description || post.excerpt || '').trim().slice(0, 180) || null
  const sourceUrl = resolveSourceUrl(post)
  const imageUrl = resolveImageUrl(post)
  const buttonHtml = brandButtonHtml(sourceUrl)
  const copy = wrapBrand(post.substack_post?.trim() ?? '', sourceUrl, brandButtonMarkdown(sourceUrl))

  return {
    post_id: post.id,
    slug: post.slug ?? null,
    title,
    subtitle,
    body: copy,
    content: copy,
    excerpt: post.excerpt ?? null,
    subject: title,
    status: 'publish',
    scheduled_time: scheduledAt,
    scheduled_at: scheduledAt,
    zodiac_sign: post.zodiac_sign_tag ?? null,
    image_url: imageUrl,
    logo_url: BRAND_LOGO_URL,
    // Ready-to-paste inline HTML so the PNG always renders in the published
    // Substack edition even if the workflow does no image handling of its own.
    image_html: imageUrl
      ? `<img src="${imageUrl}" alt="${post.zodiac_sign_tag ?? title}" width="600" style="display:block;margin:0 auto 24px;max-width:100%;height:auto;" />`
      : null,
    brand_button_html: buttonHtml,
    header_html: buttonHtml,
    footer_html: buttonHtml,
    source_url: sourceUrl,
    canonical: sourceUrl,
  }
}


/**
 * The blog has no webhook — it publishes in-place. The preview still shows the
 * exact record mutation the scheduler performs, so all three channels can be
 * audited from one screen.
 */
export function buildBlogPayload(post: DispatchPost) {
  const publishAt = post.publish_at || post.published_at || new Date().toISOString()
  return {
    post_id: post.id,
    slug: post.slug ?? null,
    title: resolveTitle(post),
    category: post.category ?? null,
    excerpt: post.excerpt ?? null,
    status: 'published',
    publish_at: publishAt,
    published_at: post.published_at ?? null,
    zodiac_sign: post.zodiac_sign_tag ?? null,
    image_url: resolveImageUrl(post),
    canonical: resolveSourceUrl(post),
    meta_title: post.meta_title ?? null,
    meta_description: post.meta_description ?? null,
    author: post.guest_display_name || post.author || null,
    body_chars: (post.content ?? '').length,
  }
}

export function buildPayload(channel: 'blog' | 'substack' | 'reddit', post: DispatchPost) {
  if (channel === 'blog') return buildBlogPayload(post)
  if (channel === 'reddit') return buildRedditPayload(post)
  return buildSubstackPayload(post)
}

export function webhookFor(channel: 'blog' | 'substack' | 'reddit'): string | null {
  if (channel === 'reddit') return REDDIT_WEBHOOK_URL
  if (channel === 'substack') return SUBSTACK_WEBHOOK_URL
  return null
}
