// regenerate-channel-copy
// Admin-only. Regenerates genuinely distinct Substack and Reddit editions for an
// existing transit post using the same vetted sources as the nightly generator.
// This replaces the old client-side "rebuild Substack from the blog body" trick,
// which produced newsletters identical to the website article.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { generateTransitPackage } from "../_shared/transitContent.ts";
import { buildGenerationSources } from "../_shared/generationSources.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claims?.claims) return json({ error: "Unauthorized" }, 401);

  const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
    _user_id: claims.claims.sub,
    _role: "admin",
  });
  if (roleError || !isAdmin) return json({ error: "Forbidden" }, 403);

  try {
    const { post_id: postId, channels } = await req.json();
    if (!postId) return json({ error: "post_id is required" }, 400);

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("id, title, zodiac_sign_tag, publish_at, published_at, content, substack_post, reddit_post, facebook_post, pinterest_post")
      .eq("id", postId)
      .maybeSingle();
    if (error) throw error;
    if (!post) return json({ error: "Post not found" }, 404);

    const toSign = post.zodiac_sign_tag && ZODIAC.includes(post.zodiac_sign_tag)
      ? post.zodiac_sign_tag
      : null;
    if (!toSign) return json({ error: "Post has no zodiac sign tag to regenerate from" }, 400);

    const fromSign = ZODIAC[(ZODIAC.indexOf(toSign) + 11) % 12];
    const ingress = String(post.publish_at ?? post.published_at ?? new Date().toISOString());

    const sources = await buildGenerationSources(supabase, ingress);

    const pkg = await generateTransitPackage({
      apiKey: Deno.env.get("LOVABLE_API_KEY")!,
      fromSign,
      toSign,
      transitionAtUtc: ingress,
      title: post.title ?? `The Moon Enters ${toSign}`,
      sources,
    });

    const want: string[] = Array.isArray(channels) && channels.length
      ? channels
      : ["reddit", "facebook", "pinterest"];

    const update: Record<string, unknown> = {};
    if (want.includes("blog") && pkg.blog_content) update.content = pkg.blog_content;
    if (want.includes("substack") && pkg.substack_content) update.substack_post = pkg.substack_content;
    if (want.includes("reddit") && pkg.reddit_content) update.reddit_post = pkg.reddit_content;
    if (want.includes("facebook") && pkg.facebook_content) update.facebook_post = pkg.facebook_content;
    if (want.includes("pinterest") && pkg.pinterest_content) update.pinterest_post = pkg.pinterest_content;

    if (Object.keys(update).length === 0) {
      return json({ error: "AI returned no usable copy — try again" }, 502);
    }

    const { error: updateError } = await supabase
      .from("blog_posts")
      .update(update)
      .eq("id", postId);
    if (updateError) throw updateError;

    return json({ ok: true, ...update });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});
