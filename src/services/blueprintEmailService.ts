import { supabase } from "@/integrations/supabase/client";

export interface TriggerBlueprintEmailParams {
  email: string;
  firstName?: string | null;
  sunSign: string;
  moonSign: string;
}

/**
 * Queries combination_profiles for natal Sun & Moon signs, then triggers
 * the send-blueprint-email edge function using the Resend setup.
 */
export async function triggerBlueprintEmail({
  email,
  firstName,
  sunSign,
  moonSign,
}: TriggerBlueprintEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!email || !sunSign || !moonSign) {
    return { success: false, error: "Missing required email, sunSign, or moonSign" };
  }

  try {
    // 1. Query combination_profiles table using natal_sun_sign and natal_moon_sign
    const { data: blueprintData, error: profileError } = await supabase
      .from("combination_profiles")
      .select("combination_title, combination_synthesis, solar_essence, lunar_essence, default_behaviors")
      .eq("sun_sign", sunSign)
      .eq("moon_sign", moonSign)
      .maybeSingle();

    if (profileError) {
      console.warn("[blueprintEmailService] Warning querying combination_profiles:", profileError.message);
    }

    // 2. Trigger send-blueprint-email edge function
    const { data, error } = await supabase.functions.invoke("send-blueprint-email", {
      body: {
        email,
        firstName: firstName?.trim() || "Cosmic Traveler",
        sunSign,
        moonSign,
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
