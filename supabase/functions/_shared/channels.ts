/**
 * Server-side mirror of src/lib/channels.ts.
 *
 * Edge functions can't import from src/, so the four-channel model lives here
 * too. Keep the two files in step: the review email must show exactly what the
 * admin panel shows.
 */

export const SITE_URL = 'https://moondaylive.com'

export type ChannelKey = 'blog' | 'reddit' | 'facebook' | 'pinterest'

export const CHANNEL_KEYS: ChannelKey[] = ['blog', 'reddit', 'facebook', 'pinterest']

export const CHANNEL_LABEL: Record<ChannelKey, string> = {
  blog: 'Moonday Blog',
  reddit: 'Reddit',
  facebook: 'Facebook / Instagram',
  pinterest: 'Pinterest',
}

export const CHANNEL_FIELD: Record<ChannelKey, string> = {
  blog: 'content',
  reddit: 'reddit_post',
  facebook: 'facebook_post',
  pinterest: 'pinterest_post',
}

export const SHARE_LABEL: Record<ChannelKey, string> = {
  blog: 'View on site',
  reddit: 'Open Reddit',
  facebook: 'Share to Facebook',
  pinterest: 'Create Pin',
}

export const CTA_TEXT = 'Check your moon sign on MoondayLive.com'

export function ctaLine(href: string = SITE_URL): string {
  return `${CTA_TEXT} → ${href}`
}

export function withCta(text: string | null | undefined, href: string = SITE_URL): string {
  const body = (text ?? '').trim()
  if (!body) return ''
  const line = ctaLine(href)
  return body.startsWith(line) ? body : `${line}\n\n${body}\n\n${line}`
}

export const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
]

/** Verified constellation artwork; name typeset beneath the star graphic. */
export const ZODIAC_ASSETS: Record<string, { path: string; labelPosition: 'above' | 'below' }> =
  Object.fromEntries(
    ZODIAC_SIGNS.map((s) => [s, { path: `/assets/signs/${s}.png`, labelPosition: 'below' }]),
  )

export function resolveZodiacAsset(zodiacSignTag?: string | null, imageUrl?: string | null) {
  const sign = zodiacSignTag
    ? zodiacSignTag.trim().charAt(0).toUpperCase() + zodiacSignTag.trim().slice(1).toLowerCase()
    : null

  if (!sign) {
    return {
      sign: null,
      url: imageUrl?.trim() || null,
      verified: false,
      warning: 'No zodiac sign tag on this transit, so no constellation asset could be matched.',
    }
  }

  const entry = ZODIAC_ASSETS[sign]
  if (!entry) {
    return {
      sign,
      url: imageUrl?.trim() || null,
      verified: false,
      warning: `No verified constellation asset registered for ${sign}.`,
    }
  }

  return {
    sign,
    url: `${SITE_URL}${entry.path}`,
    verified: true,
    warning:
      entry.labelPosition === 'below'
        ? null
        : `${sign} artwork carries its name above the constellation, not beneath it.`,
  }
}

export function postUrl(post: { slug?: string | null; category?: string | null }): string {
  if (!post.slug) return SITE_URL
  return post.category
    ? `${SITE_URL}/blog/${post.category}/${post.slug}`
    : `${SITE_URL}/blog/${post.slug}`
}

export function shareIntentUrl(
  channel: ChannelKey,
  ctx: { text: string; url: string; imageUrl?: string | null },
): string {
  if (channel === 'reddit') return 'https://reddit.com'
  if (channel === 'facebook') {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      ctx.url,
    )}&quote=${encodeURIComponent(ctx.text.slice(0, 2000))}`
  }
  if (channel === 'pinterest') {
    const media = ctx.imageUrl ? `&media=${encodeURIComponent(ctx.imageUrl)}` : ''
    return `https://www.pinterest.com/pin-builder/?url=${encodeURIComponent(
      ctx.url,
    )}${media}&description=${encodeURIComponent(ctx.text.slice(0, 500))}`
  }
  return ctx.url
}

/* ------------------------------------------------- delivery timing valve */

/**
 * The operator's clock. The review email must land during his waking hours,
 * not at 3am, so the bracket is anchored to New York local time (DST-aware)
 * rather than UTC.
 */
export const REVIEW_TIMEZONE = 'America/New_York'
export const REVIEW_WINDOW_START_HOUR = 7
export const REVIEW_WINDOW_END_HOUR = 16

const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: REVIEW_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
})

function localParts(at: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(at).map((x) => [x.type, x.value]))
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour) % 24,
  }
}

/** UTC offset (ms) of the review timezone at a given instant. */
function tzOffsetMs(at: Date): number {
  const { year, month, day, hour } = localParts(at)
  const minute = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: REVIEW_TIMEZONE, minute: '2-digit' }).format(at),
  )
  const asUtc = Date.UTC(year, month - 1, day, hour, minute)
  return asUtc - (at.getTime() - (at.getTime() % 60_000))
}

/** The instant corresponding to a given local wall-clock hour on the local day of `ref`. */
function localHourInstant(ref: Date, hour: number): Date {
  const { year, month, day } = localParts(ref)
  const guess = new Date(Date.UTC(year, month - 1, day, hour))
  // Correct the guess by the offset in force at that moment.
  const corrected = new Date(guess.getTime() - tzOffsetMs(guess))
  return corrected
}

/** True when `at` sits inside the 07:00-16:00 local delivery bracket. */
export function inDeliveryWindow(at: Date): boolean {
  const h = localParts(at).hour
  return h >= REVIEW_WINDOW_START_HOUR && h < REVIEW_WINDOW_END_HOUR
}

/**
 * The latest 07:00-16:00 local bracket that ends at or before the transit.
 *
 * A transit inside the bracket is reviewed earlier the same day; a transit
 * outside it (overnight, early morning) is pre-delivered in the preceding
 * bracket so nothing ever lands while he is asleep.
 */
export function reviewSendWindow(transitAt: Date): { open: Date; close: Date } {
  const open = localHourInstant(transitAt, REVIEW_WINDOW_START_HOUR)
  const close = localHourInstant(transitAt, REVIEW_WINDOW_END_HOUR)

  // Transit lands before today's bracket even opens: use yesterday's bracket.
  if (transitAt.getTime() <= open.getTime()) {
    const prev = new Date(transitAt.getTime() - 86_400_000)
    return {
      open: localHourInstant(prev, REVIEW_WINDOW_START_HOUR),
      close: localHourInstant(prev, REVIEW_WINDOW_END_HOUR),
    }
  }

  // Transit lands inside the bracket: close the review window at the transit.
  if (transitAt.getTime() < close.getTime()) return { open, close: transitAt }

  return { open, close }
}

/** Should this transit's review email go out right now? */
export function shouldSendReview(transitAt: Date, now: Date = new Date()): boolean {
  if (!inDeliveryWindow(now)) return false
  const { open, close } = reviewSendWindow(transitAt)
  return now >= open && now <= close
}

