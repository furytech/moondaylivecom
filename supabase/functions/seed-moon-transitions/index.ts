// seed-moon-transitions
// Computes upcoming Moon sign ingresses using astronomy-engine and upserts
// them into public.moon_transitions. Intended to run on a daily Composio cron.
//
// Auth: caller must present the service-role key either as a Bearer token
// or via the x-internal-auth header. Anonymous callers are rejected so the
// table cannot be poisoned.

import { EclipticGeoMoon, AstroTime } from "https://esm.sh/astronomy-engine@2.1.19";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-auth",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

function moonLongitude(date: Date): number {
  const ecl = EclipticGeoMoon(new AstroTime(date));
  return ((ecl.lon % 360) + 360) % 360;
}

function signFromLongitude(lon: number): string {
  return ZODIAC[Math.floor(lon / 30)];
}

function computeTransitions(from: Date, to: Date) {
  const events: { transition_at: string; from_sign: string; to_sign: string }[] = [];
  const stepMs = 10 * 60 * 1000; // 10-minute coarse scan
  let prevSign = signFromLongitude(moonLongitude(from));

  for (let t = from.getTime() + stepMs; t <= to.getTime(); t += stepMs) {
    const sign = signFromLongitude(moonLongitude(new Date(t)));
    if (sign !== prevSign) {
      // Bisect to ~second precision
      let lo = t - stepMs;
      let hi = t;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (signFromLongitude(moonLongitude(new Date(mid))) === prevSign) lo = mid;
        else hi = mid;
      }
      events.push({
        transition_at: new Date(hi).toISOString(),
        from_sign: prevSign,
        to_sign: sign,
      });
      prevSign = sign;
    }
  }
  return events;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- Auth gate: service-role only ---
  const authHeader = req.headers.get("authorization") ?? "";
  const internalHeader = req.headers.get("x-internal-auth") ?? "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const isInternal =
    (bearer && bearer === serviceKey) ||
    (internalHeader && internalHeader === serviceKey);

  if (!isInternal) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = req.method === "POST"
      ? await req.json().catch(() => ({}))
      : {};
    const daysAhead = Math.max(1, Math.min(730, Number(body.days_ahead ?? 180)));
    const daysBehind = Math.max(0, Math.min(730, Number(body.days_behind ?? 7)));

    const from = new Date(Date.now() - daysBehind * 86400_000);
    const to = new Date(Date.now() + daysAhead * 86400_000);

    const events = computeTransitions(from, to);

    const { error: upsertErr, count } = await supabase
      .from("moon_transitions")
      .upsert(events, { onConflict: "transition_at", count: "exact" });

    if (upsertErr) throw upsertErr;

    return new Response(
      JSON.stringify({
        ok: true,
        window: { from: from.toISOString(), to: to.toISOString() },
        computed: events.length,
        upserted: count ?? events.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("seed-moon-transitions error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
