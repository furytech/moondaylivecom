import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDevTierOverride } from "@/lib/devTier";
import { isLuminaryMember, type MembershipProfile } from "@/lib/lensesPersonal";

/** Paid-member check for pages that only need a yes/no (e.g. Pulse).
 *  `ready` is false until the profile flags have been read for a signed-in user. */
export function useLuminaryStatus(): { isLuminary: boolean; ready: boolean } {
  const { user, subscription } = useAuth();
  const userId = user?.id;
  const [profile, setProfile] = useState<MembershipProfile | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoadedFor(null);
      return;
    }
    let cancelled = false;
    Promise.resolve(
      supabase
        .from("user_profiles")
        .select("is_subscriber, subscription_status")
        .eq("user_id", userId)
        .maybeSingle(),
    )
      .then(({ data }) => {
        if (!cancelled) setProfile(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoadedFor(userId);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return {
    isLuminary: isLuminaryMember(profile, subscription.subscribed, getDevTierOverride()),
    ready: !userId || loadedFor === userId,
  };
}
