import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { markAdvanced } from "@/lib/confirmLanding";

/** For the "Check your inbox" tab: when the email is confirmed in another tab of this browser, the shared
 *  auth session appears here as a sign-in, so move the member on to their Blueprint. */
export function useAdvanceOnConfirm(): void {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;
    const advance = () => {
      if (done) return;
      done = true;
      markAdvanced();
      navigate("/blueprint", { replace: true });
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) advance();
    });

    // A background tab can miss the event; look again when it comes back into view.
    const recheck = async () => {
      if (document.visibilityState === "hidden") return;
      const { data: s } = await supabase.auth.getSession();
      if (s.session?.user) advance();
    };
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("focus", recheck);

    return () => {
      data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("focus", recheck);
    };
  }, [navigate]);
}
