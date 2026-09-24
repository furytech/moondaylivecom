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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Validate the shared secret Make.com sends in every request
  const makeSecret = req.headers.get('X-Make-Secret');
  const expectedSecret = Deno.env.get('MAKE_SOCIAL_SECRET');

  if (!makeSecret || makeSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // GET — return published posts not yet sent to social
  if (req.method === 'GET') {
    const { data: posts, error } = await supabase
        .from('blog_posts')
        .select(
            'id, title, slug, image_url, zodiac_sign_tag, ' +
            'facebook_post, instagram_post, twitter_post, ' +
            'threads_post, pinterest_post, reddit_post'
        )
        .eq('status', 'published')
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

    return new Response(JSON.stringify({ posts: posts ?? [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // POST — stamp social_posted_at after Make.com has finished posting
  if (req.method === 'POST') {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing post id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabase
        .from('blog_posts')
        .update({ social_posted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});