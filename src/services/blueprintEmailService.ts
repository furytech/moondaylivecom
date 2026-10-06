import { supabase } from "@/integrations/supabase/client";

export interface TriggerBlueprintEmailParams {
  email: string;
  userId?: string | null;
  firstName?: string | null;
  sunSign?: string | null;
  moonSign?: string | null;
}

export interface ConfirmedNatalSigns {
  sunSign: string | null;
  moonSign: string | null;
  firstName?: string | null;
}

/**
 * Polls user_profiles until natal_sun_sign and natal_moon_sign are confirmed in the database,
 * falling back to provided natal signs if polling exhausts all retry attempts.
 */
export async function waitForConfirmedNatalSigns({
  userId,
  email,
  fallbackSunSign,
  fallbackMoonSign,
  maxAttempts = 5,
  initialDelayMs = 250,
}: {
  userId?: string | null;
  email: string;
  fallbackSunSign?: string | null;
  fallbackMoonSign?: string | null;
  maxAttempts?: number;
  initialDelayMs?: number;
}): Promise<ConfirmedNatalSigns> {
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let query = supabase
        .from("user_profiles")
        .select("user_id, email, natal_sun_sign, natal_moon_sign, moon_sign, first_name");

      if (userId) {
        query = query.eq("user_id", userId);
      } else {
        query = query.eq("email", email);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        const foundSun = data.natal_sun_sign;
        const foundMoon = data.natal_moon_sign || data.moon_sign;

        if (foundSun && foundMoon) {
          return {
            sunSign: foundSun,
            moonSign: foundMoon,
            firstName: data.first_name,
          };
        }
      }
    } catch (err) {
      console.warn(`[blueprintEmailService] Profile check attempt ${attempt} warning:`, err);
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, 1000);
    }
  }

  return {
    sunSign: fallbackSunSign ?? null,
    moonSign: fallbackMoonSign ?? null,
  };
}

/**
 * Waits until natal signs are confirmed in user_profiles, then queries
 * combination_profiles for the natal Sun & Moon signs and triggers
 * the send-blueprint-email edge function.
 */
export async function triggerBlueprintEmail({
  email,
  userId,
  firstName,
  sunSign,
  moonSign,
}: TriggerBlueprintEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!email) {
    return { success: false, error: "Missing required email" };
  }

  try {
    // 1. Wait until natal signs are confirmed in user_profiles
    const confirmed = await waitForConfirmedNatalSigns({
      userId,
      email,
      fallbackSunSign: sunSign,
      fallbackMoonSign: moonSign,
    });

    const resolvedSunSign = confirmed.sunSign || sunSign;
    const resolvedMoonSign = confirmed.moonSign || moonSign;
    const resolvedFirstName = confirmed.firstName || firstName || "Cosmic Traveler";

    if (!resolvedSunSign || !resolvedMoonSign) {
      console.warn("[blueprintEmailService] Cannot send blueprint email: natal signs missing for", email);
      return { success: false, error: "Natal signs could not be resolved" };
    }

    // 2. Query combination_profiles table using natal_sun_sign and natal_moon_sign
    const { data: blueprintData, error: profileError } = await supabase
      .from("combination_profiles")
      .select("combination_title, combination_synthesis, solar_essence, lunar_essence, default_behaviors")
      .eq("sun_sign", resolvedSunSign)
      .eq("moon_sign", resolvedMoonSign)
      .maybeSingle();

    if (profileError) {
      console.warn("[blueprintEmailService] Warning querying combination_profiles:", profileError.message);
    }

    // 3. Trigger send-blueprint-email edge function
    const { data, error } = await supabase.functions.invoke("send-blueprint-email", {
      body: {
        email,
        userId: userId ?? null,
        firstName: resolvedFirstName.trim(),
        sunSign: resolvedSunSign,
        moonSign: resolvedMoonSign,
        blueprint: blueprintData ?? null,
      },
    });

    if (error) {
      console.warn("[blueprintEmailService] Edge function invoke returned error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = (err as Error)?.message || "Unknown error triggering blueprint email";
    console.warn("[blueprintEmailService] Failed to trigger email:", message);
    return { success: false, error: message };
  }
}
