// generate-blog-draft
// Cron-only. Creates ONE draft for the next real Moon sign ingress that does not
// already have a Transits post. The sign and publish time are derived from the
// ephemeris (astronomy-engine) — never from a rotating guess.

import { EclipticGeoMoon, AstroTime } from "https://esm.sh/astronomy-engine@2.1.19";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

function moonLongitude(date: Date): number {
  const ecl = EclipticGeoMoon(new AstroTime(date));
  return ((ecl.lon % 360) + 360) % 360;
}
function signFromLongitude(lon: number): string {
  return ZODIAC[Math.floor(lon / 30)];
}

/** Ingresses from `from` for the next `days` days. */
function computeIngresses(from: Date, days: number) {
  const stepMs = 10 * 60 * 1000;
  const limit = from.getTime() + days * 24 * 60 * 60 * 1000;
  const out: { transition_at: string; from_sign: string; to_sign: string }[] = [];
  let prevSign = signFromLongitude(moonLongitude(from));

  for (let t = from.getTime() + stepMs; t <= limit; t += stepMs) {
    const sign = signFromLongitude(moonLongitude(new Date(t)));
    if (sign !== prevSign) {
      let lo = t - stepMs;
      let hi = t;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (signFromLongitude(moonLongitude(new Date(mid))) === prevSign) lo = mid;
        else hi = mid;
      }
      out.push({ transition_at: new Date(hi).toISOString(), from_sign: prevSign, to_sign: sign });
      prevSign = sign;
    }
  }
  return out;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

import { generateTransitPackage } from "../_shared/transitContent.ts";


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const cronSecret = req.headers.get("X-Cron-Secret");
  const { data: secretData, error: secretError } = await supabase
    .from("cron_secrets")
    .select("secret_value")
    .eq("name", "generate-draft")
    .maybeSingle();

  if (secretError || !secretData || cronSecret !== secretData.secret_value) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const now = new Date();
    const ingresses = computeIngresses(now, 14);

    const { data: existing } = await supabase
      .from("blog_posts")
      .select("zodiac_sign_tag, publish_at")
      .eq("category", "Transits")
      .gte("publish_at", new Date(now.getTime() - 24 * 3600 * 1000).toISOString());

    const taken = new Set(
      (existing ?? [])
        .filter((p) => p.zodiac_sign_tag && p.publish_at)
        .map((p) => `${p.zodiac_sign_tag}|${String(p.publish_at).slice(0, 10)}`),
    );

    const next = ingresses.find(
      (i) => !taken.has(`${i.to_sign}|${i.transition_at.slice(0, 10)}`),
    );

    if (!next) {
      return new Response(
        JSON.stringify({ ok: true, created: false, reason: "schedule already covered" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sign = next.to_sign;
    const title = `The Moon Enters ${sign}: What to Feel, Notice, and Release`;
    const slug = `${slugify(title)}-${next.transition_at.slice(0, 10)}`;

    const blogSystem = `You are the voice of Moonday Live — a luxury, editorial astrology brand. Tone: calm, entertaining, poetic-but-grounded. Never medical or predictive. Include a legal-safe disclaimer sentence near the end. Output pure Markdown only. Use sentence case for all headings. Include an H2 intro, three short H2 sections, and a closing H2 called "Between phases". No frontmatter, no code fences.`;
    const blogPrompt = `Write a 600–800 word Moonday Live blog post titled: "${title}". The Moon leaves ${next.from_sign} and enters ${sign} at ${next.transition_at} UTC. Focus on how the Moon in ${sign} feels emotionally over the next ~2.5 days, one small daily ritual, and one thing to release. Weave in the phrase "The Lunar Signature" naturally once. End with a soft nudge to check today's Lunar Signature on Moonday Live.`;

    const redditSystem = `You write short, human, low-noise Reddit posts for r/moondaylive. No hype, no emojis in the title, minimal formatting, conversational. Output pure Markdown ready to paste. Structure: a plain title line (no "Title:" prefix, no markdown heading), a blank line, then 120–180 words of body. End with one genuine open question. Do not include any image markdown.`;
    const redditPrompt = `Write a Reddit post for r/moondaylive about the Moon entering ${sign} on ${next.transition_at} UTC. Share one honest observation about how this transit tends to land emotionally, invite others to share what they're noticing. Don't link out. Don't sell anything.`;

    const [content, redditPost] = await Promise.all([
      callAI(blogPrompt, blogSystem),
      callAI(redditPrompt, redditSystem),
    ]);

    const excerpt =
      content.replace(/[#*_>`\[\]]/g, "").split("\n").find((l) => l.trim().length > 40)?.slice(0, 180) ??
      `The Moon moves into ${sign}. Here's what to notice.`;

    const { data, error } = await supabase.from("blog_posts").insert({
      slug,
      title,
      category: "Transits",
      excerpt,
      content,
      reddit_post: redditPost,
      keywords: [`moon in ${sign.toLowerCase()}`, "moon transit", "moonday live"],
      read_time: 4,
      author: "Moonday Live Team",
      reviewed_by: "Moonday Live Astrologer",
      status: "draft",
      // Publish at the REAL ingress instant (UTC).
      publish_at: next.transition_at,
      cta_type: "birthday-calculator",
      zodiac_sign_tag: sign,
      image_url: `https://moondaylive.com/assets/signs/${sign}.png`,
      constellation_graphic_path: `/assets/signs/${sign}.png`,
    }).select().single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, created: true, id: data.id, slug: data.slug, sign, ingress_utc: next.transition_at }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
