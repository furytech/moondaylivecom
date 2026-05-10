import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Moon, Sparkles, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import MoonLoader from "@/components/MoonLoader";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { calculateMoonSign, getTransitionInfoAsync, type TransitionInfo } from "@/lib/moonSign";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles as SparklesIcon } from "lucide-react";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [transitionInfo, setTransitionInfo] = useState<TransitionInfo | null>(null);

  // Detect Moon-sign transition days as soon as the user picks a birthday
  useEffect(() => {
    if (isLogin || !birthday) {
      setTransitionInfo(null);
      return;
    }
    let cancelled = false;
    const birthDate = new Date(`${birthday}T12:00:00`);
    getTransitionInfoAsync(birthDate)
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

  useEffect(() => {
    if (user && !authLoading) {
      navigate(redirectTo, { replace: true });
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
    if (!isLogin && !birthday) {
      setError("Please enter your birthday — it's needed to chart your moon sign.");
      return;
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
        navigate(redirectTo, { replace: true });
      } else {
        const birthDate = new Date(`${birthday}T12:00:00`);
        const moonSign = calculateMoonSign(birthDate);
        await signUp(email, password, birthday, moonSign.sign);
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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden flex flex-col">
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
                  className="w-full h-12 px-4 rounded-xl bg-background/40 border border-lilac/20 text-foreground placeholder:text-muted-foreground/50 focus:border-lilac/60 focus:outline-none focus:ring-2 focus:ring-lilac/20 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs tracking-[0.2em] uppercase text-lilac/80 pl-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-background/40 border border-lilac/20 text-foreground placeholder:text-muted-foreground/50 focus:border-lilac/60 focus:outline-none focus:ring-2 focus:ring-lilac/20 transition-all duration-300"
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-xs tracking-[0.2em] uppercase text-lilac/80 pl-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-background/40 border border-lilac/20 text-foreground placeholder:text-muted-foreground/50 focus:border-lilac/60 focus:outline-none focus:ring-2 focus:ring-lilac/20 transition-all duration-300"
                  />
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <label htmlFor="birthday" className="block text-xs tracking-[0.2em] uppercase text-lilac/80 pl-1">
                    Birthday
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        id="birthday"
                        className={cn(
                          "w-full h-12 px-4 rounded-xl bg-background/40 border border-lilac/20 text-left flex items-center justify-between focus:border-lilac/60 focus:outline-none focus:ring-2 focus:ring-lilac/20 transition-all duration-300",
                          !birthday && "text-muted-foreground/50"
                        )}
                      >
                        {birthday ? format(new Date(`${birthday}T12:00:00`), "PPP") : "Pick your birth date"}
                        <CalendarIcon className="w-4 h-4 text-lilac/60" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-navy-dark border-lilac/30" align="start">
                      <Calendar
                        mode="single"
                        selected={birthday ? new Date(`${birthday}T12:00:00`) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, "0");
                            const d = String(date.getDate()).padStart(2, "0");
                            setBirthday(`${y}-${m}-${d}`);
                          }
                        }}
                        defaultMonth={birthday ? new Date(`${birthday}T12:00:00`) : new Date(1990, 0)}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground/70 pl-1 pt-1">
                    Used to chart your natal moon sign — saved to your profile.
                  </p>
                </div>
              )}

              {error && (
                <p className="text-destructive text-sm text-center py-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-lilac hover:bg-lilac-light text-primary-foreground font-medium rounded-xl text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? <MoonLoader size="sm" /> : isLogin ? "Sign In" : "Find My Moon Sign"}
              </button>
            </form>

            {isLogin && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      setError("Please enter your email address first");
                      return;
                    }
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/auth/reset-password`,
                      });
                      if (error) throw error;
                      toast({
                        title: "Reset Link Sent",
                        description: "Check your email for a password reset link.",
                      });
                    } catch (err: unknown) {
                      const error = err as { message?: string };
                      setError(error.message || "Failed to send reset email");
                    }
                  }}
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Portal;
