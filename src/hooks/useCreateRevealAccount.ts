import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateSunSign } from "@/lib/moonSign";
import { clearSignupDraft, saveSignupDraft } from "@/lib/signupDraft";
import { saveRevealState } from "@/lib/revealState";
import { forgetStartedSignup, hasStartedSignup, markSignupStarted } from "@/lib/startedSignups";
import { cacheTimezone } from "@/hooks/useUserTimezone";

/** A throwaway password nobody sees: the member chooses their own after confirming their email. */
export function generateOneTimePassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const body = btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "x");
  return `${body}Aa1!`;
}

export interface RevealAccountInput {
  email: string;
  birthday: string;
  timezone: string;
  /** Null on a Moon-change birthday: the account is created first, the quiz settles the sign afterwards. */
  moonSign: string | null;
}

/**
 * Creates the pending account that a reveal belongs to, then moves on:
 * - ordinary birthday: straight to the reveal
 * - Moon-change birthday: to the quiz (no sign is shown before there is an account behind it)
 * An email that already has an account goes to sign-in; an email that already started signing up only has
 * its confirmation link sent again, and nothing else is sent or changed.
 */
export function useCreateRevealAccount() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  return useCallback(
    async ({ email, birthday, timezone, moonSign }: RevealAccountInput) => {
      // A signup this browser already started: resend the link only. signUp is never called, so no
      // birthday (or anything else) can reach the account.
      if (hasStartedSignup(email)) {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        saveRevealState({ kind: "resent", email });
        navigate("/your-moon-sign");
        return "pending" as const;
      }

      const sunSign = calculateSunSign(birthday);
      const outcome = await signUp(
        email,
        generateOneTimePassword(),
        birthday,
        moonSign ?? undefined,
        timezone,
        sunSign,
        undefined,
        { passwordPending: true, deferMoonSign: moonSign === null }
      );
      const status = outcome?.status ?? "created";
      cacheTimezone(timezone);
      clearSignupDraft();

      if (status === "existing") {
        forgetStartedSignup(email);
        navigate(`/login?email=${encodeURIComponent(email)}&exists=1`, { replace: true });
        return status;
      }
      markSignupStarted(email);
      if (status === "pending") {
        saveRevealState({ kind: "resent", email });
        navigate("/your-moon-sign");
        return status;
      }
      if (moonSign === null) {
        saveSignupDraft({ birthday, timezone, email });
        navigate("/transition-quiz");
        return status;
      }
      saveRevealState({ kind: "reveal", email, birthday, sunSign, moonSign });
      navigate("/your-moon-sign");
      return status;
    },
    [signUp, navigate]
  );
}
