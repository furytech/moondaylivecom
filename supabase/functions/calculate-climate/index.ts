// calculate-climate edge function
// Implements the Moonday "Emotional Climate" formula (Manual v1.5, Part 3)
//   EC = (I * W_phase) + (Z * W_sign) + V
// Authoritative timing source: astronomy-engine (server-side)

import { Body, Equator, Ecliptic, AstroTime } from "https://esm.sh/astronomy-engine@2.1.19";

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

// Phase weight: a constant multiplier on illumination contribution.
// Manual specifies score 0-100; we use I (0-1) * 50 so a Full Moon contributes up to +50.
const PHASE_WEIGHT = 50;

/** Get Moon's ecliptic longitude (0-360 degrees) at a given Date. */
function moonLongitude(date: Date): number {
  const time = new AstroTime(date);
  const equ = Equator(Body.Moon, time, null as any, true, true);
  const ecl = Ecliptic(equ.vec);
  return ((ecl.elon % 360) + 360) % 360;
}

function signFromLongitude(lon: number): Sign {
  return ZODIAC[Math.floor(lon / 30)];
}

/**
 * Find the exact UTC timestamp when the Moon next crosses into a new 30° sign
 * boundary, by binary-searching forward from `from`.
 */
function findNextSignTransition(from: Date): Date {
  const startLon = moonLongitude(from);
  const currentSignIdx = Math.floor(startLon / 30);
  const targetBoundary = (currentSignIdx + 1) * 30; // next 30° multiple

  // Coarse scan: Moon moves ~13°/day, so a sign lasts ~2.5 days max. Scan 4 days.
  let lo = from.getTime();
  let hi = lo + 4 * 24 * 60 * 60 * 1000;

  // Bisect for crossing of targetBoundary (mod 360)
  const crossed = (t: number) => {
    const lon = moonLongitude(new Date(t));
    // Normalize so targetBoundary maps near 0
    const delta = ((lon - targetBoundary + 540) % 360) - 180;
    return delta >= 0; // we've crossed when we're at/after the boundary
  };

  // Ensure hi is past the crossing
  let safety = 0;
  while (!crossed(hi) && safety < 6) {
    hi += 24 * 60 * 60 * 1000;
    safety++;
  }

  // Binary search to ~1-minute precision
  while (hi - lo > 60 * 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (crossed(mid)) hi = mid;
    else lo = mid;
  }
  return new Date(hi);
}

interface RequestBody {
  illumination?: number;     // 0-1
  zodiac_sign?: string;      // optional override; else computed server-side
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = req.method === "POST"
      ? await req.json().catch(() => ({}))
      : {};

    // Validate illumination
    let I = typeof body.illumination === "number" ? body.illumination : NaN;
    if (Number.isNaN(I)) {
      return new Response(
        JSON.stringify({ error: "illumination (0-1 float) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    I = Math.max(0, Math.min(1, I));

    const now = new Date();
    const lon = moonLongitude(now);
    const computedSign = signFromLongitude(lon);

    // Honor client sign if provided & valid; otherwise use server truth
    const signInput = (body.zodiac_sign ?? "").trim();
    const matched = ZODIAC.find(s => s.toLowerCase() === signInput.toLowerCase());
    const sign: Sign = matched ?? computedSign;

    // Authoritative next transition (server-side)
    const nextTransition = findNextSignTransition(now);
    const msUntil = nextTransition.getTime() - now.getTime();
    const hoursUntil = msUntil / (1000 * 60 * 60);

    // +15 volatility if within 2h before OR 2h after a transition.
    // "After" means: we're early in the current sign (just crossed in).
    const degIntoSign = lon - Math.floor(lon / 30) * 30; // 0-30
    // Moon moves ~0.55°/hr → 2h ≈ 1.1° into the new sign
    const justEntered = degIntoSign < 1.1;
    const aboutToLeave = hoursUntil <= 2;
    const volatility_alert = aboutToLeave || justEntered;
    const V = volatility_alert ? 15 : 0;

    const W_sign = ELEMENT_WEIGHT[sign];
    const Z = 1; // sign weight applied as a flat element offset (per manual)

    const rawScore = I * PHASE_WEIGHT + Z * W_sign + V;
    // Center around 50 so a balanced Air New Moon ≈ 50; clamp 0-100
    const climate_score = Math.max(0, Math.min(100, Math.round(50 + rawScore - PHASE_WEIGHT / 2)));

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
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("calculate-climate error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
