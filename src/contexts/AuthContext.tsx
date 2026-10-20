import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { trackEvent } from "@/lib/analytics";
import { getDevTierOverride, subscribeDevTier } from "@/lib/devTier";
import { calculateSunSign, calculateMoonSignAsync } from "@/lib/moonSign";

interface SubscriptionStatus {
  subscribed: boolean;
  productId: string | null;
  priceId: string | null;
  subscriptionEnd: string | null;
  subscriptionStart: string | null;
}

/**
 * What a signUp call did:
 * - created: a new account; its confirmation email is on the way
 * - existing: the email already has an account (sign in instead)
 * - pending: the email was signed up before and never confirmed; the link was sent again
 */
export interface SignUpOutcome {
  status: "created" | "existing" | "pending";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    birthday?: string,
    moonSign?: string,
    timezone?: string,
    natalSunSign?: string,
    firstName?: string,
    options?: { passwordPending?: boolean }
  ) => Promise<SignUpOutcome>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
  /** Build-time rendering has no session to wait for; the page renders as a signed-out visitor sees it. */
  initialLoading?: boolean;
}

export const AuthProvider = ({ children, initialLoading = true }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(initialLoading);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    productId: null,
    priceId: null,
    subscriptionEnd: null,
    subscriptionStart: null,
  });

  const checkSubscription = async (attempt = 0): Promise<void> => {
    // Always fetch the latest session to avoid stale token issues
    const { data: sessionData } = await supabase.auth.getSession();
    let currentSession = sessionData?.session;

    // The cached session can hold an already-expired access token (auto-refresh
    // may not have fired yet). Sending it would earn a 401, so refresh first.
    const expiresAt = currentSession?.expires_at ?? 0;
    if (currentSession && expiresAt * 1000 - Date.now() < 30_000) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      currentSession = refreshed?.session ?? currentSession;
    }

    if (!currentSession?.access_token) {
      setSubscription({ subscribed: false, productId: null, priceId: null, subscriptionEnd: null, subscriptionStart: null });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) {
        const status = (error as { context?: { status?: number } })?.context?.status;
        const isAuthError =
          status === 401 ||
          error.message?.includes("expired") ||
          error.message?.includes("JWT");

        if (isAuthError) {
          // Do NOT downgrade the user. Try to refresh once; if that fails, the
          // session is truly dead — sign out so they are prompted to log in again.
          if (attempt === 0) {
            const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError && refreshed?.session?.access_token) {
              return checkSubscription(1);
            }
          }
          console.warn("Session invalid during subscription check — signing out");
          await supabase.auth.signOut();
          return;
        }
        console.error("Error checking subscription:", error);
        return;
      }

      setSubscription({
        subscribed: data?.subscribed || false,
        productId: data?.product_id || null,
        priceId: data?.price_id || null,
        subscriptionEnd: data?.subscription_end || null,
        subscriptionStart: data?.subscription_start || null,
      });
    } catch (err) {
      console.error("Failed to check subscription:", err);
    }
  };

  useEffect(() => {
    // Check for existing session FIRST to prevent flicker
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Validate the stored session against the auth server — a token that was
      // revoked while the tab was closed must not look "logged in".
      if (session) {
        const { error } = await supabase.auth.getUser();
        if (error) {
          await supabase.auth.signOut().catch(() => undefined);
          setSession(null);
          setUser(null);
        }
      }
    });

    // Then set up auth state listener for future changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // A fresh sign-in means the user is active now — drop any stale idle
        // timestamp left over from a previous session so the idle guard
        // doesn't bounce them straight back to login.
        if (event === "SIGNED_IN") {
          try {
            localStorage.setItem("moonday:lastActivityAt", String(Date.now()));
          } catch {
            /* storage unavailable */
          }
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Redirect to reset page on PASSWORD_RECOVERY event
        if (event === "PASSWORD_RECOVERY") {
          // Only redirect if not already on the reset page to avoid stripping the hash fragment
          if (
            !window.location.pathname.startsWith("/auth/reset-password") &&
            !window.location.pathname.startsWith("/reset-password")
          ) {
            window.location.href = "/reset-password" + window.location.hash;
          }
        }
      }
    );

    return () => authSubscription.unsubscribe();
  }, []);

  // Check subscription when session changes
  useEffect(() => {
    if (session) {
      checkSubscription();
      
      // Set up periodic check every 60 seconds
      const interval = setInterval(checkSubscription, 60000);
      return () => clearInterval(interval);
    } else {
      setSubscription({ subscribed: false, productId: null, priceId: null, subscriptionEnd: null, subscriptionStart: null });
    }
  }, [session]);

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    try {
      localStorage.setItem("moonday:lastActivityAt", String(Date.now()));
    } catch {
      /* storage unavailable */
    }
  };

  const handleSignUp = async (
    email: string,
    password: string,
    birthday?: string,
    moonSign?: string,
    timezone?: string,
    natalSunSign?: string,
    firstName?: string,
    options?: { passwordPending?: boolean }
  ): Promise<SignUpOutcome> => {
    let resolvedSunSign = natalSunSign;
    let resolvedMoonSign = moonSign;

    if (birthday && (!resolvedSunSign || !resolvedMoonSign)) {
      try {
        const bd = new Date(`${birthday.split("T")[0]}T12:00:00`);
        if (!resolvedSunSign) {
          resolvedSunSign = calculateSunSign(bd);
        }
        if (!resolvedMoonSign) {
          resolvedMoonSign = (await calculateMoonSignAsync(bd)).sign;
        }
      } catch (err) {
        console.warn("Could not calculate natal signs during signup:", err);
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: firstName || undefined,
          birthday: birthday || undefined,
          moon_sign: resolvedMoonSign ?? null,
          natal_moon_sign: resolvedMoonSign ?? null,
          natal_sun_sign: resolvedSunSign ?? null,
          timezone: timezone ?? "UTC",
          // Accounts created from the birthday + email step get a random password; the member chooses theirs after confirming.
          password_pending: options?.passwordPending ? true : undefined,
        },
      },
    });
    if (error) throw error;

    // With email confirmation on, signing up an address that already has an account returns a
    // placeholder user with no identities instead of an error.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { status: "existing" };
    }
    // A confirmation resent to an old, unconfirmed signup: created_at is old, the resend is now (both server clock).
    const created = Date.parse(data.user?.created_at ?? "");
    const sent = Date.parse(data.user?.confirmation_sent_at ?? "");
    if (!Number.isNaN(created) && !Number.isNaN(sent) && sent - created > 30_000) {
      return { status: "pending" };
    }

    // Persist first name + birthday + natal signs immediately so it's saved even before email verification.
    // Upsert in case the handle_new_user trigger hasn't created the row yet.
    if (data.user) {
      await supabase
        .from("user_profiles")
        .upsert(
          {
            user_id: data.user.id,
            email,
            first_name: firstName || null,
            birthday: birthday || null,
            moon_sign: resolvedMoonSign ?? null,
            natal_moon_sign: resolvedMoonSign ?? null,
            natal_sun_sign: resolvedSunSign ?? null,
            timezone: timezone ?? "UTC",
          },
          { onConflict: "user_id" }
        );
    }

    // The Blueprint email is sent server-side after the user confirms their email
    // (DB trigger on auth.users -> send-blueprint-email).
    trackEvent("sign_up", { method: "email" });
    return { status: "created" };
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("moonday:lastActivityAt");
    } catch {
      /* storage unavailable */
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSubscription({ subscribed: false, productId: null, priceId: null, subscriptionEnd: null, subscriptionStart: null });
  };

  // Dev-only tier override (no-op in production — tree-shaken).
  const [devTierTick, setDevTierTick] = useState(0);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    return subscribeDevTier(() => setDevTierTick((t) => t + 1));
  }, []);

  const effectiveSubscription = (() => {
    if (!import.meta.env.DEV) return subscription;
    const override = getDevTierOverride();
    if (override === "free") return { ...subscription, subscribed: false };
    if (override === "sovereign") return { ...subscription, subscribed: true };
    return subscription;
  })();
  // Reference tick so React re-renders consumers when the override toggles.
  void devTierTick;

  const value = {
    user,
    session,
    loading,
    subscription: effectiveSubscription,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    checkSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
