// send-transit-review
// Cron-driven operator review email for upcoming Moon ingresses.
//
// Four independent channel blocks (Blog, Reddit, Facebook/Instagram,
// Pinterest), each with its own draft, the verified constellation thumbnail
// and a Web Share Intent. Nothing is auto-posted.
//
// Timing valve: the email only ever lands between 07:00 and 16:00 UTC. A
// transit outside that bracket is pre-delivered in the preceding bracket.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendAppEmail } from '../_shared/sendAppEmail.ts'
import { reportError } from '../_shared/errorTracking.ts'
import {
  CHANNEL_FIELD,
  CHANNEL_KEYS,
  CHANNEL_LABEL,
  SHARE_LABEL,
  postUrl,
  resolveZodiacAsset,
  shareIntentUrl,
  shouldSendReview,
  withCta,
} from '../_shared/channels.ts'
import { generateTransitPackage } from '../_shared/transitContent.ts'


const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const ADMIN_URL = 'https://moondaylive.com/admin/blog'

const ZODIAC = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

/**
 * Generate any missing Facebook / Pinterest copy for a transit and persist it,
 * so every channel block in the review email carries a real, native draft.
 */
async function backfillSocialDrafts(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  post: Record<string, unknown>,
  errors: string[],
): Promise<void> {
  const missing = (['facebook_post', 'pinterest_post', 'reddit_post'] as const).filter(
    (f) => !String(post[f] ?? '').trim(),
  )
  if (missing.length === 0) return

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  const toSign = typeof post.zodiac_sign_tag === 'string' ? post.zodiac_sign_tag : null
  if (!apiKey || !toSign || !ZODIAC.includes(toSign)) return

  try {
    const pkg = await generateTransitPackage({
      apiKey,
      fromSign: ZODIAC[(ZODIAC.indexOf(toSign) + 11) % 12],
      toSign,
      transitionAtUtc: String(post.publish_at),
      title: String(post.title ?? `The Moon Enters ${toSign}`),
    })

    const update: Record<string, string> = {}
    if (missing.includes('facebook_post') && pkg.facebook_content) update.facebook_post = pkg.facebook_content
    if (missing.includes('pinterest_post') && pkg.pinterest_content) update.pinterest_post = pkg.pinterest_content
    if (missing.includes('reddit_post') && pkg.reddit_content) update.reddit_post = pkg.reddit_content
    if (Object.keys(update).length === 0) return

    const { error } = await supabase.from('blog_posts').update(update).eq('id', post.id)
    if (error) {
      errors.push(`backfill-${post.id}: ${error.message}`)
      return
    }
    Object.assign(post, update)
  } catch (err) {
    errors.push(`backfill-${post.id}: ${err instanceof Error ? err.message : String(err)}`)
  }
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return json({ error: 'Server configuration error' }, 500)

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // Cron secret gate, same pattern as notify-moon-ingress.
  const cronSecret = req.headers.get('X-Cron-Secret')
  const { data: secretData } = await supabase
    .from('cron_secrets')
    .select('secret_value')
    .eq('name', 'send-transit-review')
    .maybeSingle()

  if (!secretData || cronSecret !== secretData.secret_value) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // Recipient: explicit secret if configured, otherwise fall back to the
  // project's admin emails so the review never silently stops going out.
  let recipient = Deno.env.get('TRANSIT_REVIEW_RECIPIENT')?.trim() ?? ''
  if (!recipient) {
    const { data: admins } = await supabase.rpc('admin_alert_emails')
    recipient = (admins as { email: string }[] | null)?.[0]?.email?.trim() ?? ''
  }
  if (!recipient) {
    await reportError({
      source: 'send-transit-review',
      severity: 'critical',
      message: 'No review recipient: TRANSIT_REVIEW_RECIPIENT unset and no admin email found',
    })
    return json({ error: 'No review recipient configured' }, 500)
  }


  // Test mode: same code path, same template, same recipient — but the
  // 07:00-16:00 valve is bypassed and nothing is marked as reviewed.
  let testMode = false
  try {
    const body = await req.json()
    testMode = body?.test === true
  } catch {
    // no body — normal cron invocation
  }

  const now = new Date()
  const horizon = new Date(now.getTime() + 36 * 60 * 60 * 1000)


  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(
      'id, slug, title, category, content, reddit_post, facebook_post, pinterest_post, zodiac_sign_tag, image_url, publish_at, review_email_sent_at',
    )
    .is('review_email_sent_at', null)
    .not('publish_at', 'is', null)
    .lte('publish_at', horizon.toISOString())
    .gte('publish_at', now.toISOString())
    .order('publish_at', { ascending: true })

  if (error) {
    await reportError({
      source: 'send-transit-review',
      severity: 'critical',
      message: `Failed to load transits for review: ${error.message}`,
    })
    return json({ error: 'Failed to load transits' }, 500)
  }

  let sent = 0
  let held = 0
  const errors: string[] = []

  const queue = testMode ? (posts ?? []).slice(0, 1) : (posts ?? [])

  for (const post of queue) {
    const transitAt = new Date(post.publish_at as string)

    if (!testMode && !shouldSendReview(transitAt, now)) {
      held++
      continue
    }

    // Self-heal: older drafts predate the Facebook/Pinterest channels, and the
    // model occasionally drops a key. Never email an empty channel block.
    await backfillSocialDrafts(supabase, post, errors)

    const asset = resolveZodiacAsset(post.zodiac_sign_tag, post.image_url)

    const url = postUrl(post)

    const channels = CHANNEL_KEYS.map((key) => {
      const raw = (post as Record<string, unknown>)[CHANNEL_FIELD[key]] as string | null
      const text = withCta(raw, url)
      return {
        key,
        label: CHANNEL_LABEL[key],
        text,
        shareUrl: shareIntentUrl(key, { text, url, imageUrl: asset.url }),
        shareLabel: SHARE_LABEL[key],
      }
    })

    try {
      await sendAppEmail(supabase, 'transit-review', recipient, {
        idempotencyKey: testMode
          ? `transit-review-test-${post.id}-${Date.now()}`
          : `transit-review-${post.id}`,
        templateData: {
          title: testMode ? `[TEST] ${post.title}` : post.title,
          sign: asset.sign,
          transitionTime: transitAt.toUTCString(),
          imageUrl: asset.url,
          imageWarning: asset.warning,
          adminUrl: ADMIN_URL,
          channels,
        },
      })

      if (!testMode) {
        const { error: markError } = await supabase
          .from('blog_posts')
          .update({ review_email_sent_at: new Date().toISOString() })
          .eq('id', post.id)

        if (markError) errors.push(`mark-${post.id}: ${markError.message}`)
      }
      sent++

    } catch (err) {
      errors.push(`send-${post.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (errors.length > 0) {
    await reportError({
      source: 'send-transit-review',
      severity: 'critical',
      message: `${errors.length} transit review email(s) failed`,
      context: { errors: errors.slice(0, 20) },
    })
  }

  return json({ sent, held, candidates: posts?.length ?? 0, errors: errors.length || undefined })
})
