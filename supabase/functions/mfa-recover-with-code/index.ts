// Allows a user holding an AAL1 session (signed in, MFA pending) to consume a
// backup code and have their TOTP factor removed by the service role, restoring
// access. After recovery the user should re-enroll MFA from Sovereign Security.
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

    const admin = createClient(
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

    const { code } = await req.json();
    if (typeof code !== "string" || code.trim().length < 4) {
      return new Response(JSON.stringify({ error: "Invalid code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalized = code.trim().toUpperCase().replace(/\s+/g, "");

    // Fetch all unused codes for this user; bcrypt hashes embed their own salt
    // so we must compare against each candidate row.
    const { data: rows, error } = await admin
      .from("mfa_backup_codes")
      .select("id, code_hash, used_at")
      .eq("user_id", userData.user.id)
      .is("used_at", null);

    if (error) throw error;

    let matchedId: string | null = null;
    for (const row of rows ?? []) {
      try {
        if (await bcrypt.compare(normalized, row.code_hash)) {
          matchedId = row.id;
          break;
        }
      } catch {
        // ignore malformed hashes
      }
    }

    if (!matchedId) {
      return new Response(JSON.stringify({ error: "Code is invalid or already used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atomic consume: only succeeds if still unused. Prevents TOCTOU double-use.
    const { data: updated, error: updErr } = await admin
      .from("mfa_backup_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", matchedId)
      .is("used_at", null)
      .select("id");

    if (updErr) throw updErr;
    if (!updated || updated.length === 0) {
      return new Response(JSON.stringify({ error: "Code is invalid or already used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Remove every TOTP factor on this user so they regain access
    const { data: factors } = await admin.auth.admin.mfa.listFactors({
      userId: userData.user.id,
    });
    for (const f of factors?.factors ?? []) {
      await admin.auth.admin.mfa.deleteFactor({
        userId: userData.user.id,
        id: f.id,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
