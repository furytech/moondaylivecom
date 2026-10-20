import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { calculateSunSign } from "@/lib/moonSign";
import { clearSignupDraft } from "@/lib/signupDraft";
import { saveRevealState } from "@/lib/revealState";
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
  moonSign: string;
}

/**
 * Creates the account that a reveal belongs to, then shows the reveal.
 * An email that already has an account goes to sign-in instead; no reveal is shown for it.
 */
export function useCreateRevealAccount() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  return useCallback(
    async ({ email, birthday, timezone, moonSign }: RevealAccountInput) => {
      const sunSign = calculateSunSign(birthday);
      const outcome = await signUp(
        email,
        generateOneTimePassword(),
        birthday,
        moonSign,
        timezone,
        sunSign,
        undefined,
        { passwordPending: true }
      );
      const status = outcome?.status ?? "created";
      cacheTimezone(timezone);
      clearSignupDraft();
      if (status === "existing") {
        navigate(`/login?email=${encodeURIComponent(email)}&exists=1`, { replace: true });
        return status;
      }
      saveRevealState({ kind: status === "pending" ? "resent" : "reveal", email, birthday, sunSign, moonSign });
      navigate("/your-moon-sign");
      return status;
    },
    [signUp, navigate]
  );
}
