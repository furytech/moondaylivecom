import { supabase } from "@/integrations/supabase/client";
import type { MoonSignResult } from "./moonSign";

export interface UserSignup {
  email: string;
  birthDate: string;
  moonSign: MoonSignResult;
}

export async function saveUserSignup(
  email: string,
  birthDate: Date,
  moonSign: MoonSignResult
): Promise<void> {
  const { error } = await supabase
    .from("signups")
    .insert({
      email: email.trim().toLowerCase(),
      birth_date: birthDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      moon_sign: moonSign.sign,
      moon_element: moonSign.element,
      moon_symbol: moonSign.symbol,
    });

  if (error) {
    console.error("Error saving signup:", error);
    throw error;
  }
}
