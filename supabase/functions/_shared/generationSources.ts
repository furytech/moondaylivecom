// Assembles the inputs the transit generator is allowed to reason from:
// deterministic chart condition, vetted doctrine, and the guest astrologer's
// own words. Anything not in here is off-limits to the model.

import { buildTraditionalContext, formatTraditionalBrief } from "./traditionalChart.ts";
import type { GenerationSources, GuestVoice } from "./transitContent.ts";

// deno-lint-ignore no-explicit-any
type Client = any;

export async function loadDoctrine(supabase: Client, limit = 60): Promise<string[]> {
  const { data } = await supabase
    .from("doctrine_entries")
    .select("category, subject, qualifier, meaning, vetted")
    .eq("tradition", "hellenistic")
    .order("vetted", { ascending: false })
    .limit(limit);

  return (data ?? []).map(
    (d: Record<string, string>) =>
      `${d.category} · ${d.subject}${d.qualifier ? ` (${d.qualifier})` : ""}: ${d.meaning}`,
  );
}

/**
 * The accepted guest contribution closest to this transit, if any. A guest
 * take is opt-in per transit: no accepted contribution means a normal edition.
 */
export async function loadGuestVoice(
  supabase: Client,
  transitAtIso: string,
): Promise<GuestVoice | null> {
  const windowStart = new Date(new Date(transitAtIso).getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const windowEnd = new Date(new Date(transitAtIso).getTime() + 3 * 24 * 3600 * 1000).toISOString();

  const { data } = await supabase
    .from("guest_contributions")
    .select("id, raw_text, transcript, transit_at, guest_astrologers ( display_name, bio, approved )")
    .eq("status", "accepted")
    .gte("transit_at", windowStart)
    .lte("transit_at", windowEnd)
    .order("transit_at", { ascending: true })
    .limit(1);

  const row = (data ?? [])[0];
  if (!row) return null;
  const guest = row.guest_astrologers;
  if (!guest?.approved) return null;

  const text = (row.transcript || row.raw_text || "").trim();
  if (!text) return null;

  return { displayName: guest.display_name, bio: guest.bio, text };
}

export async function buildGenerationSources(
  supabase: Client,
  transitAtIso: string,
): Promise<GenerationSources & { guestContributionId?: string | null }> {
  const ctx = buildTraditionalContext(new Date(transitAtIso));
  const [doctrine, guest] = await Promise.all([
    loadDoctrine(supabase).catch(() => []),
    loadGuestVoice(supabase, transitAtIso).catch(() => null),
  ]);

  return {
    traditionalBrief: formatTraditionalBrief(ctx),
    doctrine,
    guest,
  };
}
