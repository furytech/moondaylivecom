import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import {
  DISPATCH_POST_COLUMNS,
  buildPayload,
  webhookFor,
} from '../_shared/dispatchPayloads.ts'

/**
 * Admin-only preview of the exact outgoing payload for each channel.
 *
 * Uses the same builders the live dispatchers use, so nothing can drift between
 * "what I reviewed" and "what n8n received".
 */

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const CHANNELS = ['blog', 'substack', 'reddit'] as const

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401)

    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    })
    if (!isAdmin) return json({ error: 'Forbidden' }, 403)

    const body = await req.json().catch(() => ({}))
    const postId = typeof body?.post_id === 'string' ? body.post_id : null
    if (!postId) return json({ error: 'post_id is required' }, 400)

    const { data: post, error } = await admin
      .from('blog_posts')
      .select(DISPATCH_POST_COLUMNS)
      .eq('id', postId)
      .maybeSingle()

    if (error) return json({ error: error.message }, 500)
    if (!post) return json({ error: 'Post not found' }, 404)

    const channels = CHANNELS.map((channel) => {
      const payload = buildPayload(channel, post)
      const copy =
        channel === 'reddit'
          ? post.reddit_post?.trim()
          : channel === 'substack'
          ? post.substack_post?.trim()
          : post.content?.trim()
      return {
        channel,
        webhook_url: webhookFor(channel),
        will_dispatch: Boolean(copy),
        blocker: copy ? null : `No ${channel} copy stored — dispatch is skipped.`,
        has_image: Boolean((payload as { image_url?: string | null }).image_url),
        payload,
      }
    })

    return json({ post_id: postId, title: post.title, channels })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Internal error' }, 500)
  }
})
