import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Moon, Sparkles, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import MoonLoader from "@/components/MoonLoader";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { calculateMoonSignAsync, calculateNatalSigns, calculateSunSign, type TransitionInfo } from "@/lib/moonSign";
import { fetchCombinationProfile } from "@/services/combinationService";
import { getCombinedTransitionInfo } from "@/lib/moonTransitions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SEO from "@/components/SEO";
import { Sparkles as SparklesIcon, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIMEZONE_OPTIONS, detectTimezoneOption, zoneAbbreviation } from "@/lib/timezone";
import { cacheTimezone } from "@/hooks/useUserTimezone";

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => {
  const d = String(i + 1).padStart(2, "0");
  return { value: d, label: String(i + 1) };
});

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1920 + 1 }, (_, i) => {
  const y = String(CURRENT_YEAR - i);
  return { value: y, label: y };
});

interface PortalProps {
  defaultMode?: "login" | "signup";
}

const Portal = ({ defaultMode = "login" }: PortalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, loading: authLoading } = useAuth();

  // Where to send the user after successful auth (defaults to /blueprint)
  const fromParam = searchParams.get("from");
  const redirectTo = fromParam && fromParam.startsWith("/") ? fromParam : "/blueprint";

  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");

  const birthday =
    birthYear && birthMonth && birthDay
      ? `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`
      : "";

  const [timezone, setTimezone] = useState<string>(() => detectTimezoneOption());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState<{ factorId: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaSubmitting, setMfaSubmitting] = useState(false);
  const [transitionInfo, setTransitionInfo] = useState<TransitionInfo | null>(null);

  // Detect Moon-sign transition days as soon as the user picks a birthday
  useEffect(() => {
    if (isLogin || !birthday) {
      setTransitionInfo(null);
      return;
    }
    let cancelled = false;
    const birthDate = new Date(`${birthday}T12:00:00`);
    getCombinedTransitionInfo(birthDate)
      .then((info) => {
        if (!cancelled) setTransitionInfo(info);
      })
      .catch(() => {
        if (!cancelled) setTransitionInfo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [birthday, isLogin]);

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
    if (user && !authLoading) {
      // Apply any pending Moon sign captured from the Between Phases quiz
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
                updatePayload.natal_sun_sign = calculateSunSign(new Date(`${pending.birthday}T12:00:00`));
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
      setError("Please fill in all fields");
      return;
    }
    if (!isLogin && !firstName.trim()) {
      setError("Please enter your first name");
      return;
    }
    if (!isLogin && (!birthMonth || !birthDay || !birthYear)) {
      setError("Please select your Month, Day, and Year of birth.");
      return;
    }
    if (!isLogin) {
      const birthDate = new Date(`${birthday}T12:00:00`);
      if (isNaN(birthDate.getTime())) {
        setError("Please select a valid birthday date.");
        return;
      }
      if (birthDate > new Date()) {
        setError("Birthday cannot be in the future.");
        return;
      }
    }
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
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
      } else {
        // Transition-day path: don't create the account yet. Stash the
        // credentials and route the user into the Between Phases quiz. The
        // quiz screen will finalize signUp with the disambiguated sign so
        // the user never has to re-enter email/password.
        if (transitionInfo?.isTransitionDay) {
          try {
            sessionStorage.setItem(
              "pendingSignup",
              JSON.stringify({
                email,
                password,
                birthday,
                timezone,
                firstName: firstName.trim(),
              })
            );
          } catch { /* ignore */ }
          cacheTimezone(timezone);
          navigate(
            `/transition-quiz?signA=${transitionInfo.signAtStart}&signB=${transitionInfo.signAtEnd}&birthday=${birthday}`
          );
          return;
        }

        const birthDate = new Date(`${birthday}T12:00:00`);
        const { sunSign, moonSign: moonSignName } = await calculateNatalSigns(birthDate);
        await signUp(
          email,
          password,
          birthday,
          moonSignName,
          timezone,
          sunSign,
          firstName.trim()
        );
        cacheTimezone(timezone);
        try {
          await fetchCombinationProfile(sunSign, moonSignName);
        } catch {
          /* background prefetch */
        }
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
            <p className="text-lilac font-medium mb-8">{email}</p>
            <p className="text-sm text-muted-foreground/70 mb-10">
              Check your spam folder if it doesn't arrive within a few minutes.
            </p>
            <button
              onClick={() => {
                setSignupSuccess(false);
                setIsLogin(true);
                navigate("/login");
              }}
              className="text-sm tracking-[0.2em] uppercase text-foreground/70 hover:text-lilac transition-colors duration-300"
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
      <SEO
        title={isLogin ? "Sign In — Moonday Live" : "Create Your Account — Moonday Live"}
        description={
          isLogin
            ? "Sign in to your Moonday Live blueprint and continue your lunar journey."
            : "Create your Moonday Live account and find your moon sign in three details."
        }
        noindex
      />
      <Starfield />

      <Navigation />

      <main className="relative z-10 flex-1 flex items-start justify-center px-6 pt-[68px] pb-16">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6 animate-fade-up">
            <div className="relative inline-block mb-4">
              <div
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-lilac/30"
                style={{
                  background:
                    "radial-gradient(circle at 35% 30%, hsl(var(--cream) / 0.85), hsl(var(--lilac) / 0.4) 45%, hsl(var(--navy-dark)) 80%)",
                  boxShadow:
                    "0 0 60px -10px hsl(var(--lilac) / 0.6), inset -10px -15px 40px hsl(var(--navy-deep) / 0.8)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Moon className="w-8 h-8 text-cream/80" strokeWidth={1.2} />
              </div>
            </div>
            <p className="text-lilac text-xs tracking-[0.3em] uppercase mb-2">
              {isLogin ? "Welcome Back" : "Begin the Journey"}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              {isLogin ? "Sign in to your blueprint" : "Find your moon sign"}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              {isLogin
                ? "Step back into rhythm with the sky."
                : "Three details. A lifetime of clarity."}
            </p>
          </div>

          {/* Form card */}
          <div className="p-8 md:p-10 rounded-3xl border border-lilac/20 bg-card/50 backdrop-blur-xl shadow-[0_0_80px_-20px_hsl(var(--lilac)/0.4)] animate-fade-up stagger-1">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-xs tracking-[0.2em] uppercase text-lilac/80 pl-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="e.g. Maya"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-background/40 border border-lilac/20 text-foreground placeholder:text-muted-foreground/80 focus:border-lilac/60 focus:outline-none focus:ring-2 focus:ring-lilac/20 transition-all duration-300"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs tracking-[0.2em] uppercase text-lilac/80 pl-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-background/40 border border-lilac/20 text-foreground placeholder:text-muted-foreground/80 focus:border-lilac/60 focus:outline-none focus:ring-2 focus:ring-lilac/20 transition-all duration-300"
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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 pr-12 rounded-xl bg-background/40 border border-lilac/20 text-foreground placeholder:text-muted-foreground/80 focus:border-lilac/60 focus:outline-none focus:ring-2 focus:ring-lilac/20 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-xs tracking-[0.2em] uppercase text-lilac/80 pl-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-12 px-4 pr-12 rounded-xl bg-background/40 border border-lilac/20 text-foreground placeholder:text-muted-foreground/80 focus:border-lilac/60 focus:outline-none focus:ring-2 focus:ring-lilac/20 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs tracking-[0.2em] uppercase text-lilac/80 pl-1">
                      Birthday
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {/* Month dropdown */}
                      <Select value={birthMonth} onValueChange={setBirthMonth}>
                        <SelectTrigger
                          id="birthMonth"
                          aria-label="Birth Month"
                          className="w-full h-12 px-2.5 sm:px-3 rounded-xl bg-background/40 border border-lilac/20 text-xs sm:text-sm text-foreground text-left focus:border-lilac/60 focus:ring-2 focus:ring-lilac/20 transition-all duration-300"
                        >
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent className="bg-navy-dark border-lilac/30 max-h-60">
                          {MONTH_OPTIONS.map((m) => (
                            <SelectItem key={m.value} value={m.value} className="text-foreground">
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Day dropdown */}
                      <Select value={birthDay} onValueChange={setBirthDay}>
                        <SelectTrigger
                          id="birthDay"
                          aria-label="Birth Day"
                          className="w-full h-12 px-2.5 sm:px-3 rounded-xl bg-background/40 border border-lilac/20 text-xs sm:text-sm text-foreground text-left focus:border-lilac/60 focus:ring-2 focus:ring-lilac/20 transition-all duration-300"
                        >
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent className="bg-navy-dark border-lilac/30 max-h-60">
                          {DAY_OPTIONS.map((d) => (
                            <SelectItem key={d.value} value={d.value} className="text-foreground">
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Year dropdown */}
                      <Select value={birthYear} onValueChange={setBirthYear}>
                        <SelectTrigger
                          id="birthYear"
                          aria-label="Birth Year"
                          className="w-full h-12 px-2.5 sm:px-3 rounded-xl bg-background/40 border border-lilac/20 text-xs sm:text-sm text-foreground text-left focus:border-lilac/60 focus:ring-2 focus:ring-lilac/20 transition-all duration-300"
                        >
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="bg-navy-dark border-lilac/30 max-h-60">
                          {YEAR_OPTIONS.map((y) => (
                            <SelectItem key={y.value} value={y.value} className="text-foreground">
                              {y.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground/70 pl-1 pt-1">
                      Used to chart your natal moon sign — saved to your profile.
                    </p>
                  </div>

                  <div className="space-y-2 pt-4">
                    <label
                      htmlFor="timezone"
                      className="block text-xs tracking-[0.2em] uppercase text-lilac/80 pl-1"
                    >
                      Your Timezone
                    </label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger
                        id="timezone"
                        className="w-full h-12 px-4 rounded-xl bg-background/40 border border-lilac/20 text-left focus:border-lilac/60 focus:ring-2 focus:ring-lilac/20 transition-all duration-300"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Globe className="w-4 h-4 text-lilac/60 shrink-0" />
                          <SelectValue placeholder="Select your timezone" />
                        </span>
                      </SelectTrigger>
                      <SelectContent className="bg-navy-dark border-lilac/30 max-h-72">
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground/70 pl-1 pt-1 leading-relaxed">
                      We publish all moon content on <span className="text-lilac/90">UTC</span>.
                      {timezone !== "UTC" && (
                        <>
                          {" "}Your times will be shown in{" "}
                          <span className="text-lilac/90">{zoneAbbreviation(timezone)}</span> with a
                          small marker noting the UTC source.
                        </>
                      )}
                    </p>
                  </div>

                  {transitionInfo?.isTransitionDay && (
                    <Alert className="mt-3 bg-lilac/5 border-lilac/30 text-left">
                      <SparklesIcon className="w-4 h-4 text-lilac" />
                      <AlertDescription className="text-xs leading-relaxed text-cream/85">
                        <span className="block font-display tracking-[0.2em] uppercase text-lilac mb-1.5">
                          Between Phases
                        </span>
                        On this date the Moon was crossing from{" "}
                        <span className="text-lilac font-medium">{transitionInfo.signAtStart}</span>{" "}
                        into{" "}
                        <span className="text-lilac font-medium">{transitionInfo.signAtEnd}</span>
                        . When you continue, we'll guide you through five quick
                        questions to anchor your true sign — then finish
                        creating your account. No need to re-enter anything.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {error && (
                <p className="text-destructive text-sm text-center py-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-lilac hover:bg-lilac-light text-primary-foreground font-medium rounded-xl text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? <MoonLoader size="sm" /> : isLogin ? "Sign In" : transitionInfo?.isTransitionDay ? "Continue to the Quiz" : "Find My Moon Sign"}
              </button>
            </form>

            {isLogin && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/auth/forgot-password")}
                  className="text-sm text-muted-foreground hover:text-lilac transition-colors duration-300"
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
                const next = !isLogin;
                setIsLogin(next);
                setError("");
                navigate(next ? "/login" : "/signup", { replace: true });
              }}
              className="text-sm text-muted-foreground hover:text-lilac transition-colors duration-300"
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
                <h3 className="font-serif text-xl md:text-2xl text-foreground leading-snug mb-3 relative">
                  You don't need your birth time.<br className="hidden sm:block" />
                  <span className="bg-gradient-to-r from-[#E8C97A] via-[#F5DDA1] to-[#E8C97A] bg-clip-text text-transparent">A real astrologer never did.</span>
                </h3>
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
