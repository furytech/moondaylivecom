// Combined transition lookup: DB (authoritative cache) ALONGSIDE live astronomy.
// Strategy: query moon_transitions for ingresses that fall inside the local
// 24-hour window of the birthday. If found, return them. ALSO run the live
// calculation as a fallback / cross-check. The DB result wins when present.

import { supabase } from "@/integrations/supabase/client";
import { getTransitionInfoAsync, type TransitionInfo } from "@/lib/moonSign";

export interface CombinedTransitionInfo extends TransitionInfo {
  source: "db" | "live" | "db+live";
  dbAgreesWithLive?: boolean;
}

export async function getCombinedTransitionInfo(
  birthDate: Date,
): Promise<CombinedTransitionInfo> {
  // 24-hour UTC window matching the birthday calendar day
  const y = birthDate.getFullYear();
  const m = birthDate.getMonth();
  const d = birthDate.getDate();
  const dayStart = new Date(Date.UTC(y, m, d, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(y, m, d, 23, 59, 59));

  const live = await getTransitionInfoAsync(birthDate);

  try {
    const { data, error } = await supabase
      .from("moon_transitions")
      .select("transition_at, from_sign, to_sign")
      .gte("transition_at", dayStart.toISOString())
      .lte("transition_at", dayEnd.toISOString())
      .order("transition_at", { ascending: true })
      .limit(1);

    if (error || !data || data.length === 0) {
      return { ...live, source: "live" };
    }

    const row = data[0];
    const ingress = new Date(row.transition_at);
    const ingressHour =
      ingress.getUTCHours() + ingress.getUTCMinutes() / 60;
    const startHours = ingressHour;
    const endHours = 24 - ingressHour;
    const majoritySign =
      startHours >= endHours ? row.from_sign : row.to_sign;
    const minoritySign =
      startHours >= endHours ? row.to_sign : row.from_sign;

    const dbInfo: TransitionInfo = {
      isTransitionDay: true,
      signAtStart: row.from_sign,
      signAtEnd: row.to_sign,
      ingressHour,
      majoritySign,
      majorityHours: Math.max(startHours, endHours),
      minoritySign,
      minorityHours: Math.min(startHours, endHours),
    };

    const agrees =
      live.isTransitionDay &&
      live.signAtStart === dbInfo.signAtStart &&
      live.signAtEnd === dbInfo.signAtEnd;

    return { ...dbInfo, source: "db+live", dbAgreesWithLive: agrees };
  } catch {
    return { ...live, source: "live" };
  }
}

import { EclipticGeoMoon, AstroTime } from "astronomy-engine";

export interface MoonTransitionRow {
  transition_at: string;
  from_sign?: string;
  to_sign: string;
  transition_date?: string | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
] as const;

function signFromLon(lon: number): string {
  const norm = ((lon % 360) + 360) % 360;
  return ZODIAC_SIGNS[Math.floor(norm / 30) % 12];
}

/**
 * Formats start and end dates as short UTC transit window, e.g. "Oct 2 – Oct 4".
 */
export function formatTransitWindow(start: Date, end: Date): string {
  const startMonth = MONTHS[start.getUTCMonth()];
  const startDay = start.getUTCDate();
  const endMonth = MONTHS[end.getUTCMonth()];
  const endDay = end.getUTCDate();

  return `${startMonth} ${startDay} \u2013 ${endMonth} ${endDay}`;
}

/**
 * Live ephemeris fallback: scans forward from `from` to `to` to compute ingress instants.
 */
export function computeLiveTransitions(from: Date, to: Date): MoonTransitionRow[] {
  const events: MoonTransitionRow[] = [];
  const stepMs = 15 * 60 * 1000;
  let prevSign = signFromLon(EclipticGeoMoon(new AstroTime(from)).lon);

  for (let t = from.getTime() + stepMs; t <= to.getTime(); t += stepMs) {
    const sign = signFromLon(EclipticGeoMoon(new AstroTime(new Date(t))).lon);
    if (sign !== prevSign) {
      let lo = t - stepMs;
      let hi = t;
      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;
        if (signFromLon(EclipticGeoMoon(new AstroTime(new Date(mid))).lon) === prevSign) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      events.push({
        transition_at: new Date(hi).toISOString(),
        from_sign: prevSign,
        to_sign: sign,
        transition_date: new Date(hi).toISOString().slice(0, 10),
      });
      prevSign = sign;
    }
  }
  return events;
}

/**
 * Derives the active or next upcoming transit window for a specific zodiac sign
 * based on moon_transitions rows (or live ephemeris fallback if table is empty).
 */
export function getTransitWindowForSign(
  sign: string,
  transitions: MoonTransitionRow[] = [],
  now: Date = new Date()
): string | null {
  if (!sign) return null;
  const targetSign = sign.trim().toLowerCase();

  const list = transitions && transitions.length > 0
    ? transitions
    : computeLiveTransitions(new Date(now.getTime() - 4 * 86400000), new Date(now.getTime() + 35 * 86400000));

  if (!list || list.length === 0) return null;

  const nowMs = now.getTime();
  const entries: { start: Date; end: Date }[] = [];

  for (let i = 0; i < list.length; i++) {
    if (list[i].to_sign.toLowerCase() === targetSign) {
      const start = new Date(list[i].transition_at);
      let end: Date;
      if (i + 1 < list.length) {
        end = new Date(list[i + 1].transition_at);
      } else {
        end = new Date(start.getTime() + 54 * 3600000);
      }
      entries.push({ start, end });
    }
  }

  if (entries.length === 0) return null;

  // 1. Current active transit
  const active = entries.find((e) => e.start.getTime() <= nowMs && e.end.getTime() > nowMs);
  if (active) {
    return formatTransitWindow(active.start, active.end);
  }

  // 2. Earliest upcoming transit
  const upcoming = entries.find((e) => e.start.getTime() > nowMs);
  if (upcoming) {
    return formatTransitWindow(upcoming.start, upcoming.end);
  }

  // 3. Fallback to latest available entry
  const latest = entries[entries.length - 1];
  return formatTransitWindow(latest.start, latest.end);
}

