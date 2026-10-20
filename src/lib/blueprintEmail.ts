import { supabase } from "@/integrations/supabase/client";

/**
 * Asks for the member's own Blueprint email once their Moon sign is settled. The confirmation trigger already
 * tried when they confirmed; a Moon-change birthday had no sign yet, so it waited. Sent at most once per member
 * (the function claims it atomically), so calling this when it was already sent is harmless.
 */
export async function requestBlueprintEmail(): Promise<void> {
  try {
    await supabase.functions.invoke("send-blueprint-email", { body: { type: "EMAIL_CONFIRMED" } });
  } catch {
    /* best effort: the member's Blueprint works without it */
  }
}
