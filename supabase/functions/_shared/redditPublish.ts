import { createClient } from 'npm:@supabase/supabase-js@2'
import { reportError, errorText } from './errorTracking.ts'
import {
  addComment,
  findRecentSubmission,
  getAccessToken,
  submitImagePost,
  submitTextPost,
  uploadImage,
  RedditError,
} from './redditClient.ts'

/**
 * The publish routine shared by the cron pipeline and the admin retry button.
 *
 * Every outcome — success or failure — is written back onto the post row, so
 * the channel audit page can show what happened and when without guessing.
 */

type Client = ReturnType<typeof createClient>

const SITE_URL = 'https://moondaylive.com'

export interface PublishOutcome {
  ok: boolean
  skipped?: boolean
  reason?: string
  permalink?: string
  commented?: boolean
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
      'id, slug, title, category, reddit_post, reddit_status, image_url, constellation_graphic_path, zodiac_sign_tag',
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

  const subreddit = Deno.env.get('REDDIT_DEFAULT_SUBREDDIT')?.replace(/^\/?r\//, '').trim()
  if (!subreddit) {
    await recordFailure(supabase, postId, 'No target subreddit configured (REDDIT_DEFAULT_SUBREDDIT).')
    return { ok: false, reason: 'No target subreddit configured.' }
  }

  const title = post.title?.trim() || `The Moon enters ${post.zodiac_sign_tag ?? 'a new sign'}`
  const postUrl = post.slug
    ? post.category
      ? `${SITE_URL}/blog/${post.category}/${post.slug}`
      : `${SITE_URL}/blog/${post.slug}`
    : SITE_URL

  // Reddit reads as spam when a link is the point of the post, so the copy
  // leads and the source sits at the bottom as a plain attribution line.
  const commentBody = `${copy}\n\n---\n\n^(Full write-up: )[^(moondaylive.com)](${postUrl})^( — entertainment astrology.)`

  const imageUrl =
    post.image_url?.trim() ||
    (post.constellation_graphic_path
      ? `${SITE_URL}${post.constellation_graphic_path.startsWith('/') ? '' : '/'}${post.constellation_graphic_path}`
      : null)

  try {
    const token = await getAccessToken(supabase)

    let submission: { fullname?: string; permalink?: string } | null = null
    let usedImage = false

    if (imageUrl) {
      try {
        const assetUrl = await uploadImage(token, imageUrl)
        submission = await submitImagePost(token, subreddit, title, assetUrl)
        usedImage = true
      } catch (imgErr) {
        // The image is the nicer presentation, not the payload. If Reddit's
        // media host balks, still get the transit out as a text post.
        await reportError({
          source: 'reddit-auto-post',
          severity: 'warning',
          message: `Sign image upload failed, falling back to a text post: ${errorText(imgErr)}`,
          context: { postId, imageUrl },
          throttleMinutes: 60,
        })
      }
    }

    if (!submission) {
      submission = await submitTextPost(token, subreddit, title, commentBody)
    }

    // Image submissions finish asynchronously and come back without an id.
    if (usedImage && !submission.fullname) {
      const found = await findRecentSubmission(token, title)
      if (found) submission = { ...submission, ...found }
    }

    let commented = false
    if (usedImage && submission.fullname) {
      // Image posts carry no body, so the copy becomes the OP comment.
      await addComment(token, submission.fullname, commentBody)
      commented = true
    }

    const now = new Date().toISOString()
    const permalink =
      submission.permalink ||
      (submission.fullname ? `https://www.reddit.com/comments/${submission.fullname.replace('t3_', '')}` : null)

    await supabase
      .from('blog_posts')
      .update({
        reddit_status: 'sent',
        reddit_posted_at: now,
        reddit_attempted_at: now,
        reddit_permalink: permalink,
        reddit_error:
          usedImage && !commented
            ? 'Posted with the image, but the copy comment could not be confirmed — check the thread.'
            : null,
      })
      .eq('id', postId)

    return { ok: true, permalink: permalink ?? undefined, commented, title }
  } catch (e) {
    const message = e instanceof RedditError ? e.message : errorText(e)
    await recordFailure(supabase, postId, message)
    await reportError({
      source: 'reddit-auto-post',
      severity: 'error',
      message: `Reddit publish failed for "${title}": ${message}`,
      context: { postId, subreddit },
      throttleMinutes: 30,
    })
    return { ok: false, reason: message, title }
  }
}
