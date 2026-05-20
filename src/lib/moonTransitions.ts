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
