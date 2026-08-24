import { createClient } from 'npm:@supabase/supabase-js@2'
import { reportError, errorText } from './errorTracking.ts'
import { sendAppEmail } from './sendAppEmail.ts'


/**
 * Substack email-to-draft bridge.
 *
 * Substack has no public API for creating drafts, so the bridge emails the
 * fully formatted edition to the editor's inbox. The email body is rendered as
 * real headings/paragraphs/quotes, so one select-all + paste into the Substack
 * composer produces a structured draft with no manual reformatting.
 *
 * Recipients: SUBSTACK_DRAFT_EMAIL when set, otherwise every admin returned by
 * admin_alert_emails().
 */

const SITE_URL = 'https://moondaylive.com'

type Client = ReturnType<typeof createClient>

export interface BridgePost {
  id: string
  slug?: string | null
  title?: string | null
  category?: string | null
  substack_post?: string | null
  zodiac_sign_tag?: string | null
  publish_at?: string | null
  published_at?: string | null
  substack_bridge_sent_at?: string | null
}

async function resolveRecipients(supabase: Client): Promise<string[]> {
  const override = Deno.env.get('SUBSTACK_DRAFT_EMAIL')
  if (override?.trim()) {
    return override
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)
  }

  const { data, error } = await supabase.rpc('admin_alert_emails')
  if (error || !Array.isArray(data)) return []

  const recipients = new Set<string>()
  for (const row of data as { email: string }[]) {
    if (row?.email) recipients.add(row.email)
  }
  return [...recipients]
}

function postUrl(post: BridgePost): string | undefined {
  if (!post.slug) return undefined
  return post.category
    ? `${SITE_URL}/blog/${post.category}/${post.slug}`
    : `${SITE_URL}/blog/${post.slug}`
}

export interface BridgeResult {
  sent: boolean
  reason?: string
  recipients?: number
}

/**
 * Emails one post's Substack edition. Idempotent per post + recipient via the
 * idempotency key, and skipped entirely when the bridge already ran for the
 * post unless `force` is set (used by the manual resend button).
 */
export async function sendSubstackDraft(
  supabase: Client,
  post: BridgePost,
  opts: { force?: boolean } = {},
): Promise<BridgeResult> {
  if (!post.substack_post?.trim()) {
    return { sent: false, reason: 'no_substack_copy' }
  }
  if (post.substack_bridge_sent_at && !opts.force) {
    return { sent: false, reason: 'already_sent' }
  }

  const recipients = await resolveRecipients(supabase)
  if (recipients.length === 0) {
    await reportError({
      source: 'substack-bridge',
      severity: 'error',
      message: 'No recipient configured for the Substack draft bridge',
      context: { postId: post.id },
      throttleMinutes: 240,
    })
    return { sent: false, reason: 'no_recipients' }
  }

  // A fresh stamp on every forced resend so the queue treats it as a new email
  // rather than deduping against the original delivery.
  const attempt = opts.force ? `-${Date.now()}` : ''

  let sentAny = false
  for (const recipient of recipients) {
    try {
      const result = await sendAppEmail(supabase, 'substack-draft', recipient, {
        idempotencyKey: `substack-draft-${post.id}-${recipient}${attempt}`,
        templateData: {
          title: post.title ?? undefined,
          content: post.substack_post,
          toSign: post.zodiac_sign_tag ?? undefined,
          ingressTime: post.published_at ?? post.publish_at ?? undefined,
          postUrl: postUrl(post),
          adminUrl: `${SITE_URL}/admin/blog`,
        },
      })
      if (result.sent) sentAny = true

    } catch (e) {
      await reportError({
        source: 'substack-bridge',
        severity: 'error',
        message: `Substack draft email failed for ${recipient}: ${errorText(e)}`,
        context: { postId: post.id },
        throttleMinutes: 60,
      })
    }
  }

  // Stamp the outcome either way so the channel audit can show a real reason
  // instead of a silent gap.
  await supabase
    .from('blog_posts')
    .update(
      sentAny
        ? { substack_bridge_sent_at: new Date().toISOString(), substack_error: null }
        : { substack_error: 'The formatted draft email could not be delivered.' },
    )
    .eq('id', post.id)

  return { sent: sentAny, recipients: recipients.length }
}
