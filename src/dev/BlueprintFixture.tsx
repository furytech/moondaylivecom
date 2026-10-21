// DEV ONLY. Renders the real Blueprint, Lenses or Daily Pulse page for a mocked member, so layout and behaviour can
// be checked without an account:
//   /dev/blueprint?member=free|luminary&tab=today|blueprint&visited=1&name=Maya
//   /dev/lenses?member=luminary        /dev/pulse?member=free
//
// It is only reachable when import.meta.env.DEV is true (App.tsx lazy-imports it behind that check), so it is
// removed from production builds. It patches the shared Supabase client in place; nothing is sent anywhere.

import { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Blueprint from "@/pages/Blueprint";
import Lenses from "@/pages/Triad";
import Pulse from "@/pages/Pulse";

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

// Realistic lengths (the stored rows run about 480 characters for the energy line, 300-460 for the rest) and,
// like the generator now requires, no body or health language.
const triad = {
  physical_guidance:
    "The quick, restless pace of this Aquarius Moon runs through your usually steady Water rhythm, so your energy may come in bursts rather than a flow. You may find focus easier in short, finished loops than in one long push. Let the day move at the speed of conversation, and save the deep work for the quiet hours when the noise settles.",
  emotional_guidance:
    "Your natal Cancer Moon feels things slowly and completely, while today's Air Moon wants to name them quickly. The gap between the two can read as distance, even when you care a great deal. Say the feeling out loud, even if it comes out imperfectly, and let someone you trust meet you in the middle instead of waiting to be asked.",
  spiritual_guidance:
    "Notice the difference between a passing mood and a quiet knowing. The mood shifts with every conversation; the knowing stays when the room goes silent. Today invites you to trust the second one, and to let the first one pass without making a decision from it. What you keep returning to is usually the honest answer.",
  daily_ritual:
    "Write three honest lines before noon: what you feel, what you need, and one small thing you can offer someone else. Read them once, then put the page away. The point is not to solve the day but to give your feelings a place to land before the conversations begin, so you can meet them with more patience.",
  shadow_activation:
    "Over-explaining a feeling until no one can get close to it. When the day speeds up, you may talk around what is tender instead of saying it plainly, and then wonder why you were not understood.",
  integration_invitation:
    "Let one person see the unpolished version of how you feel today. A short, plain sentence is enough. Notice that being understood does not require being perfectly articulate.",
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

  const { pathname } = useLocation();
  const Page = pathname.endsWith("/lenses") ? Lenses : pathname.endsWith("/pulse") ? Pulse : Blueprint;

  return (
    <AuthProvider>
      <Page />
    </AuthProvider>
  );
}
