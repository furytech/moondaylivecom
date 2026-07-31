import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { reportError, errorText } from '../_shared/errorTracking.ts';

// publish-transit-draft
// Called by the n8n "Moonday Transit Approval" workflow when the user clicks
// "Approve" in the review email. It writes the transit post into public.blog_posts
// as status = 'approved' with publish_at set to the ingress time, so the existing
// auto-publish-posts edge function can make it live at the right moment.

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const SECRET_NAME = 'n8n-transit-publish';
const SITE_URL = 'https://moondaylive.com';

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function capitalizeSign(sign?: string): string {
  if (!sign) return '';
  const s = sign.trim().toLowerCase();
  const match = SIGNS.find((x) => x.toLowerCase() === s);
  return match || s.charAt(0).toUpperCase() + s.slice(1);
}

function excerptFromMarkdown(content: string): string {
  const plain = content.replace(/[#*_>`\[\]]/g, '');
  const line = plain.split('\n').map((l) => l.trim()).find((l) => l.length > 40);
  return (line ? line.slice(0, 180) : 'A Moonday Live transit note.').replace(/\s+$/, '');
}

function normalizeKeywords(input: unknown, sign?: string): string[] {
  if (Array.isArray(input)) return input.map(String).filter(Boolean);
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // fall through to comma-split
    }
    return input.split(',').map((k) => k.trim()).filter(Boolean);
  }
  const s = capitalizeSign(sign);
  return s ? [`moon in ${s.toLowerCase()}`, 'moon transit', 'moonday live'] : ['moon transit', 'moonday live'];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const sentSecret = req.headers.get('X-Workflow-Secret') || req.headers.get('x-workflow-secret');
  const { data: secretData, error: secretError } = await supabase
    .from('cron_secrets')
    .select('secret_value')
    .eq('name', SECRET_NAME)
    .single();

  if (secretError || !secretData || sentSecret !== secretData.secret_value) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await req.json();
    const {
      slug,
      title,
      content,
      reddit_post,
      category = 'Transits',
      zodiac_sign_tag,
      image_url,
      constellation_graphic_path,
      status = 'approved',
      publish_at,
      author = 'Moonday Live Team',
      reviewed_by = 'Moonday Live Astrologer',
      cta_type = 'birthday-calculator',
      read_time = 4,
      meta_title,
      meta_description,
      keywords,
    } = body;

    if (!slug || !title || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: slug, title, content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const safeSlug = slugify(slug);
    const sign = capitalizeSign(zodiac_sign_tag);
    const excerpt = body.excerpt || excerptFromMarkdown(content);
    const keywordsArr = normalizeKeywords(keywords, sign);
    const metaTitle = meta_title || title;
    const metaDescription = meta_description || excerpt;
    const safeImageUrl = image_url || `${SITE_URL}/assets/signs/${sign.toLowerCase()}.png`;
    const safeGraphic = constellation_graphic_path || `/assets/signs/${sign.toLowerCase()}.png`;

    const upsert = {
      slug: safeSlug,
      title,
      category,
      excerpt,
      content,
      reddit_post: reddit_post || null,
      zodiac_sign_tag: sign || null,
      image_url: safeImageUrl,
      constellation_graphic_path: safeGraphic,
      status,
      publish_at: publish_at || null,
      author,
      reviewed_by,
      cta_type,
      read_time: Number(read_time) || 4,
      keywords: keywordsArr,
      meta_title: metaTitle,
      meta_description: metaDescription,
      featured: false,
    };

    // Update existing transit post or insert a new one.
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', safeSlug)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(upsert)
        .eq('id', existing.id)
        .select()
        .single();
      result = { data, error };
    } else {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(upsert)
        .select()
        .single();
      result = { data, error };
    }

    if (result.error) throw result.error;

    return new Response(
      JSON.stringify({
        ok: true,
        id: result.data.id,
        slug: result.data.slug,
        status: result.data.status,
        public_url: `${SITE_URL}/blog/${result.data.slug}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    await reportError({
      source: 'publish-transit-draft',
      severity: 'critical',
      message: `Transit draft publish failed: ${errorText(e)}`,
      context: { stack: e instanceof Error ? e.stack?.slice(0, 1500) : undefined },
    });
    return new Response(
      JSON.stringify({ error: e.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
