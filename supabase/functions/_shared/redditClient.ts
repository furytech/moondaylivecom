// Reddit API client for the Moonday publishing pipeline.
//
// Auth model: a long-lived refresh token captured once through the
// `reddit-oauth` function and stored in `cron_secrets` under
// 'reddit_refresh_token'. Every run exchanges it for a short-lived access
// token — nothing user-facing ever holds a Reddit credential.
//
// Posting model: Reddit image submissions cannot carry body text, so the
// pipeline submits the sign image as the post and then adds the generated copy
// as the first (OP) comment. That is the convention native to the platform and
// keeps the image in the feed thumbnail.

import { createClient } from 'npm:@supabase/supabase-js@2'

type Client = ReturnType<typeof createClient>

const USER_AGENT =
  Deno.env.get('REDDIT_USER_AGENT') || 'web:com.moondaylive.journal:v1.0 (by /u/moondaylive)'

export class RedditError extends Error {}

async function getRefreshToken(supabase: Client): Promise<string> {
  const { data, error } = await supabase
    .from('cron_secrets')
    .select('secret_value')
    .eq('name', 'reddit_refresh_token')
    .maybeSingle()

  if (error) throw new RedditError(`Could not read the Reddit refresh token: ${error.message}`)
  if (!data?.secret_value) {
    throw new RedditError(
      'Reddit is not authorized yet. Open the reddit-oauth link once to connect the account.',
    )
  }
  return data.secret_value
}

export async function getAccessToken(supabase: Client): Promise<string> {
  const clientId = Deno.env.get('REDDIT_CLIENT_ID')
  const clientSecret = Deno.env.get('REDDIT_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new RedditError('REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET are not configured.')
  }

  const refreshToken = await getRefreshToken(supabase)

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body?.access_token) {
    throw new RedditError(
      `Reddit token exchange failed (${res.status}): ${body?.error ?? 'no access_token returned'}`,
    )
  }
  return body.access_token as string
}

function oauthHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'User-Agent': USER_AGENT }
}

/**
 * Uploads an image to Reddit's media host and returns the resulting asset URL,
 * which is what /api/submit expects for an image post.
 */
export async function uploadImage(token: string, imageUrl: string): Promise<string> {
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new RedditError(`Could not fetch the sign image (${imgRes.status})`)

  const bytes = new Uint8Array(await imgRes.arrayBuffer())
  const mimetype = imgRes.headers.get('content-type')?.split(';')[0] || 'image/png'
  const filename = imageUrl.split('/').pop()?.split('?')[0] || 'sign.png'

  const leaseRes = await fetch('https://oauth.reddit.com/api/media/asset.json', {
    method: 'POST',
    headers: { ...oauthHeaders(token), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ filepath: filename, mimetype }),
  })

  const lease = await leaseRes.json().catch(() => null)
  const args = lease?.args
  if (!leaseRes.ok || !args?.action || !Array.isArray(args.fields)) {
    throw new RedditError(`Reddit refused the media upload lease (${leaseRes.status})`)
  }

  const action = args.action.startsWith('//') ? `https:${args.action}` : args.action
  const form = new FormData()
  for (const field of args.fields as { name: string; value: string }[]) {
    form.append(field.name, field.value)
  }
  form.append('file', new Blob([bytes], { type: mimetype }), filename)

  const uploadRes = await fetch(action, { method: 'POST', body: form })
  if (!uploadRes.ok) {
    throw new RedditError(`Image upload to Reddit's media host failed (${uploadRes.status})`)
  }

  const key = (args.fields as { name: string; value: string }[]).find((f) => f.name === 'key')?.value
  if (!key) throw new RedditError('Reddit upload response did not include an asset key')
  return `${action.replace(/\/$/, '')}/${key}`
}

export interface SubmitResult {
  /** Reddit fullname, e.g. t3_abc123 — present when Reddit reported it inline. */
  fullname?: string
  permalink?: string
}

/** Submits an image post. Reddit processes these asynchronously. */
export async function submitImagePost(
  token: string,
  subreddit: string,
  title: string,
  assetUrl: string,
): Promise<SubmitResult> {
  const res = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: { ...oauthHeaders(token), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      api_type: 'json',
      kind: 'image',
      sr: subreddit,
      title: title.slice(0, 300),
      url: assetUrl,
      sendreplies: 'true',
      resubmit: 'true',
    }),
  })

  const body = await res.json().catch(() => null)
  const errors = body?.json?.errors
  if (!res.ok || (Array.isArray(errors) && errors.length > 0)) {
    const detail = Array.isArray(errors) && errors.length ? errors.flat().join(' ') : `HTTP ${res.status}`
    throw new RedditError(`Reddit rejected the submission: ${detail}`)
  }

  return {
    fullname: body?.json?.data?.name,
    permalink: body?.json?.data?.url,
  }
}

/** Submits a markdown text post — the fallback when the image can't be uploaded. */
export async function submitTextPost(
  token: string,
  subreddit: string,
  title: string,
  text: string,
): Promise<SubmitResult> {
  const res = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: { ...oauthHeaders(token), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      api_type: 'json',
      kind: 'self',
      sr: subreddit,
      title: title.slice(0, 300),
      text,
      sendreplies: 'true',
      resubmit: 'true',
    }),
  })

  const body = await res.json().catch(() => null)
  const errors = body?.json?.errors
  if (!res.ok || (Array.isArray(errors) && errors.length > 0)) {
    const detail = Array.isArray(errors) && errors.length ? errors.flat().join(' ') : `HTTP ${res.status}`
    throw new RedditError(`Reddit rejected the submission: ${detail}`)
  }

  return { fullname: body?.json?.data?.name, permalink: body?.json?.data?.url }
}

/**
 * Image submissions come back without a fullname because Reddit finishes them
 * on a websocket. Rather than hold a socket open in an edge function, look the
 * post up in the account's own recent submissions by exact title.
 */
export async function findRecentSubmission(
  token: string,
  title: string,
): Promise<SubmitResult | null> {
  const meRes = await fetch('https://oauth.reddit.com/api/v1/me', { headers: oauthHeaders(token) })
  const me = await meRes.json().catch(() => null)
  if (!me?.name) return null

  for (let attempt = 0; attempt < 4; attempt++) {
    await new Promise((r) => setTimeout(r, attempt === 0 ? 1500 : 2500))

    const listRes = await fetch(
      `https://oauth.reddit.com/user/${me.name}/submitted?limit=10&sort=new`,
      { headers: oauthHeaders(token) },
    )
    const list = await listRes.json().catch(() => null)
    const children = list?.data?.children
    if (!Array.isArray(children)) continue

    const match = children.find(
      (c: any) => c?.data?.title?.trim() === title.trim().slice(0, 300),
    )
    if (match?.data?.name) {
      return {
        fullname: match.data.name,
        permalink: match.data.permalink
          ? `https://www.reddit.com${match.data.permalink}`
          : undefined,
      }
    }
  }
  return null
}

/** Adds the generated copy as the OP comment under an image post. */
export async function addComment(token: string, fullname: string, text: string): Promise<void> {
  const res = await fetch('https://oauth.reddit.com/api/comment', {
    method: 'POST',
    headers: { ...oauthHeaders(token), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ api_type: 'json', thing_id: fullname, text }),
  })

  const body = await res.json().catch(() => null)
  const errors = body?.json?.errors
  if (!res.ok || (Array.isArray(errors) && errors.length > 0)) {
    const detail = Array.isArray(errors) && errors.length ? errors.flat().join(' ') : `HTTP ${res.status}`
    throw new RedditError(`Could not attach the copy as a comment: ${detail}`)
  }
}
