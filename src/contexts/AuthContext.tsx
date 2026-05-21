import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { trackEvent } from "@/lib/analytics";

interface SubscriptionStatus {
  subscribed: boolean;
  productId: string | null;
  priceId: string | null;
  subscriptionEnd: string | null;
  subscriptionStart: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, birthday?: string, moonSign?: string) => Promise<void>;
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
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
  });

  const checkSubscription = async () => {
    // Always fetch the latest session to avoid stale token issues
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData?.session;
    
    if (!currentSession?.access_token) {
      setSubscription({ subscribed: false, productId: null, subscriptionEnd: null });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) {
        // Silently handle auth errors (token might have just expired)
        if (error.message?.includes('expired') || error.message?.includes('JWT')) {
          console.log("Token expired during subscription check, will retry on next refresh");
          return;
        }
        console.error("Error checking subscription:", error);
        return;
      }

      setSubscription({
        subscribed: data?.subscribed || false,
        productId: data?.product_id || null,
        subscriptionEnd: data?.subscription_end || null,
      });
    } catch (err) {
      console.error("Failed to check subscription:", err);
    }
  };

  useEffect(() => {
    // Check for existing session FIRST to prevent flicker
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Then set up auth state listener for future changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Redirect to reset page on PASSWORD_RECOVERY event
        if (event === "PASSWORD_RECOVERY") {
          // Only redirect if not already on the reset page to avoid stripping the hash fragment
          if (!window.location.pathname.startsWith("/auth/reset-password")) {
            window.location.href = "/auth/reset-password" + window.location.hash;
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
      setSubscription({ subscribed: false, productId: null, subscriptionEnd: null });
    }
  }, [session]);

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const handleSignUp = async (email: string, password: string, birthday?: string, moonSign?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: birthday ? { birthday, moon_sign: moonSign } : undefined,
      },
    });
    if (error) throw error;

    // Persist birthday + moon sign immediately so it's saved even before email verification.
    // Upsert in case the handle_new_user trigger hasn't created the row yet.
    if (data.user && birthday) {
      await supabase
        .from("user_profiles")
        .upsert(
          { user_id: data.user.id, email, birthday, moon_sign: moonSign ?? null },
          { onConflict: "user_id" }
        );
    }

    trackEvent("sign_up", { method: "email" });
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSubscription({ subscribed: false, productId: null, subscriptionEnd: null });
  };

  const value = {
    user,
    session,
    loading,
    subscription,
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
