// Whether this member has opened their Blueprint before, so the first visit can open My Blueprint and say
// "Welcome, <name>", and later ones open Today and say "Welcome back, <name>".
// Remembered on the account (user_metadata.blueprint_visited_at) so it holds across devices, and on this device
// as a fallback in case the account write is slow or fails.

import { supabase } from "@/integrations/supabase/client";

const key = (userId: string) => `moonday:blueprintVisited:${userId}`;

type Metadata = Record<string, unknown> | null | undefined;

export function hasVisitedBlueprint(userId: string, metadata?: Metadata): boolean {
  if (typeof metadata?.blueprint_visited_at === "string") return true;
  try {
    return localStorage.getItem(key(userId)) === "1";
  } catch {
    return false;
  }
}

export function markBlueprintVisited(userId: string, metadata?: Metadata): void {
  try {
    localStorage.setItem(key(userId), "1");
  } catch {
    /* storage unavailable: the account write below still records it */
  }
  if (typeof metadata?.blueprint_visited_at === "string") return;
  void Promise.resolve(supabase.auth.updateUser({ data: { blueprint_visited_at: new Date().toISOString() } })).catch(() => {
    /* best effort */
  });
}
