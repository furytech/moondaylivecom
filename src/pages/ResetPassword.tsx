import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MoonLoader from "@/components/MoonLoader";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

const getStrengthInfo = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Too short", color: "bg-destructive", width: "w-1/5" },
    { label: "Weak", color: "bg-orange-500", width: "w-2/5" },
    { label: "Fair", color: "bg-yellow-500", width: "w-3/5" },
    { label: "Strong", color: "bg-emerald-400", width: "w-4/5" },
    { label: "Very strong", color: "bg-emerald-500", width: "w-full" },
  ];
  return levels[Math.min(score, 4)];
};

const hasNumber = (pw: string) => /[0-9]/.test(pw);
const hasSymbol = (pw: string) => /[^A-Za-z0-9]/.test(pw);

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const [verifyingTurnstile, setVerifyingTurnstile] = useState(false);

  // Listen for PASSWORD_RECOVERY event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setRecoveryReady(true);
          setChecking(false);
        }
      }
    );

    // Check if we already have a session from the recovery link
    supabase.auth.getSession().then(({ data: { session } }) => {
      const hash = window.location.hash;
      if (hash.includes("type=recovery")) {
        // The onAuthStateChange will fire PASSWORD_RECOVERY
        return;
      }
      // No recovery context — deny access
      setChecking(false);
    });

    // Timeout safety
    const timeout = setTimeout(() => setChecking(false), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Load Turnstile widget
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || turnstileLoaded) return;

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
    script.async = true;

    (window as any).onTurnstileLoad = () => {
      setTurnstileLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      delete (window as any).onTurnstileLoad;
    };
  }, []);

  // Render Turnstile once loaded
  const turnstileRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !turnstileLoaded || !TURNSTILE_SITE_KEY) return;
      if (node.childElementCount > 0) return;

      (window as any).turnstile.render(node, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "dark",
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(null),
      });
    },
    [turnstileLoaded]
  );

  const strength = getStrengthInfo(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const turnstileRequired = !!TURNSTILE_SITE_KEY;
  const meetsRequirements =
    password.length >= 8 && hasNumber(password) && hasSymbol(password);
  const canSubmit =
    meetsRequirements &&
    passwordsMatch &&
    !loading &&
    (!turnstileRequired || !!turnstileToken);

  const verifyTurnstile = async (token: string): Promise<boolean> => {
    setVerifyingTurnstile(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-turnstile", {
        body: { token },
      });
      if (error) {
        console.error("Turnstile verification error:", error);
        return false;
      }
      return data?.success === true;
    } catch (err) {
      console.error("Turnstile verification failed:", err);
      return false;
    } finally {
      setVerifyingTurnstile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      // Verify Turnstile token server-side if required
      if (turnstileRequired && turnstileToken) {
        const verified = await verifyTurnstile(turnstileToken);
        if (!verified) {
          toast({
            title: "Verification Failed",
            description: "Humanity check failed. Please try again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Sign out so user must re-authenticate with new password
      await supabase.auth.signOut();

      toast({
        title: "Password Secured ✓",
        description: "Your new credentials are active. Please sign in.",
      });

      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({
        title: "Update Failed",
        description: error.message || "Could not update password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MoonLoader size="lg" />
      </div>
    );
  }

  // No recovery session — link expired or already used
  if (!recoveryReady) {
    const ATTEMPT_KEY = "moonday_reset_attempts";
    const attempts = parseInt(localStorage.getItem(ATTEMPT_KEY) || "0", 10);
    const exhausted = attempts >= 5;

    const handleRequestNew = () => {
      localStorage.setItem(ATTEMPT_KEY, String(attempts + 1));
      navigate("/auth/forgot-password");
    };

    return (
      <div className="min-h-screen bg-background flex flex-col relative">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gold-pale rounded-full animate-twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.5 + 0.3,
              }}
            />
          ))}
        </div>
        <Navigation />
        <main className="flex-1 flex flex-col items-center justify-start pt-[68px] pb-6 px-6 relative z-10">
          <GlassmorphismCard className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-primary/30 flex items-center justify-center">
              <span className="text-3xl">✦</span>
            </div>
            {!exhausted ? (
              <>
                <h1 className="font-display text-2xl text-gold-gradient tracking-[0.06em] mb-4">
                  Request a New Link
                </h1>
                <p className="font-serif text-base text-cream-muted/70 mb-8">
                  This recovery link has expired or already been used. Request a fresh one to continue.
                </p>
                <Button
                  onClick={handleRequestNew}
                  className="w-full h-14 font-display text-sm tracking-[0.15em] uppercase border border-primary/40 bg-transparent hover:bg-primary/10 text-primary rounded-xl transition-all duration-500"
                >
                  Request a New Link
                </Button>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl text-gold-gradient tracking-[0.06em] mb-4">
                  Contact Support
                </h1>
                <p className="font-serif text-base text-cream-muted/70 mb-8">
                  We're unable to reset your password automatically. Please email{" "}
                  <a
                    href="mailto:support@moondaylive.com"
                    className="text-primary hover:underline"
                  >
                    support@moondaylive.com
                  </a>{" "}
                  and our team will restore your access.
                </p>
                <Button
                  onClick={() => (window.location.href = "mailto:support@moondaylive.com")}
                  className="w-full h-14 font-display text-sm tracking-[0.15em] uppercase border border-primary/40 bg-transparent hover:bg-primary/10 text-primary rounded-xl transition-all duration-500"
                >
                  Email Support
                </Button>
              </>
            )}
          </GlassmorphismCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <SEO
        title="Set New Password — Moonday Live"
        description="Choose a strong new password to protect your Moonday Live account."
        noindex
      />
      {/* Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold-pale rounded-full animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      <Navigation />

      <main className="flex-1 flex flex-col items-center pt-[68px] pb-6 px-6 relative z-20">
        <GlassmorphismCard className="max-w-md w-full animate-fade-up stagger-1">
          {/* Header */}
          <div className="text-center mb-6">
            <p className="font-serif text-sm text-primary/90 uppercase tracking-[0.2em] mb-2">
              Secure Recovery
            </p>
            <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-[0.06em] mb-2">
              Set New Credentials
            </h1>
            <p className="font-serif text-lg text-cream-muted/70">
              Choose a strong password to protect your celestial data
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="New password (8+ chars, number & symbol)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-base rounded-xl"
              />
              {/* Strength Meter */}
              {password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${strength.color} ${strength.width}`}
                    />
                  </div>
                  <p className="font-serif text-xs text-cream-muted/60">{strength.label}</p>
                  {/* Requirements checklist */}
                  <div className="space-y-0.5 font-serif text-xs">
                    <p className={password.length >= 8 ? "text-emerald-400" : "text-cream-muted/40"}>
                      {password.length >= 8 ? "✓" : "○"} 8+ characters
                    </p>
                    <p className={hasNumber(password) ? "text-emerald-400" : "text-cream-muted/40"}>
                      {hasNumber(password) ? "✓" : "○"} Contains a number
                    </p>
                    <p className={hasSymbol(password) ? "text-emerald-400" : "text-cream-muted/40"}>
                      {hasSymbol(password) ? "✓" : "○"} Contains a symbol
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-base rounded-xl"
              />
              {passwordsMismatch && (
                <p className="font-serif text-xs text-destructive">Passwords do not match</p>
              )}
              {passwordsMatch && (
                <p className="font-serif text-xs text-emerald-400">Passwords match ✓</p>
              )}
            </div>

            {/* Turnstile widget */}
            {turnstileRequired && (
              <div className="flex justify-center py-2">
                <div ref={turnstileRef} />
              </div>
            )}

            <Button
              type="submit"
              disabled={!canSubmit || verifyingTurnstile}
              className="w-full h-14 font-display text-sm tracking-[0.15em] uppercase border border-primary/40 bg-transparent hover:bg-primary/10 text-primary rounded-xl transition-all duration-500 disabled:opacity-40"
            >
              {loading || verifyingTurnstile ? <MoonLoader size="sm" /> : "Update Password"}
            </Button>
          </form>
        </GlassmorphismCard>

        {/* Decorative */}
        <div className="mt-12 flex items-center gap-4">
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/30" />
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
