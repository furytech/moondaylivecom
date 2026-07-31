// next-ingress
// Public read endpoint that returns the next Moon sign ingress.
// Consumed by the n8n transit-approval workflow (see src/docs/AUTOMATION_ARCHITECTURE.md)
// so it can build the admin approval email with REAL transit data.
//
// Source of truth: public.moon_transitions (seeded daily by seed-moon-transitions).
// If the table has no future row, we compute the ingress live with astronomy-engine
// so the workflow can never fall back to fake data.

import { EclipticGeoMoon, AstroTime } from "https://esm.sh/astronomy-engine@2.1.19";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { reportError, errorText } from "../_shared/errorTracking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-auth",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

const ELEMENT: Record<string, string> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

function moonLongitude(date: Date): number {
  const ecl = EclipticGeoMoon(new AstroTime(date));
  return ((ecl.lon % 360) + 360) % 360;
}

function signFromLongitude(lon: number): string {
  return ZODIAC[Math.floor(lon / 30)];
}

/** Live fallback: find the next sign change within the next 3 days. */
function computeNextIngress(from: Date) {
  const stepMs = 10 * 60 * 1000;
  const limit = from.getTime() + 3 * 24 * 60 * 60 * 1000;
  const startSign = signFromLongitude(moonLongitude(from));
  let prevSign = startSign;

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
      return {
        transition_at: new Date(hi).toISOString(),
        from_sign: prevSign,
        to_sign: sign,
      };
    }
  }
  return null;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const now = new Date();
    const supabase = createClient(supabaseUrl, serviceKey);

    let ingress: { transition_at: string; from_sign: string; to_sign: string } | null = null;
    let source = "moon_transitions";

    const { data, error } = await supabase
      .from("moon_transitions")
      .select("transition_at, from_sign, to_sign")
      .gt("transition_at", now.toISOString())
      .order("transition_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      await reportError({
        source: "next-ingress",
        severity: "error",
        message: `moon_transitions read failed: ${error.message}`,
        context: { now: now.toISOString() },
      });
    }
    if (data) ingress = data;

    if (!ingress) {
      source = "computed";
      ingress = computeNextIngress(now);
      // Falling back to live computation means the seeded transit table is
      // stale — the approval/publish workflow depends on it.
      await reportError({
        source: "next-ingress",
        severity: "error",
        message: "No future row in moon_transitions — fell back to live computation",
        context: { now: now.toISOString(), computed: ingress?.transition_at ?? null },
        throttleMinutes: 180,
      });
    }

    if (!ingress) {
      await reportError({
        source: "next-ingress",
        severity: "critical",
        message: "No upcoming ingress could be determined (DB empty and computation failed)",
        context: { now: now.toISOString() },
      });
      return new Response(
        JSON.stringify({ error: "No upcoming ingress could be determined" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ingressAt = new Date(ingress.transition_at);
    const msUntil = ingressAt.getTime() - now.getTime();
    const currentSign = signFromLongitude(moonLongitude(now));

    const fmt = (tz: string, label: string) =>
      `${ingressAt.toLocaleString("en-US", {
        timeZone: tz,
        dateStyle: "medium",
        timeStyle: "short",
      })} ${label}`;

    const ingressUtcDisplay = `${ingressAt.toLocaleString("en-GB", {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    })} UTC`;

    const payload = {
      generated_at: now.toISOString(),
      source,
      current_sign: currentSign,
      current_element: ELEMENT[currentSign] ?? null,
      next_sign: ingress.to_sign,
      next_element: ELEMENT[ingress.to_sign] ?? null,
      from_sign: ingress.from_sign,
      ingress_utc: ingressAt.toISOString(),
      // Human-readable renderings. UTC is the canonical/global one; the rest
      // are convenience conversions for major reader timezones.
      ingress_utc_display: ingressUtcDisplay,
      ingress_et: ingressAt.toLocaleString("en-US", {
        timeZone: "America/New_York",
        dateStyle: "full",
        timeStyle: "short",
      }),
      ingress_local: {
        utc: ingressUtcDisplay,
        new_york: fmt("America/New_York", "ET"),
        los_angeles: fmt("America/Los_Angeles", "PT"),
        london: fmt("Europe/London", "UK"),
        berlin: fmt("Europe/Berlin", "CET/CEST"),
        sydney: fmt("Australia/Sydney", "AET"),
      },
      hours_until: Math.round((msUntil / 3_600_000) * 10) / 10,
      minutes_until: Math.round(msUntil / 60_000),
      blog_slug: `moon-enters-${ingress.to_sign.toLowerCase()}-${ingressAt
        .toISOString()
        .slice(0, 10)}`,
      sign_image_url: `https://moondaylive.com/assets/signs/${ingress.to_sign.toLowerCase()}.png`,
      blueprint_url: "https://moondaylive.com/blueprint",
    };

    return new Response(JSON.stringify(payload), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    await reportError({
      source: "next-ingress",
      severity: "critical",
      message: `Unhandled failure: ${errorText(e)}`,
      context: { stack: e instanceof Error ? e.stack?.slice(0, 1500) : undefined },
    });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
