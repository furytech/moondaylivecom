// Allows a user holding an AAL1 session (signed in, MFA pending) to consume a
// backup code and have their TOTP factor removed by the service role, restoring
// access. After recovery the user should re-enroll MFA from Sovereign Security.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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

    const hash = await sha256(code.trim().toUpperCase().replace(/\s+/g, ""));

    const { data: row, error } = await admin
      .from("mfa_backup_codes")
      .select("id, used_at")
      .eq("user_id", userData.user.id)
      .eq("code_hash", hash)
      .maybeSingle();

    if (error || !row || row.used_at) {
      return new Response(JSON.stringify({ error: "Code is invalid or already used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark consumed
    await admin
      .from("mfa_backup_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id);

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
