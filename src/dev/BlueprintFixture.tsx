// DEV ONLY. Renders the real Blueprint page for a mocked member, so layout and behaviour can be checked
// without an account:  /dev/blueprint?member=free|luminary&tab=today|blueprint&visited=1&name=Maya
//
// It is only reachable when import.meta.env.DEV is true (App.tsx lazy-imports it behind that check), so it is
// removed from production builds. It patches the shared Supabase client in place; nothing is sent anywhere.

import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Blueprint from "@/pages/Blueprint";

const combination = {
  id: "fixture",
  sun_sign: "Scorpio",
  moon_sign: "Cancer",
  combination_title: "Scorpio Sun • Cancer Moon — The Tidal Alchemist",
  luminous_expression: [
    "You read a room before anyone speaks and turn what you notice into quiet, steady care for the people around you, which they feel long before they can name it, and which makes you the one they call first.",
    "Fiercely loyal, you hold on to what matters and let go of what does not, trusting your instincts when the evidence is still arriving and the moment asks for courage rather than certainty or permission.",
  ],
  combination_synthesis:
    "Your Scorpio Sun and Cancer Moon both run deep. The Sun wants truth and transformation; the Moon wants safety and belonging. Together they make a person who protects fiercely and feels everything. Learning to let people see the softness under the guard is the long work of this pairing. When it lands, the loyalty becomes warmth instead of vigilance.",
  solar_essence:
    "Your Sun drives you toward depth, intensity and transformation in everything you touch, and you rarely settle for the surface of a person, a plan or a feeling.",
  lunar_essence:
    "Your Moon needs safety, memory and home, and it softens only when it is sure you will stay. Familiar rituals and trusted people settle you faster than any advice.",
  shadow_synthesis: "Guardedness can read as distance.",
  default_behaviors: [],
};

const triad = {
  physical_guidance:
    "The electric, cerebral frequency of the transiting Moon may cause a subtle static in your usually fluid nervous system, often felt as tension behind the eyes or shallow breathing in the upper chest. Your deep Water body, accustomed to tides and visceral grounding, may want warmth and slower breath today.",
  emotional_guidance:
    "Feelings may arrive as thoughts today. Name them out loud, or write them down, before deciding what they mean.",
  spiritual_guidance:
    "Notice the difference between a passing mood and a quiet knowing. The second one stays when the room goes silent.",
  daily_ritual: "Hold something warm for three minutes, breathe slowly, and say what you need in one sentence.",
  shadow_activation: "Over-explaining a feeling so that no one can get close to it.",
  integration_invitation: "Let one person see the unpolished version of how you feel.",
};

function patchSupabase(member: "free" | "luminary", visited: boolean, name: string | null, ageDays: number) {
  const luminary = member === "luminary";
  const user = {
    id: "dev-fixture",
    email: "fixture@example.com",
    created_at: new Date(Date.now() - ageDays * 86400000).toISOString(),
    user_metadata: visited ? { blueprint_visited_at: "2026-01-01T00:00:00Z" } : ({} as Record<string, unknown>),
  };
  const session = { access_token: "fixture", refresh_token: "fixture", expires_at: Math.floor(Date.now() / 1000) + 3600, user };
  const profile = {
    first_name: name,
    moon_sign: "Cancer",
    natal_moon_sign: "Cancer",
    natal_sun_sign: "Scorpio",
    birthday: "1985-11-03",
    timezone: "America/New_York",
    subscription_status: luminary ? "sovereign" : "free",
    is_subscriber: luminary,
  };
  const rows: Record<string, unknown> = { user_profiles: profile, combination_profiles: combination, triad_states: triad };

  const client = supabase as unknown as Record<string, any>;
  client.auth.getSession = async () => ({ data: { session }, error: null });
  client.auth.getUser = async () => ({ data: { user }, error: null });
  client.auth.refreshSession = async () => ({ data: { session }, error: null });
  client.auth.onAuthStateChange = () => ({ data: { subscription: { unsubscribe() {} } } });
  client.auth.updateUser = async ({ data }: { data?: Record<string, unknown> }) => {
    Object.assign(user.user_metadata, data ?? {});
    return { data: { user }, error: null };
  };
  client.functions.invoke = async (fn: string) => ({ data: fn === "check-subscription" ? { subscribed: luminary } : null, error: null });
  client.rpc = async () => ({ data: false, error: null });
  client.from = (table: string) => {
    const chain: Record<string, any> = {};
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.order = () => chain;
    chain.limit = () => chain;
    chain.update = (payload: Record<string, unknown>) => {
      if (table === "user_profiles") Object.assign(profile, payload);
      return chain;
    };
    chain.upsert = () => chain;
    chain.maybeSingle = async () => ({ data: rows[table] ?? null, error: null });
    chain.single = chain.maybeSingle;
    chain.then = (resolve: (v: unknown) => void) => resolve({ data: null, error: null });
    return chain;
  };

  try {
    localStorage.setItem("moonday.devTierOverride", luminary ? "sovereign" : "free");
    localStorage.setItem("moonday.onboarding.dismissed", "1");
  } catch {
    /* ignore */
  }
}

export default function BlueprintFixture() {
  const [params] = useSearchParams();
  const member = params.get("member") === "luminary" ? "luminary" : "free";
  const visited = params.get("visited") === "1";
  const name = params.get("name");
  const ageDays = Number(params.get("age") ?? "2");

  useMemo(() => patchSupabase(member, visited, name, ageDays), [member, visited, name, ageDays]);

  return (
    <AuthProvider>
      <Blueprint />
    </AuthProvider>
  );
}
