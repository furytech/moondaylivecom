// fill-transit-schedule
// Admin-only. Computes the REAL upcoming Moon sign ingresses with astronomy-engine
// and creates one AI-written draft per ingress that does not already have a post.
// This guarantees the schedule is never empty before a transit.

import { EclipticGeoMoon, AstroTime } from "https://esm.sh/astronomy-engine@2.1.19";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function moonLongitude(date: Date): number {
  const ecl = EclipticGeoMoon(new AstroTime(date));
  return ((ecl.lon % 360) + 360) % 360;
}
function signFromLongitude(lon: number): string {
  return ZODIAC[Math.floor(lon / 30)];
}

/** All ingresses from `from` for the next `days` days. */
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
      out.push({
        transition_at: new Date(hi).toISOString(),
        from_sign: prevSign,
        to_sign: sign,
      });
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    // --- Auth: admin JWT, or cron secret for scheduled top-ups -------------
    const cronSecret = req.headers.get("X-Cron-Secret");
    let authorized = false;

    if (cronSecret) {
      const { data: secretData } = await supabase
        .from("cron_secrets")
        .select("secret_value")
        .eq("name", "generate-draft")
        .maybeSingle();
      authorized = !!secretData && cronSecret === secretData.secret_value;
    } else {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user) {
          const { data: isAdmin } = await supabase.rpc("has_role", {
            _user_id: userData.user.id,
            _role: "admin",
          });
          authorized = !!isAdmin;
        }
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: { days?: number; limit?: number } = {};
    try {
      body = await req.json();
    } catch { /* empty body is fine */ }

    const days = Math.min(Math.max(Number(body.days) || 30, 3), 90);
    const maxDrafts = Math.min(Math.max(Number(body.limit) || 8, 1), 20);

    const now = new Date();
    const ingresses = computeIngresses(now, days).slice(0, maxDrafts);

    // Existing transit posts in the window — match by sign + ingress day so we
    // never duplicate a draft the admin already has.
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id, zodiac_sign_tag, publish_at, status")
      .eq("category", "Transits")
      .gte("publish_at", new Date(now.getTime() - 24 * 3600 * 1000).toISOString());

    const taken = new Set(
      (existing ?? [])
        .filter((p) => p.zodiac_sign_tag && p.publish_at)
        .map((p) => `${p.zodiac_sign_tag}|${String(p.publish_at).slice(0, 10)}`),
    );

    const created: { sign: string; ingress_utc: string; slug: string }[] = [];
    const skipped: { sign: string; ingress_utc: string }[] = [];

    for (const ing of ingresses) {
      const sign = ing.to_sign;
      const key = `${sign}|${ing.transition_at.slice(0, 10)}`;
      if (taken.has(key)) {
        skipped.push({ sign, ingress_utc: ing.transition_at });
        continue;
      }

      const title = `The Moon Enters ${sign}: What to Feel, Notice, and Release`;
      const slug = `${slugify(title)}-${ing.transition_at.slice(0, 10)}`;

      const pkg = await generateTransitPackage({
        apiKey: LOVABLE_API_KEY,
        fromSign: ing.from_sign,
        toSign: sign,
        transitionAtUtc: ing.transition_at,
        title,
      });

      const content = pkg.blog_content;
      const redditPost = pkg.reddit_content;

      const excerpt =
        content.replace(/[#*_>`\[\]]/g, "").split("\n").find((l) => l.trim().length > 40)?.slice(0, 180) ??
        `The Moon moves into ${sign}. Here's what to notice.`;

      const { error } = await supabase.from("blog_posts").insert({
        slug,
        title,
        category: "Transits",
        excerpt,
        content,
        reddit_post: redditPost,
        substack_post: pkg.substack_content,
        keywords: [`moon in ${sign.toLowerCase()}`, "moon transit", "moonday live"],
        read_time: 4,
        author: "Moonday Live Team",
        reviewed_by: "Moonday Live Astrologer",
        status: "draft",
        // Publish at the REAL ingress instant (UTC).
        publish_at: ing.transition_at,
        cta_type: "birthday-calculator",
        zodiac_sign_tag: sign,
        image_url: `https://moondaylive.com/assets/signs/${sign}.png`,
        constellation_graphic_path: `/assets/signs/${sign}.png`,
      });

      if (error) {
        // Unique slug collision or similar — treat as already handled.
        skipped.push({ sign, ingress_utc: ing.transition_at });
        continue;
      }

      taken.add(key);
      created.push({ sign, ingress_utc: ing.transition_at, slug });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        window_days: days,
        ingresses_found: ingresses.length,
        created_count: created.length,
        created,
        skipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
