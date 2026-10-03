import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import MoonLoader from "@/components/MoonLoader";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Inspect URL parameters for error or expiration
    const hash = window.location.hash;
    const search = window.location.search;
    const hasError =
      hash.includes("error=") ||
      hash.includes("error_code=") ||
      search.includes("error=") ||
      search.includes("error_code=");

    if (hasError) {
      setIsExpired(true);
      setChecking(false);
      return;
    }

    // 2. Check if access_token is present in hash
    if (hash.includes("type=recovery")) {
      const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || "";

      if (accessToken) {
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          .then(({ error: sessionError }) => {
            if (sessionError) {
              setIsExpired(true);
            } else {
              setRecoveryReady(true);
              setIsExpired(false);
            }
            setChecking(false);
          })
          .catch(() => {
            setIsExpired(true);
            setChecking(false);
          });
        return;
      }
    }

    // 3. Check for PKCE code in query
    const searchParams = new URLSearchParams(search);
    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error: exchangeError }) => {
        if (exchangeError || !data?.session) {
          setIsExpired(true);
        } else {
          setRecoveryReady(true);
          setIsExpired(false);
        }
        setChecking(false);
      });
      return;
    }

    // 4. Listen for PASSWORD_RECOVERY event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && hash.includes("type=recovery"))) {
        setRecoveryReady(true);
        setIsExpired(false);
        setChecking(false);
      }
    });

    // 5. Check if session already exists
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        setIsExpired(true);
        setChecking(false);
        return;
      }
      if (session) {
        setRecoveryReady(true);
        setIsExpired(false);
        setChecking(false);
        return;
      }
      // If neither hash nor session is present, it's expired/invalid
      if (!hash.includes("type=recovery")) {
        setIsExpired(true);
        setChecking(false);
      }
    });

    const timeout = setTimeout(() => {
      setChecking((current) => {
        if (current) {
          setIsExpired(true);
          return false;
        }
        return false;
      });
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const isMinLength = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isMinLength) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess(true);
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "This link has expired. Request a new one.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Loading check
  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MoonLoader size="lg" />
      </div>
    );
  }

  // 2. Expired or Invalid link
  if (isExpired || !recoveryReady) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative">
        <SEO
          title="Reset Link Expired — Moonday Live"
          description="This password reset link has expired."
          noindex
        />
        <Navigation />
        <main className="flex-1 flex flex-col items-center justify-start pt-[68px] pb-6 px-6 relative z-10">
          <GlassmorphismCard className="max-w-md w-full text-center py-8">
            <div className="relative inline-block mb-6">
              <img
                src="/assets/MoondayLive-Logo.png"
                alt="Moonday Live Logo"
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border border-lilac/30 shadow-[0_0_50px_-10px_hsl(var(--lilac)/0.5)]"
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-gold-gradient tracking-[0.06em] mb-4">
              Request a New Link
            </h1>
            <p className="font-serif text-base md:text-lg text-cream-muted/90 mb-8 leading-relaxed">
              This link has expired.{" "}
              <Link
                to="/forgot-password"
                className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
              >
                Request a new one.
              </Link>
            </p>
            <Button
              onClick={() => navigate("/forgot-password")}
              className="w-full h-14 font-display text-sm tracking-[0.15em] uppercase border border-primary/40 bg-transparent hover:bg-primary/10 text-primary rounded-xl transition-all duration-500"
            >
              Request a New Link
            </Button>
          </GlassmorphismCard>
        </main>
      </div>
    );
  }

  // 3. Reset password form view
  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <SEO
        title="Reset Your Password — Moonday Live"
        description="Choose a strong new password to protect your Moonday Live account."
        noindex
      />
      <Navigation />
      <main className="flex-1 flex flex-col items-center pt-[68px] pb-6 px-6 relative z-20">
        <GlassmorphismCard className="max-w-md w-full animate-fade-up stagger-1">
          {success ? (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 mx-auto rounded-full border border-primary/30 flex items-center justify-center bg-primary/5">
                <span className="text-2xl text-primary">✓</span>
              </div>
              <p className="font-serif text-lg text-cream-muted leading-relaxed">
                Password updated — sign in with your new password.
              </p>
              <p className="font-serif text-xs text-muted-foreground/60">
                Redirecting to sign in...
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <p className="font-serif text-sm text-primary/90 uppercase tracking-[0.2em] mb-2">
                  Account Recovery
                </p>
                <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-[0.06em] mb-2">
                  Reset Your Password
                </h1>
                <p className="font-serif text-base text-cream-muted/70">
                  Enter your new password below (minimum 8 characters).
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="newPassword"
                    className="block font-serif text-xs uppercase tracking-widest text-primary/80 pl-1"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-base rounded-xl pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted/50 hover:text-cream-muted/80 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {password.length > 0 && !isMinLength && (
                    <p className="font-serif text-xs text-destructive pl-1">
                      Password must be at least 8 characters
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="block font-serif text-xs uppercase tracking-widest text-primary/80 pl-1"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-base rounded-xl pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted/50 hover:text-cream-muted/80 transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {passwordsMismatch && (
                    <p className="font-serif text-xs text-destructive pl-1">
                      Passwords must match
                    </p>
                  )}
                  {passwordsMatch && isMinLength && (
                    <p className="font-serif text-xs text-emerald-400 pl-1">
                      Passwords match ✓
                    </p>
                  )}
                </div>

                {error && (
                  <p className="font-serif text-xs text-destructive text-center py-1">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={!isMinLength || !passwordsMatch || loading}
                  className="w-full h-14 font-display text-sm tracking-[0.15em] uppercase border border-primary/40 bg-transparent hover:bg-primary/10 text-primary rounded-xl transition-all duration-500 disabled:opacity-40"
                >
                  {loading ? <MoonLoader size="sm" /> : "Set New Password"}
                </Button>
              </form>
            </>
          )}
        </GlassmorphismCard>
      </main>
    </div>
  );
};

export default ResetPassword;
