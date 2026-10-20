import { useState, useEffect, useMemo } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import MoonLoader from "@/components/MoonLoader";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { calculateSunSign } from "@/lib/moonSign";
import { formatBirthdayLong } from "@/lib/cuspDay";
import SEO from "@/components/SEO";
import { seoProps } from "@/lib/seo";
import { cacheTimezone } from "@/hooks/useUserTimezone";
import { REVEAL_PATH, clearSignupDraft, loadSignupDraft, type SignupDraft } from "@/lib/signupDraft";

interface PortalProps {
  defaultMode?: "login" | "signup";
}

const inputClass =
  "w-full h-12 px-4 rounded-xl bg-background/40 border border-lilac/20 text-foreground placeholder:text-muted-foreground/80 focus:border-lilac/60 focus:outline-none focus:ring-2 focus:ring-lilac/20 transition-all duration-300";

const Portal = ({ defaultMode = "login" }: PortalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, loading: authLoading } = useAuth();

  // Where to send the user after successful auth (defaults to /blueprint)
  const fromParam = searchParams.get("from");
  const redirectTo = fromParam && fromParam.startsWith("/") ? fromParam : "/blueprint";

  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [email, setEmail] = useState(() => searchParams.get("email") ?? loadSignupDraft()?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  // Kept after the draft is cleared so the confirmation screen can say what was saved.
  const [submittedDraft, setSubmittedDraft] = useState<SignupDraft | null>(null);
  const [mfaChallenge, setMfaChallenge] = useState<{ factorId: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaSubmitting, setMfaSubmitting] = useState(false);

  // The birthday and Moon sign come from the reveal step (or the Moon Cusp Quiz), never typed twice.
  const draft = submittedDraft ?? loadSignupDraft();
  const draftSunSign = useMemo(() => (draft ? calculateSunSign(draft.birthday) : null), [draft?.birthday]);

  // Sync mode if route prop changes (e.g. /signup -> /login)
  useEffect(() => {
    setIsLogin(defaultMode === "login");
  }, [defaultMode]);

  // Inactivity logout notice
  useEffect(() => {
    if (searchParams.get("reason") === "inactivity") {
      toast({
        title: "Signed out",
        description: "You have been logged out due to 15 minutes of inactivity.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // If arriving with password recovery parameters, reroute immediately to /reset-password
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      navigate(`/reset-password${window.location.hash}`, { replace: true });
      return;
    }

    if (user && !authLoading) {
      // Apply any pending Moon sign captured from the Moon-change quiz
      // before the user verified their email.
      (async () => {
        try {
          const raw = localStorage.getItem("pendingMoonSign");
          if (raw) {
            const pending = JSON.parse(raw) as { sign?: string; sunSign?: string; birthday?: string };
            if (pending?.sign) {
              const updatePayload: Record<string, any> = {
                moon_sign: pending.sign,
                natal_moon_sign: pending.sign,
              };
              if (pending.sunSign) {
                updatePayload.natal_sun_sign = pending.sunSign;
              } else if (pending.birthday) {
                updatePayload.natal_sun_sign = calculateSunSign(pending.birthday);
              }
              await supabase
                .from("user_profiles")
                .update(updatePayload)
                .eq("user_id", user.id);
            }
            localStorage.removeItem("pendingMoonSign");
          }
        } catch {
          /* ignore */
        }
        navigate(redirectTo, { replace: true });
      })();
    }
  }, [user, authLoading, navigate, redirectTo]);

  // Stable starfield (matches landing)
  const stars = useMemo(
    () =>
      [...Array(40)].map((_, i) => ({
        id: i,
        top: `${(i * 13 + 7) % 100}%`,
        left: `${(i * 29 + 11) % 100}%`,
        delay: `${(i * 0.11) % 4}s`,
        size: i % 7 === 0 ? 2 : 1,
        opacity: 0.25 + ((i * 0.09) % 0.5),
      })),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and a password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!isLogin && (!draft || !draft.moonSign)) {
      setError("Please start by entering your birthday.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        // Check if MFA challenge is required (AAL upgrade)
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal && aal.currentLevel !== aal.nextLevel && aal.nextLevel === "aal2") {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const totp = factors?.totp?.find((f) => f.status === "verified");
          if (totp) {
            setMfaChallenge({ factorId: totp.id });
            setLoading(false);
            return;
          }
        }
        navigate(redirectTo, { replace: true });
      } else if (draft?.moonSign) {
        await signUp(
          email,
          password,
          draft.birthday,
          draft.moonSign,
          draft.timezone,
          calculateSunSign(draft.birthday)
        );
        cacheTimezone(draft.timezone);
        setSubmittedDraft(draft);
        clearSignupDraft();
        setSignupSuccess(true);
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const rawMessage = error.message || "Unknown error";
      toast({
        title: isLogin ? "Login Failed" : "Signup Failed",
        description: rawMessage,
        variant: "destructive",
      });
      if (rawMessage.includes("User already registered")) {
        setError("This email is already registered. Please sign in.");
      } else if (rawMessage.includes("Invalid login credentials")) {
        setError("Invalid email or password. If you recently signed up, please verify your email first.");
      } else if (rawMessage.includes("Email not confirmed")) {
        setError("Please check your email to confirm your account before signing in.");
      } else {
        setError(rawMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const Starfield = () => (
    <>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-gold-pale animate-twinkle"
            style={{
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>
      <div
        className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--lilac) / 0.18) 0%, hsl(var(--lilac) / 0.06) 35%, transparent 70%)",
        }}
      />
    </>
  );

  // Signup needs the birthday and Moon sign from the reveal step. Anyone arriving without them
  // (a library link, the nav, an old bookmark) starts there; ?email= and ?from= travel along.
  if (!isLogin && !signupSuccess && !draft?.moonSign) {
    const search = searchParams.toString();
    return <Navigate to={`${REVEAL_PATH}${search ? `?${search}` : ""}`} replace />;
  }

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden flex flex-col">
        <Starfield />
        <main className="relative z-10 flex-1 flex items-start justify-center px-6 pt-[68px] pb-10">
          <div className="max-w-lg w-full text-center animate-fade-up">
            <div className="relative inline-block mb-8">
              <div
                className="w-24 h-24 md:w-28 md:h-28 rounded-full border border-lilac/30"
                style={{
                  background:
                    "radial-gradient(circle at 35% 30%, hsl(var(--cream) / 0.85), hsl(var(--lilac) / 0.4) 45%, hsl(var(--navy-dark)) 80%)",
                  boxShadow:
                    "0 0 60px -10px hsl(var(--lilac) / 0.6), inset -10px -15px 40px hsl(var(--navy-deep) / 0.8)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-9 h-9 text-cream/80" strokeWidth={1.2} />
              </div>
            </div>
            <p className="text-lilac text-xs tracking-[0.3em] uppercase mb-4">
              Check Your Inbox
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-6">
              Verify your email
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-2">
              A celestial confirmation link has been sent to
            </p>
            <p className="text-lilac font-medium mb-6 break-all">{email}</p>
            {submittedDraft && (
              <p className="text-base text-cream/85 leading-relaxed mb-6">
                Your birthday ({formatBirthdayLong(submittedDraft.birthday)}) is saved. Your{" "}
                {draftSunSign} Sun × {submittedDraft.moonSign} Moon Blueprint opens when you confirm.
              </p>
            )}
            <p className="text-sm text-muted-foreground/70 mb-10">
              Check your spam folder if it doesn't arrive within a few minutes.
            </p>
            <button
              onClick={() => {
                setSignupSuccess(false);
                setIsLogin(true);
                navigate("/login");
              }}
              className="min-h-11 px-4 text-sm tracking-[0.2em] uppercase text-foreground/70 hover:text-lilac transition-colors duration-300"
            >
              ← Back to sign in
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // MFA challenge view (after password, before navigation)
  if (mfaChallenge) {
    const submitMfa = async (e: React.FormEvent) => {
      e.preventDefault();
      if (mfaCode.length !== 6) return;
      setMfaError("");
      setMfaSubmitting(true);
      try {
        const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
          factorId: mfaChallenge.factorId,
        });
        if (chErr) throw chErr;
        const { error: vErr } = await supabase.auth.mfa.verify({
          factorId: mfaChallenge.factorId,
          challengeId: ch.id,
          code: mfaCode,
        });
        if (vErr) throw vErr;
        navigate(redirectTo, { replace: true });
      } catch (err: unknown) {
        setMfaError((err as Error).message || "Invalid code. Try again.");
      } finally {
        setMfaSubmitting(false);
      }
    };

    const useBackupCode = async () => {
      const code = prompt("Enter one of your backup recovery codes:");
      if (!code) return;
      setMfaSubmitting(true);
      try {
        const { error: rErr } = await supabase.functions.invoke("mfa-recover-with-code", {
          body: { code },
        });
        if (rErr) throw rErr;
        toast({
          title: "Recovery Successful",
          description:
            "Two-factor has been removed. Please re-enroll from Luminary Security.",
        });
        navigate(redirectTo, { replace: true });
      } catch (err: unknown) {
        setMfaError((err as Error).message || "Invalid recovery code.");
      } finally {
        setMfaSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden flex flex-col">
        <Starfield />
        <Navigation />
        <main className="relative z-10 flex-1 flex items-start justify-center px-6 pt-[68px] pb-16">
          <div className="max-w-md w-full">
            <div className="text-center mb-6 animate-fade-up">
              <p className="text-lilac text-xs tracking-[0.3em] uppercase mb-2">
                Luminary Security
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">
                Two-Factor Required
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Enter the 6-digit code from your authenticator app.
              </p>
            </div>
            <div className="p-8 md:p-10 rounded-3xl border border-lilac/20 bg-card/50 backdrop-blur-xl shadow-[0_0_80px_-20px_hsl(var(--lilac)/0.4)] animate-fade-up stagger-1">
              <form onSubmit={submitMfa} className="space-y-5">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) =>
                    setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full px-4 py-3 bg-background/40 border border-primary/20 rounded-md font-mono text-center text-2xl tracking-[0.5em] text-foreground focus:outline-none focus:border-primary/60"
                  placeholder="000000"
                  autoFocus
                />
                {mfaError && (
                  <p className="text-destructive text-sm text-center" role="alert">
                    {mfaError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={mfaSubmitting || mfaCode.length !== 6}
                  className="w-full h-12 bg-lilac hover:bg-lilac-light text-primary-foreground font-medium rounded-xl text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)] disabled:opacity-50 flex items-center justify-center"
                >
                  {mfaSubmitting ? <MoonLoader size="sm" /> : "Verify"}
                </button>
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={useBackupCode}
                    disabled={mfaSubmitting}
                    className="text-sm text-muted-foreground hover:text-lilac transition-colors"
                  >
                    Use a backup recovery code
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden flex flex-col">
      <SEO {...seoProps(isLogin ? "/login" : "/signup")} />
      <Starfield />

      <Navigation />

      <main className="relative z-10 flex-1 flex items-start justify-center px-4 sm:px-6 pt-[68px] pb-16">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6 animate-fade-up">
            <div className="relative inline-block mb-4">
              <img
                src="/assets/MoondayLive-Logo.png"
                alt="Moonday Live Logo"
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border border-lilac/30 shadow-[0_0_50px_-10px_hsl(var(--lilac)/0.5)]"
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            </div>
            <p className="text-lilac text-xs tracking-[0.3em] uppercase mb-2">
              {isLogin ? "Welcome Back" : "Almost there"}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              {isLogin ? "Sign in to your blueprint" : "Create your free account"}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              {isLogin
                ? "Step back into rhythm with the sky."
                : "Two details: your email and a password."}
            </p>
          </div>

          {/* Form card */}
          <div className="p-5 sm:p-8 md:p-10 rounded-3xl border border-lilac/20 bg-card/50 backdrop-blur-xl shadow-[0_0_80px_-20px_hsl(var(--lilac)/0.4)] animate-fade-up stagger-1">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && draft && draftSunSign && (
                <div className="rounded-xl border border-lilac/20 bg-background/30 p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 text-left">
                    <p className="text-xs tracking-[0.2em] uppercase text-lilac/80 text-left">Your birthday</p>
                    <p className="text-base text-foreground text-left">{formatBirthdayLong(draft.birthday)}</p>
                    <p className="text-sm text-muted-foreground text-left">
                      {draftSunSign} Sun · {draft.moonSign} Moon
                    </p>
                  </div>
                  <Link
                    to={`${REVEAL_PATH}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
                    className="shrink-0 inline-flex items-center justify-center min-h-11 px-4 rounded-xl border border-lilac/30 text-sm text-lilac hover:bg-lilac/10 transition-colors"
                  >
                    Change
                  </Link>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs tracking-[0.2em] uppercase text-lilac/80 pl-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs tracking-[0.2em] uppercase text-lilac/80 pl-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-muted-foreground/70 pl-1 text-left">
                    At least 6 characters. Use the eye to check what you typed.
                  </p>
                )}
              </div>

              {error && (
                <p className="text-destructive text-sm text-center py-1" role="alert">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-lilac hover:bg-lilac-light text-primary-foreground font-medium rounded-xl text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? <MoonLoader size="sm" /> : isLogin ? "Sign In" : "Create my account"}
              </button>

              {!isLogin && (
                <p className="text-xs text-muted-foreground/70 leading-relaxed text-left">
                  We'll email a confirmation link. Your birthday is locked once your account exists, so use Change
                  now if it's wrong. After that, corrections go through support@moondaylive.com.
                </p>
              )}
            </form>

            {isLogin && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/auth/forgot-password")}
                  className="min-h-11 px-4 text-sm text-muted-foreground hover:text-lilac transition-colors duration-300"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {/* Toggle */}
          <div className="mt-8 text-center animate-fade-up stagger-2">
            <button
              type="button"
              onClick={() => {
                setError("");
                navigate(isLogin ? REVEAL_PATH : "/login", { replace: true });
              }}
              className="min-h-11 px-4 text-sm text-muted-foreground hover:text-lilac transition-colors duration-300"
            >
              {isLogin ? (
                <>New to Moonday? <span className="text-lilac">Find your moon sign →</span></>
              ) : (
                <>Already initiated? <span className="text-lilac">Sign in →</span></>
              )}
            </button>
          </div>

          {/* Sovereign Teaser — signup only */}
          {!isLogin && (
            <div className="mt-10 animate-fade-up stagger-3">
              <div className="relative rounded-2xl border border-lilac/20 bg-gradient-to-b from-lilac/[0.04] to-transparent p-6 text-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,hsl(var(--lilac)/0.12),transparent_60%)]" />
                <p className="text-[10px] tracking-[0.3em] uppercase text-lilac/70 mb-3 relative">After your moon sign</p>
                <h2 className="font-serif text-xl md:text-2xl text-foreground leading-snug mb-3 relative">
                  You don't need your birth time.<br className="hidden sm:block" />
                  <span className="bg-gradient-to-r from-[#E8C97A] via-[#F5DDA1] to-[#E8C97A] bg-clip-text text-transparent">A real astrologer never did.</span>
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto relative">
                  Your Moon sign is the headline. <span className="text-lilac">Luminary</span> reads the Sun, Mars, Venus, and the slow outer planets that shape who you actually are — no birth time required.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Portal;
