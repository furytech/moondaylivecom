import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Moon, ArrowRight, Eye, EyeOff, MailCheck } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import MoonLoader from "@/components/MoonLoader";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  selectQuestionsForSigns,
  calculateQuizResult,
  type QuizQuestion,
  type QuizResult,
} from "@/lib/transitionQuiz";
import { getMoonSignByName, type TransitionInfo } from "@/lib/moonSign";
import { getCombinedTransitionInfo } from "@/lib/moonTransitions";

const VALID_SIGNS = new Set([
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
]);

const TransitionQuiz = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const { toast } = useToast();

  const birthdayParam = params.get("birthday") || "";
  const querySignA = params.get("signA") || "";
  const querySignB = params.get("signB") || "";

  const [signA, setSignA] = useState<string>(VALID_SIGNS.has(querySignA) ? querySignA : "");
  const [signB, setSignB] = useState<string>(VALID_SIGNS.has(querySignB) ? querySignB : "");
  const [info, setInfo] = useState<TransitionInfo | null>(null);
  const [resolving, setResolving] = useState<boolean>(!!birthdayParam && (!signA || !signB));
  const [answers, setAnswers] = useState<Record<string, "A" | "B">>({});
  const [step, setStep] = useState<number>(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [signupMode, setSignupMode] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Resolve signs from a birthday if not supplied
  useEffect(() => {
    if (!birthdayParam || (signA && signB)) return;
    let cancelled = false;
    setResolving(true);
    const d = new Date(`${birthdayParam}T12:00:00`);
    getCombinedTransitionInfo(d)
      .then((tinfo) => {
        if (cancelled) return;
        setInfo(tinfo);
        if (tinfo.isTransitionDay) {
          setSignA(tinfo.signAtStart);
          setSignB(tinfo.signAtEnd);
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setResolving(false));
    return () => { cancelled = true; };
  }, [birthdayParam, signA, signB]);

  const questions = useMemo<QuizQuestion[]>(() => {
    if (!signA || !signB) return [];
    return selectQuestionsForSigns(signA, signB, 5);
  }, [signA, signB]);

  const handleAnswer = (choice: "A" | "B") => {
    const q = questions[step];
    if (!q) return;
    const next = { ...answers, [q.id]: choice };
    setAnswers(next);
    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      const r = calculateQuizResult(signA, signB, next);
      setResult(r);
      // Persist so Portal can apply it after email verification + sign-in.
      try {
        localStorage.setItem(
          "pendingMoonSign",
          JSON.stringify({
            sign: r.primarySign,
            birthday: birthdayParam,
            ts: Date.now(),
          })
        );
      } catch { /* ignore */ }
    }
  };

  const handleSaveAndContinue = async () => {
    if (!result) return;
    if (!user) {
      // Account not yet created — render inline signup form. The quiz result is
      // already in localStorage and will be applied after email verification.
      setSignupMode(true);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ moon_sign: result.primarySign })
        .eq("user_id", user.id);
      if (error) throw error;
      try { localStorage.removeItem("pendingMoonSign"); } catch { /* ignore */ }
      toast({
        title: "Moon Sign Confirmed",
        description: `Your blueprint is now anchored in ${result.primarySign}.`,
      });
      navigate("/blueprint");
    } catch (err) {
      toast({
        title: "Could not save",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setStep(0);
    setResult(null);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    if (!result) return;
    if (!signupEmail || !signupPassword) {
      setSignupError("Please enter your email and a password.");
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupError("Passwords do not match.");
      return;
    }
    setSignupSubmitting(true);
    try {
      // Keep pendingMoonSign in localStorage so Portal can apply it after the
      // user clicks the email verification link and lands signed-in.
      await signUp(signupEmail, signupPassword, birthdayParam, result.primarySign);
      setSignupSuccess(true);
    } catch (err) {
      const msg = (err as { message?: string }).message || "Could not create account.";
      setSignupError(
        msg.includes("User already registered")
          ? "This email is already registered. Please sign in to anchor your sign."
          : msg
      );
    } finally {
      setSignupSubmitting(false);
    }
  };

  // Stable starfield
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

  const Starfield = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-gold-pale animate-twinkle"
          style={{
            top: s.top, left: s.left,
            width: `${s.size}px`, height: `${s.size}px`,
            opacity: s.opacity, animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );

  // ---- States ----
  const noSigns = !signA || !signB;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden flex flex-col">
      <SEO
        title="Between Phases — Refine Your Moon Sign"
        description="A guided 5-question quiz for souls born on a Moon-sign transition day."
        noindex
      />
      <Starfield />
      <Navigation />

      <main className="relative z-10 flex-1 flex items-start justify-center px-6 pt-[68px] pb-16">
        <div className="max-w-xl w-full">
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
              Between Phases
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              Refine your Moon Sign
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              {noSigns
                ? "On the day you were born, the Moon was crossing thresholds."
                : <>The Moon transitioned from <span className="text-lilac">{signA}</span> to <span className="text-lilac">{signB}</span>. Answer five questions to anchor your true signature.</>}
            </p>
          </div>

          {/* Card */}
          <div className="p-8 md:p-10 rounded-3xl border border-lilac/20 bg-card/50 backdrop-blur-xl shadow-[0_0_80px_-20px_hsl(var(--lilac)/0.4)] animate-fade-up stagger-1">
            {resolving && (
              <div className="flex flex-col items-center gap-4 py-8">
                <MoonLoader size="md" />
                <p className="text-sm text-muted-foreground">Reading the ephemeris…</p>
              </div>
            )}

            {!resolving && noSigns && (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This page disambiguates your Moon sign on a transition day.
                  Provide a birthday in the URL to begin, or start by signing up.
                </p>
                <p className="text-xs text-muted-foreground/70 font-mono">
                  /transition-quiz?birthday=YYYY-MM-DD
                </p>
                <button
                  onClick={() => navigate("/signup")}
                  className="mt-2 inline-flex items-center gap-2 h-12 px-6 bg-lilac hover:bg-lilac-light text-primary-foreground rounded-xl text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)]"
                >
                  Begin Signup <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {!resolving && !noSigns && !result && questions[step] && (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs tracking-[0.2em] uppercase text-lilac/80">
                  <span>Question {step + 1} of {questions.length}</span>
                  <span>{Math.round(((step) / questions.length) * 100)}%</span>
                </div>
                <div className="h-1 w-full bg-lilac/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lilac transition-all duration-500"
                    style={{ width: `${((step) / questions.length) * 100}%` }}
                  />
                </div>

                <h2 className="font-display text-xl md:text-2xl text-center leading-snug pt-2">
                  {questions[step].question}
                </h2>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => handleAnswer("A")}
                    className="w-full text-left p-5 rounded-2xl border border-lilac/20 bg-background/30 hover:border-lilac/60 hover:bg-lilac/5 transition-all duration-300 group"
                  >
                    <span className="block text-sm md:text-base text-cream/90 group-hover:text-cream leading-relaxed">
                      {questions[step].optionA.text}
                    </span>
                  </button>
                  <button
                    onClick={() => handleAnswer("B")}
                    className="w-full text-left p-5 rounded-2xl border border-lilac/20 bg-background/30 hover:border-lilac/60 hover:bg-lilac/5 transition-all duration-300 group"
                  >
                    <span className="block text-sm md:text-base text-cream/90 group-hover:text-cream leading-relaxed">
                      {questions[step].optionB.text}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {!resolving && result && signupSuccess && (
              <div className="text-center space-y-6 py-2">
                <div className="mx-auto w-16 h-16 rounded-full border border-lilac/40 flex items-center justify-center bg-lilac/10 shadow-[0_0_50px_-10px_hsl(var(--lilac)/0.6)]">
                  <MailCheck className="w-7 h-7 text-lilac" strokeWidth={1.4} />
                </div>
                <div>
                  <p className="text-lilac text-xs tracking-[0.3em] uppercase mb-3">
                    Check Your Inbox
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-4 leading-tight">
                    Your Lunar Signature awaits
                  </h2>
                  <p className="text-sm md:text-base text-cream/85 leading-relaxed max-w-md mx-auto">
                    An authentication link has been sent to your email. Please
                    check your inbox and click the link to anchor your Lunar
                    Signature and enter your Blueprint.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground/70 leading-relaxed border-t border-lilac/10 pt-4 max-w-sm mx-auto">
                  Your {result.primarySign} Moon is held safely until you confirm.
                </p>
              </div>
            )}

            {!resolving && result && !signupSuccess && signupMode && !user && (
              <form onSubmit={handleSignupSubmit} className="space-y-5">
                <div className="text-center space-y-2">
                  <p className="text-lilac text-xs tracking-[0.3em] uppercase">
                    Anchor {result.primarySign} Moon
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
                    Create your account
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We'll email you a confirmation link to seal your Blueprint.
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="Email"
                    autoComplete="email"
                    className="w-full h-12 px-4 rounded-xl border border-lilac/20 bg-background/40 text-cream placeholder:text-muted-foreground/60 focus:outline-none focus:border-lilac/60 transition-colors"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Password"
                      autoComplete="new-password"
                      className="w-full h-12 px-4 pr-12 rounded-xl border border-lilac/20 bg-background/40 text-cream placeholder:text-muted-foreground/60 focus:outline-none focus:border-lilac/60 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-lilac transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      className="w-full h-12 px-4 pr-12 rounded-xl border border-lilac/20 bg-background/40 text-cream placeholder:text-muted-foreground/60 focus:outline-none focus:border-lilac/60 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-lilac transition-colors"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {signupError && (
                  <p className="text-xs text-destructive text-center leading-relaxed">{signupError}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={signupSubmitting}
                    className="flex-1 h-12 bg-lilac hover:bg-lilac-light text-primary-foreground font-medium rounded-xl text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {signupSubmitting ? <MoonLoader size="sm" /> : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Create My Account
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupMode(false)}
                    className="flex-1 h-12 border border-lilac/30 text-lilac hover:bg-lilac/10 rounded-xl text-xs tracking-[0.2em] uppercase transition-all duration-300"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}

            {!resolving && result && !signupSuccess && !signupMode && (
              <div className="text-center space-y-6">
                <div>
                  <p className="text-lilac text-xs tracking-[0.3em] uppercase mb-2">
                    Your Lunar Signature
                  </p>
                  <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-2">
                    {getMoonSignByName(result.primarySign)?.symbol}{" "}
                    {result.primarySign} Moon
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Confidence: <span className="text-lilac font-medium">{result.confidence}%</span>
                    {" · "}
                    {result.primaryScore}–{result.secondaryScore} vs {result.secondarySign}
                  </p>
                </div>

                <p className="text-sm md:text-base text-cream/85 leading-relaxed">
                  {getMoonSignByName(result.primarySign)?.description}
                </p>

                {info?.isTransitionDay && (
                  <p className="text-xs text-muted-foreground/70 leading-relaxed border-t border-lilac/10 pt-4">
                    Your answers anchor your Lunar Signature on a day the Moon
                    was crossing thresholds. This result will be saved to your
                    profile.
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleSaveAndContinue}
                    disabled={saving}
                    className="flex-1 h-12 bg-lilac hover:bg-lilac-light text-primary-foreground font-medium rounded-xl text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <MoonLoader size="sm" /> : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {user ? "Anchor This Sign" : "Create My Account"}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleRetake}
                    className="flex-1 h-12 border border-lilac/30 text-lilac hover:bg-lilac/10 rounded-xl text-xs tracking-[0.2em] uppercase transition-all duration-300"
                  >
                    Retake Quiz
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground/60 leading-relaxed">
            For entertainment and self-reflection. Not a substitute for professional advice.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TransitionQuiz;
