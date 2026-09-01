import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const clearClientSession = () => {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-") || k.startsWith("supabase."))
      .forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch {
    /* storage may be unavailable */
  }
};

const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/**
 * Global inactivity guard: warns at 13 minutes idle, signs out at 15.
 * Mounted once inside the router so it covers every authenticated route.
 */
const IdleSessionGuard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const endSession = useCallback(
    async (reason: "inactivity" | "manual") => {
      try {
        await signOut();
      } catch {
        await supabase.auth.signOut().catch(() => undefined);
      }
      clearClientSession();
      navigate(reason === "inactivity" ? "/login?reason=inactivity" : "/login", { replace: true });
    },
    [navigate, signOut]
  );

  const { warning, secondsLeft, stayLoggedIn } = useIdleLogout(!!user, () => {
    void endSession("inactivity");
  });

  if (!user || !warning) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-md px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-card/90 p-8 text-center shadow-2xl">
        <h2 id="idle-title" className="text-xl font-semibold text-foreground">
          Still there?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You've been idle for a while. To keep your account secure, you will be automatically
          logged out in 2 minutes.
        </p>
        <p className="mt-5 font-mono text-3xl tabular-nums text-primary" aria-live="polite">
          {formatCountdown(secondsLeft)}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={stayLoggedIn} className="sm:min-w-40">
            Stay Logged In
          </Button>
          <Button variant="ghost" onClick={() => void endSession("manual")} className="sm:min-w-40">
            Log Out Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IdleSessionGuard;
