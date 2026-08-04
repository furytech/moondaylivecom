import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UTC_ZONE, detectTimezoneOption, isValidTimezone } from "@/lib/timezone";

const LOCAL_KEY = "moonday.timezone";

/**
 * The timezone we should render moon times in.
 *
 * Signed-in members: the `timezone` saved on their profile.
 * Everyone else: their last saved choice, else browser detection.
 * Content is always *published* on UTC — this only affects display.
 */
export function useUserTimezone() {
  const [timezone, setTimezone] = useState<string>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_KEY);
      if (cached && isValidTimezone(cached)) return cached;
    } catch {
      /* ignore */
    }
    return detectTimezoneOption();
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (active) setLoading(false);
          return;
        }
        const { data } = await supabase
          .from("user_profiles")
          .select("timezone")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (active && data?.timezone && isValidTimezone(data.timezone)) {
          setTimezone(data.timezone);
          try {
            localStorage.setItem(LOCAL_KEY, data.timezone);
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* fall back to detected zone */
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return { timezone: timezone || UTC_ZONE, loading };
}

export function cacheTimezone(tz: string) {
  try {
    localStorage.setItem(LOCAL_KEY, tz);
  } catch {
    /* ignore */
  }
}
