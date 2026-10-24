import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { decideSettle } from "../_shared/pendingMoonSignRules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Saves a Moon-change quiz result for an account that has not confirmed its email yet, so the result
// survives the member opening the confirmation link in a different browser or device. The account's id
// (returned to the signing-up browser only) is the key; it only fills an empty sign on a fresh,
// unconfirmed account with a birthday, and never overwrites a saved sign.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { userId, sign } = await req.json();
    if (typeof userId !== "string" || !UUID.test(userId)) return json({ error: "Invalid request" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: userData } = await admin.auth.admin.getUserById(userId);
    const { data: profile } = await admin
      .from("user_profiles")
      .select("birthday, moon_sign, natal_moon_sign")
      .eq("user_id", userId)
      .maybeSingle();

    const decision = decideSettle(sign, userData?.user ?? null, profile ?? null);
    if (decision !== "ok") {
      console.log("[SAVE-PENDING-MOON-SIGN] not saved", { decision });
      // Do not reveal whether an id exists: anything but a bad sign answers the same way.
      return decision === "bad_sign" ? json({ error: "Invalid request" }, 400) : json({ saved: false });
    }

    const { error } = await admin
      .from("user_profiles")
      .update({ moon_sign: sign, natal_moon_sign: sign })
      .eq("user_id", userId)
      .is("moon_sign", null)
      .is("natal_moon_sign", null);
    if (error) {
      console.log("[SAVE-PENDING-MOON-SIGN] update failed", { error: error.message });
      return json({ error: "Could not save" }, 500);
    }
    return json({ saved: true });
  } catch (err) {
    console.log("[SAVE-PENDING-MOON-SIGN] error", { message: err instanceof Error ? err.message : String(err) });
    return json({ error: "Invalid request" }, 400);
  }
});
