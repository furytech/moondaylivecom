// calculate-climate edge function
// Implements the Moonday "Emotional Climate" formula (Manual v1.5, Part 3)
//   EC = (I * W_phase) + (Z * W_sign) + V
// Authoritative timing source: astronomy-engine (server-side)
// Persistence: every successful result is logged to public.moon_history.
// Resilience: if astronomy-engine fails, fall back to the most recent log entry
// so the gauge never goes blank.

import { EclipticGeoMoon, AstroTime } from "https://esm.sh/astronomy-engine@2.1.19";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

type Sign = typeof ZODIAC[number];

const ELEMENT_WEIGHT: Record<Sign, number> = {
  Cancer: 10, Scorpio: 10, Pisces: 10,           // Water +10
  Aries: -5, Leo: -5, Sagittarius: -5,           // Fire  -5
  Taurus: 5, Virgo: 5, Capricorn: 5,             // Earth +5
  Gemini: 0, Libra: 0, Aquarius: 0,              // Air    0
};

const ELEMENT_OF: Record<Sign, "Water" | "Fire" | "Earth" | "Air"> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

const PHASE_WEIGHT = 50;

function moonLongitude(date: Date): number {
  const time = new AstroTime(date);
  const ecl = EclipticGeoMoon(time);
  return ((ecl.lon % 360) + 360) % 360;
}

function signFromLongitude(lon: number): Sign {
  return ZODIAC[Math.floor(lon / 30)];
}

function findNextSignTransition(from: Date): Date {
  const startLon = moonLongitude(from);
  const currentSignIdx = Math.floor(startLon / 30);
  const targetBoundary = (currentSignIdx + 1) * 30;

  let lo = from.getTime();
  let hi = lo + 4 * 24 * 60 * 60 * 1000;

  const crossed = (t: number) => {
    const lon = moonLongitude(new Date(t));
    const delta = ((lon - targetBoundary + 540) % 360) - 180;
    return delta >= 0;
  };

  let safety = 0;
  while (!crossed(hi) && safety < 6) {
    hi += 24 * 60 * 60 * 1000;
    safety++;
  }

  while (hi - lo > 60 * 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (crossed(mid)) hi = mid;
    else lo = mid;
  }
  return new Date(hi);
}

interface RequestBody {
  illumination?: number;
  zodiac_sign?: string;
}

// Service-role client (server-only): used to write logs and read fallback rows.
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = req.method === "POST"
      ? await req.json().catch(() => ({}))
      : {};

    let I = typeof body.illumination === "number" ? body.illumination : NaN;
    if (Number.isNaN(I)) {
      return new Response(
        JSON.stringify({ error: "illumination (0-1 float) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    I = Math.max(0, Math.min(1, I));

    const now = new Date();

    // === Primary path: astronomy-engine ===
    try {
      const lon = moonLongitude(now);
      const computedSign = signFromLongitude(lon);

      const signInput = (body.zodiac_sign ?? "").trim();
      const matched = ZODIAC.find(s => s.toLowerCase() === signInput.toLowerCase());
      const sign: Sign = matched ?? computedSign;

      const nextTransition = findNextSignTransition(now);
      const msUntil = nextTransition.getTime() - now.getTime();
      const hoursUntil = msUntil / (1000 * 60 * 60);

      const degIntoSign = lon - Math.floor(lon / 30) * 30;
      const justEntered = degIntoSign < 1.1;
      const aboutToLeave = hoursUntil <= 2;
      const volatility_alert = aboutToLeave || justEntered;
      const V = volatility_alert ? 15 : 0;

      const W_sign = ELEMENT_WEIGHT[sign];
      const Z = 1;

      const rawScore = I * PHASE_WEIGHT + Z * W_sign + V;
      const climate_score = Math.max(0, Math.min(100, Math.round(50 + rawScore - PHASE_WEIGHT / 2)));

      // Persist to moon_history ONLY when the caller proves internal/service-role auth.
      // Public/anonymous callers still receive the live computation, but cannot write —
      // eliminating anonymous DB writes entirely while keeping the gauge usable for
      // signed-out homepage visitors.
      const authHeader = req.headers.get("authorization") ?? "";
      const internalHeader = req.headers.get("x-internal-auth") ?? "";
      const bearer = authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : "";
      const isInternalCaller =
        (bearer && bearer === serviceKey) ||
        (internalHeader && internalHeader === serviceKey);

      if (isInternalCaller) {
        try {
          const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          const { data: recent } = await supabase
            .from("moon_history")
            .select("id")
            .gte("created_at", fiveMinAgo)
            .limit(1)
            .maybeSingle();

          if (!recent) {
            const { error: insertErr } = await supabase
              .from("moon_history")
              .insert({
                climate_score,        // derived from server astronomy
                zodiac_sign: sign,    // derived from server astronomy
                volatility_alert,     // derived from server astronomy
              });
            if (insertErr) console.error("moon_history insert failed:", insertErr);
          }
        } catch (rlErr) {
          console.error("moon_history write check failed:", rlErr);
        }
      }

      return new Response(
        JSON.stringify({
          climate_score,
          breakdown: {
            illumination: I,
            phase_contribution: Math.round(I * PHASE_WEIGHT * 10) / 10,
            sign,
            element: ELEMENT_OF[sign],
            sign_weight: W_sign,
            volatility_offset: V,
            volatility_alert,
            hours_until_next_transition: Math.round(hoursUntil * 10) / 10,
            next_transition_utc: nextTransition.toISOString(),
          },
          formula: "EC = (I * W_phase) + (Z * W_sign) + V",
          computed_at: now.toISOString(),
          source: "live",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (engineErr) {
      // === Fallback path: most recent moon_history row ===
      console.error("astronomy-engine failed, attempting fallback:", engineErr);

      const { data: last, error: fbErr } = await supabase
        .from("moon_history")
        .select("climate_score, zodiac_sign, volatility_alert, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fbErr || !last) {
        return new Response(
          JSON.stringify({
            error: "Live calculation failed and no historical fallback is available.",
            details: (engineErr as Error).message,
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const sign = (last.zodiac_sign as Sign);
      return new Response(
        JSON.stringify({
          climate_score: last.climate_score,
          breakdown: {
            illumination: I,
            phase_contribution: Math.round(I * PHASE_WEIGHT * 10) / 10,
            sign,
            element: ELEMENT_OF[sign] ?? "Unknown",
            sign_weight: ELEMENT_WEIGHT[sign] ?? 0,
            volatility_offset: last.volatility_alert ? 15 : 0,
            volatility_alert: last.volatility_alert,
            hours_until_next_transition: 0,
            next_transition_utc: last.created_at,
          },
          formula: "EC = (I * W_phase) + (Z * W_sign) + V",
          computed_at: now.toISOString(),
          source: "fallback",
          fallback_from: last.created_at,
          notice: "Live astronomy data unavailable — showing the most recent recorded reading.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (err) {
    console.error("calculate-climate fatal error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
