import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const COLUMNS =
  "id, zodiac_sign_tag, image_url, twitter_post, instagram_post, threads_post, reddit_post, facebook_post, pinterest_post";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { ...corsHeaders, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-make-secret" },
    });
  }

  const expected = Deno.env.get("MAKE_SOCIAL_SECRET");
  const provided = req.headers.get("x-make-secret");
  if (!expected || !provided || provided !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(COLUMNS)
        .eq("status", "published")
        .is("social_posted_at", null)
        .order("publish_at", { ascending: true });
      if (error) throw error;
      return json({ posts: data ?? [] });
    }

    if (req.method === "POST") {
      let body: Record<string, unknown> = {};
      try {
        body = await req.json();
      } catch {
        return json({ error: "invalid JSON body" }, 400);
      }
      const id = typeof body.id === "string" ? body.id.trim() : "";
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuid.test(id)) return json({ error: "id must be a valid post id" }, 400);

      const { data, error } = await supabase
        .from("blog_posts")
        .update({ social_posted_at: new Date().toISOString() })
        .eq("id", id)
        .select("id, social_posted_at")
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "post not found" }, 404);
      return json({ ok: true, ...data });
    }

    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    console.error("Full error:", e);
    return json({ error: "Internal error" }, 500);
  }
});
