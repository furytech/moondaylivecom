import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { codes } = await req.json();
    if (!Array.isArray(codes) || codes.length === 0 || codes.length > 20) {
      return new Response(JSON.stringify({ error: "Invalid codes payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Wipe any existing codes for this user, then insert fresh bcrypt hashes.
    // bcrypt embeds a random per-row salt and uses a slow KDF (cost=10),
    // making rainbow-table / brute-force attacks infeasible even if the
    // mfa_backup_codes table is ever read by an attacker.
    await supabase.from("mfa_backup_codes").delete().eq("user_id", userData.user.id);

    const rows = await Promise.all(
      codes.map(async (c: string) => {
        const normalized = String(c).trim().toUpperCase();
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(normalized, salt);
        return {
          user_id: userData.user!.id,
          code_hash: hash,
        };
      })
    );

    const { error: insErr } = await supabase.from("mfa_backup_codes").insert(rows);
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ success: true, count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
