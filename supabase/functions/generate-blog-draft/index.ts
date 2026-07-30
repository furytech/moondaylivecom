import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

async function callAI(prompt: string, system: string): Promise<string> {
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-3.6-flash',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI gateway ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const cronSecret = req.headers.get('X-Cron-Secret');
  const { data: secretData, error: secretError } = await supabase
    .from('cron_secrets')
    .select('secret_value')
    .eq('name', 'generate-draft')
    .single();

  if (secretError || !secretData || cronSecret !== secretData.secret_value) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Pick a rotating moon sign based on the day
    const sign = SIGNS[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 12];
    const title = `The Moon Enters ${sign}: What to Feel, Notice, and Release`;
    const slug = `${slugify(title)}-${Date.now().toString(36)}`;

    const blogSystem = `You are the voice of Moonday Live — a luxury, editorial astrology brand. Tone: calm, entertaining, poetic-but-grounded. Never medical or predictive. Include a legal-safe disclaimer sentence near the end. Output pure Markdown only. Use sentence case for all headings. Include an H2 intro, three short H2 sections, and a closing H2 called "Between phases". No frontmatter, no code fences.`;

    const blogPrompt = `Write a 600–800 word Moonday Live blog post titled: "${title}". Focus on how the Moon in ${sign} feels emotionally over the next ~2.5 days, one small daily ritual, and one thing to release. Weave in the phrase "The Lunar Signature" naturally once. End with a soft nudge to check today's Lunar Signature on Moonday Live.`;

    const redditSystem = `You write short, human, low-noise Reddit posts for r/moondaylive. No hype, no emojis in the title, minimal formatting, conversational. Output pure Markdown ready to paste. Structure: a plain title line (no "Title:" prefix, no markdown heading), a blank line, then 120–180 words of body. End with one genuine open question. The body should end with the sign card image using Markdown: ![${sign} Moon card](https://moondaylive.com/assets/signs/${sign}.png)`;

    const redditPrompt = `Write a Reddit post for r/moondaylive about the Moon entering ${sign}. Share one honest observation about how this transit tends to land emotionally, invite others to share what they're noticing. Don't link out. Don't sell anything. End with the provided image markdown exactly as shown in the system prompt.`;

    const [content, redditPost] = await Promise.all([
      callAI(blogPrompt, blogSystem),
      callAI(redditPrompt, redditSystem),
    ]);


    const excerpt = content.replace(/[#*_>`\[\]]/g, '').split('\n').find(l => l.trim().length > 40)?.slice(0, 180) ?? `The Moon moves into ${sign}. Here's what to notice.`;

    // Publish 2.5 days out
    const publishAt = new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase.from('blog_posts').insert({
      slug,
      title,
      category: 'Transits',
      excerpt,
      content,
      reddit_post: redditPost,
      keywords: [`moon in ${sign.toLowerCase()}`, 'moon transit', 'moonday live'],
      read_time: 4,
      author: 'Moonday Live Team',
      status: 'draft',
      publish_at: publishAt,
      cta_type: 'birthday-calculator',
      zodiac_sign_tag: sign,
      image_url: `https://moondaylive.com/assets/signs/${sign}.png`,
      constellation_graphic_path: `/assets/signs/${sign}.png`,
    }).select().single();


    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, id: data.id, slug: data.slug }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
