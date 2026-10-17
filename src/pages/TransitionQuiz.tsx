import { detectTimezoneOption } from "@/lib/timezone";
import { useEffect, useMemo, useRef, useState } from "react";
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
  CUSP_COPY,
  MOON_NEEDS,
  getCuspPair,
  scoreCuspQuiz,
  type CuspScore,
  type MoonSign,
} from "@/lib/moonCuspQuiz";
import {
  getLocalCuspDay,
  formatBirthdayLong,
  formatIngressTime,
  fillCopy,
  makeShuffle,
  type LocalCuspDay,
} from "@/lib/cuspDay";
import { isValidTimezone } from "@/lib/timezone";
import { getMoonSignByName, calculateSunSign } from "@/lib/moonSign";

const QUESTION_COUNT = 5;

interface QuizResultState {
  /** null when the day turned out not to be a Moon-change day */
  score: CuspScore | null;
  /** The sign to save. null while a "close" result is waiting for the person's pick. */
  sign: string | null;
}

const TransitionQuiz = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const { toast } = useToast();

  const birthdayRaw = params.get("birthday") || "";
  const birthdayParam = /^\d{4}-\d{2}-\d{2}/.test(birthdayRaw) ? birthdayRaw.split("T")[0] : "";
  const tzParam = params.get("tz") || "";

  const [tz, setTz] = useState<string>("");
  const [cusp, setCusp] = useState<LocalCuspDay | null>(null);
  const [resolving, setResolving] = useState<boolean>(!!birthdayParam);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Array<"earlier" | "later">>([]);
  const [flips, setFlips] = useState<boolean[]>(() => makeShuffle(QUESTION_COUNT));
  const [step, setStep] = useState<number>(0);
  const [result, setResult] = useState<QuizResultState | null>(null);
  const chosen = result?.sign ?? null;
  const [saving, setSaving] = useState(false);
  const [signupMode, setSignupMode] = useState(false);
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Work out the Moon-change day in the person's OWN timezone:
  // ?tz= (from signup) > saved profile timezone > stashed signup > this device.
  useEffect(() => {
    if (!birthdayParam) return;
    let cancelled = false;
    (async () => {
      let zone = isValidTimezone(tzParam) ? tzParam : "";
      if (!zone && user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("timezone")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.timezone && isValidTimezone(data.timezone)) zone = data.timezone;
      }
      if (!zone) {
        try {
          const raw = sessionStorage.getItem("pendingSignup");
          const stashed = raw ? JSON.parse(raw)?.timezone : "";
          if (stashed && isValidTimezone(stashed)) zone = stashed;
        } catch { /* ignore */ }
      }
      if (!zone) zone = detectTimezoneOption();
      if (cancelled) return;
      setTz(zone);
      setCusp(getLocalCuspDay(birthdayParam, zone));
      setResolving(false);
    })();
    return () => { cancelled = true; };
  }, [birthdayParam, tzParam, user]);

  const pair = useMemo(
    () => (cusp?.isCuspDay ? getCuspPair(cusp.from, cusp.to) : undefined),
    [cusp]
  );
  const questions = pair?.questions ?? [];

  const persistPendingSign = (sign: string) => {
    // Persist so Portal can apply it after email verification + sign-in.
    try {
      const sunSign = birthdayParam ? calculateSunSign(new Date(`${birthdayParam}T12:00:00`)) : undefined;
      localStorage.setItem(
        "pendingMoonSign",
        JSON.stringify({ sign, sunSign, birthday: birthdayParam, ts: Date.now() })
      );
    } catch { /* ignore */ }
  };

  // Not actually a Moon-change day in this timezone: the Moon stayed in one sign.
  useEffect(() => {
    if (!cusp || cusp.isCuspDay || result) return;
    setResult({ score: null, sign: cusp.from });
    persistPendingSign(cusp.from);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cusp]);

  const handleAnswer = (value: "earlier" | "later") => {
    if (!pair || !cusp) return;
    const next = [...answers, value];
    setAnswers(next);
    if (step + 1 < questions.length) {
      setStep(step + 1);
      return;
    }
    const score = scoreCuspQuiz(pair, cusp.fractionBeforeIngress, next);
    if (score.certainty === "clear") {
      setResult({ score, sign: score.leading });
      persistPendingSign(score.leading);
    } else {
      // Close call: never save silently. The person chooses.
      setResult({ score, sign: null });
    }
  };

  const handlePickSign = (sign: MoonSign) => {
    setResult((r) => (r ? { ...r, sign } : r));
    persistPendingSign(sign);
    if (user) {
      void handleSaveAndContinue(sign);
    } else {
      setSignupMode(true);
    }
  };

  // One-shot guard: ensure we only ever attempt the auto-signup ONCE per
  // mount, regardless of re-renders, StrictMode double-invokes, or state
  // changes. Without this guard a failure would flip signupSubmitting back
  // to false and re-trigger the effect, hammering Supabase until it rate
  // limits the IP.
  const autoSignupAttempted = useRef(false);
  useEffect(() => {
    if (autoSignupAttempted.current) return;
    if (!chosen || user || signupSuccess) return;
    let pending: {
      email?: string;
      password?: string;
      birthday?: string;
      timezone?: string;
      firstName?: string;
    } | null = null;
    try {
      const raw = sessionStorage.getItem("pendingSignup");
      if (raw) pending = JSON.parse(raw);
    } catch { /* ignore */ }
    if (!pending?.email || !pending.password) return;

    autoSignupAttempted.current = true;
    // Clear the stash immediately so a reload can never replay the signup.
    try { sessionStorage.removeItem("pendingSignup"); } catch { /* ignore */ }
    setSignupSubmitting(true);
    (async () => {
      try {
        const bd = pending!.birthday || birthdayParam;
        const sunSign = bd ? calculateSunSign(new Date(`${bd.split("T")[0]}T12:00:00`)) : undefined;

        await signUp(
          pending!.email!,
          pending!.password!,
          bd,
          chosen,
          pending!.timezone || detectTimezoneOption(),
          sunSign,
          pending!.firstName
        );
        setSignupSuccess(true);
      } catch (err) {
        const msg = (err as { message?: string }).message || "Could not create account.";
        const friendly = msg.includes("User already registered")
          ? "This email is already registered. Please sign in to anchor your sign."
          : msg.toLowerCase().includes("rate limit")
            ? "Too many signup attempts. Please wait a minute and try again."
            : msg;
        toast({
          title: "Could not create account",
          description: friendly,
          variant: "destructive",
        });
        // Prefill the fallback form with the email so the user can retry
        // without re-typing everything.
        setSignupEmail(pending!.email!);
        setSignupMode(true);
      } finally {
        setSignupSubmitting(false);
      }
    })();
  }, [chosen, user, signupSuccess, signUp, birthdayParam, toast]);

  const handleSaveAndContinue = async (signToSave: string | null = chosen) => {
    if (!signToSave) return;
    if (!user) {
      // Account not yet created — render inline signup form. The quiz result is
      // already in localStorage and will be applied after email verification.
      setSignupMode(true);
      return;
    }
    setSaving(true);
    try {
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("birthday, natal_sun_sign")
        .eq("user_id", user.id)
        .maybeSingle();

      const birthdayToUse = userProfile?.birthday || birthdayParam;
      const sunSign = userProfile?.natal_sun_sign || (birthdayToUse ? calculateSunSign(new Date(`${birthdayToUse.split("T")[0]}T12:00:00`)) : null);

      const updatePayload: Record<string, any> = {
        moon_sign: signToSave,
        natal_moon_sign: signToSave,
      };
      if (sunSign) {
        updatePayload.natal_sun_sign = sunSign;
      }

      const { error } = await supabase
        .from("user_profiles")
        .update(updatePayload)
        .eq("user_id", user.id);
      if (error) throw error;
      try { localStorage.removeItem("pendingMoonSign"); } catch { /* ignore */ }
      toast({
        title: "Moon Sign Confirmed",
        description: `Your blueprint is now anchored in ${signToSave}.`,
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
    setAnswers([]);
    setStep(0);
    setFlips(makeShuffle(QUESTION_COUNT));
    setResult(null);
    setStarted(true);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    if (!chosen) return;
    if (!signupFirstName.trim()) {
      setSignupError("Please enter your first name.");
      return;
    }
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
      const sunSign = birthdayParam ? calculateSunSign(new Date(`${birthdayParam.split("T")[0]}T12:00:00`)) : undefined;
      await signUp(
        signupEmail,
        signupPassword,
        birthdayParam,
        chosen,
        tz || detectTimezoneOption(),
        sunSign,
        signupFirstName.trim()
      );
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
  const noSigns = !birthdayParam || (!resolving && !!cusp?.isCuspDay && !pair);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden flex flex-col">
      <SEO
        title="Between Phases — Refine Your Moon Sign"
        description="A five-question Moon quiz for people born on a day the Moon changed signs."
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
                : "Anchor your true Lunar Signature."}
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

            {!resolving && !noSigns && cusp?.isCuspDay && pair && !started && !result && (
              <div className="text-center space-y-5">
                <p className="text-lilac text-xs tracking-[0.3em] uppercase">
                  {CUSP_COPY.intro.eyebrow}
                </p>
                <h2 className="font-sans font-normal normal-case tracking-normal text-2xl md:text-3xl leading-snug">
                  {CUSP_COPY.intro.headline}
                </h2>
                <p className="text-[15px] md:text-base text-cream/85 leading-relaxed text-left">
                  {fillCopy(CUSP_COPY.intro.body, {
                    date: formatBirthdayLong(birthdayParam),
                    time: cusp.ingress ? formatIngressTime(cusp.ingress, tz) : "",
                    from: cusp.from,
                    to: cusp.to,
                  })}
                </p>
                <button
                  onClick={() => setStarted(true)}
                  className="w-full h-12 bg-lilac hover:bg-lilac-light text-primary-foreground font-medium rounded-xl text-[15px] transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {CUSP_COPY.intro.cta}
                </button>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">
                  {CUSP_COPY.intro.note}
                </p>
              </div>
            )}

            {!resolving && !noSigns && started && !result && questions[step] && (
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

                <h2 className="font-sans font-normal normal-case tracking-normal text-xl md:text-2xl text-center leading-snug pt-2">
                  {questions[step].prompt}
                </h2>

                <div className="space-y-3 pt-2">
                  {(flips[step]
                    ? (["later", "earlier"] as const)
                    : (["earlier", "later"] as const)
                  ).map((side) => (
                    <button
                      key={`${questions[step].id}-${side}`}
                      onClick={() => handleAnswer(side)}
                      className="w-full text-left p-5 rounded-2xl border border-lilac/20 bg-background/30 hover:border-lilac/60 hover:bg-lilac/5 transition-all duration-300 group"
                    >
                      <span className="block text-[15px] md:text-base text-cream/90 group-hover:text-cream leading-relaxed">
                        {questions[step][side]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!resolving && chosen && !signupSuccess && signupSubmitting && !signupMode && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <MoonLoader size="md" />
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  Anchoring your {chosen} Moon and sending your
                  authentication link…
                </p>
              </div>
            )}

            {!resolving && chosen && signupSuccess && (
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
                  Your {chosen} Moon is held safely until you confirm.
                </p>
              </div>
            )}

            {!resolving && chosen && !signupSuccess && signupMode && !user && (
              <form onSubmit={handleSignupSubmit} className="space-y-5">
                <div className="text-center space-y-2">
                  <p className="text-lilac text-xs tracking-[0.3em] uppercase">
                    Anchor {chosen} Moon
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
                    type="text"
                    value={signupFirstName}
                    onChange={(e) => setSignupFirstName(e.target.value)}
                    placeholder="First Name"
                    autoComplete="given-name"
                    className="w-full h-12 px-4 rounded-xl border border-lilac/20 bg-background/40 text-cream placeholder:text-muted-foreground/60 focus:outline-none focus:border-lilac/60 transition-colors"
                  />
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

            {!resolving && result && !chosen && result.score && cusp?.isCuspDay && !signupMode && (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <p className="text-lilac text-xs tracking-[0.3em] uppercase">Your Lunar Signature</p>
                  <h2 className="font-sans font-normal normal-case tracking-normal text-2xl md:text-3xl leading-snug">
                    {fillCopy(CUSP_COPY.resultClose.headline, { from: cusp.from, to: cusp.to })}
                  </h2>
                  <p className="text-[15px] md:text-base text-cream/85 leading-relaxed text-left">
                    {fillCopy(CUSP_COPY.resultClose.body, {
                      sign: result.score.leading,
                      other: result.score.other,
                    })}
                  </p>
                </div>

                <div className="space-y-4">
                  {[cusp.from, cusp.to].map((sign) => (
                    <div
                      key={sign}
                      className="p-5 rounded-2xl border border-lilac/20 bg-background/30 space-y-3"
                    >
                      <h3 className="font-sans font-normal normal-case tracking-normal text-xl">
                        {getMoonSignByName(sign)?.symbol} {sign} Moon
                      </h3>
                      <p className="text-[15px] text-cream/85 leading-relaxed text-left">
                        {getMoonSignByName(sign)?.description}
                      </p>
                      <button
                        onClick={() => handlePickSign(sign)}
                        disabled={saving}
                        className="w-full h-12 bg-lilac hover:bg-lilac-light text-primary-foreground font-medium rounded-xl text-[15px] transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {saving ? <MoonLoader size="sm" /> : fillCopy(CUSP_COPY.resultClose.chooseSign, { sign })}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleRetake}
                  className="w-full h-12 border border-lilac/30 text-lilac hover:bg-lilac/10 rounded-xl text-[15px] transition-all duration-300"
                >
                  Retake the quiz
                </button>
              </div>
            )}

            {!resolving && chosen && !signupSuccess && !signupMode && !signupSubmitting && (
              <div className="text-center space-y-6">
                <div className="space-y-3">
                  <p className="text-lilac text-xs tracking-[0.3em] uppercase">Your Lunar Signature</p>
                  <h2 className="font-sans font-normal normal-case tracking-normal text-2xl md:text-3xl leading-snug">
                    {getMoonSignByName(chosen)?.symbol}{" "}
                    {fillCopy(CUSP_COPY.resultClear.headline, { sign: chosen })}
                  </h2>
                  {result?.score && (
                    <p className="text-[15px] md:text-base text-cream/85 leading-relaxed">
                      {fillCopy(CUSP_COPY.resultClear.body, {
                        sign: chosen,
                        need: MOON_NEEDS[chosen as MoonSign] ?? "",
                      })}
                    </p>
                  )}
                </div>

                <p className="text-[15px] md:text-base text-cream/85 leading-relaxed text-left">
                  {getMoonSignByName(chosen)?.description}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => handleSaveAndContinue()}
                    disabled={saving}
                    className="flex-1 h-12 bg-lilac hover:bg-lilac-light text-primary-foreground font-medium rounded-xl text-[15px] transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <MoonLoader size="sm" /> : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {user ? "Anchor this sign" : "Create my account"}
                      </>
                    )}
                  </button>
                  {result?.score && (
                    <button
                      onClick={handleRetake}
                      className="flex-1 h-12 border border-lilac/30 text-lilac hover:bg-lilac/10 rounded-xl text-[15px] transition-all duration-300"
                    >
                      Retake the quiz
                    </button>
                  )}
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
