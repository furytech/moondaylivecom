import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-make-secret',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

function sanitize(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\r\n/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  const makeSecret = req.headers.get('X-Make-Secret') || req.headers.get('x-make-secret');
  const expectedSecret = Deno.env.get('MAKE_SOCIAL_SECRET');

  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const isAuthorized = expectedSecret && (makeSecret === expectedSecret || bearerToken === expectedSecret);

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const targetTable = url.searchParams.get('table') === 'blog_posts' ? 'blog_posts' : 'transits';

  if (req.method === 'GET') {
    if (targetTable === 'transits') {
      const { data: transits, error } = await supabase
        .from('transits')
        .select('*')
        .not('published_at', 'is', null)
        .is('social_posted_at', null)
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: true })
        .limit(5);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const sanitizedTransits = (transits ?? []).map((t) => ({
        ...t,
        copy: sanitize(t.copy),
        ritual_tip: sanitize(t.ritual_tip),
        transit_title: sanitize(t.transit_title),
        transit_aspect: sanitize(t.transit_aspect),
      }));

      return new Response(
        JSON.stringify({ table: 'transits', count: sanitizedTransits.length, transits: sanitizedTransits }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fallback/Unified query for blog_posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select(
        'id, title, slug, image_url, zodiac_sign_tag, ' +
        'facebook_post, instagram_post, twitter_post, ' +
        'threads_post, pinterest_post, reddit_post, published_at, social_posted_at'
      )
      .not('published_at', 'is', null)
      .is('social_posted_at', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: true })
      .limit(5);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sanitizedPosts = (posts ?? []).map((post) => ({
      ...post,
      facebook_post: sanitize(post.facebook_post),
      instagram_post: sanitize(post.instagram_post),
      twitter_post: sanitize(post.twitter_post),
      threads_post: sanitize(post.threads_post),
      pinterest_post: sanitize(post.pinterest_post),
      reddit_post: sanitize(post.reddit_post),
    }));

    return new Response(
      JSON.stringify({ table: 'blog_posts', count: sanitizedPosts.length, posts: sanitizedPosts }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const { id, table = targetTable } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing record id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const selectedTable = table === 'blog_posts' ? 'blog_posts' : 'transits';
    const { error } = await supabase
      .from(selectedTable)
      .update({ social_posted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, table: selectedTable, id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});