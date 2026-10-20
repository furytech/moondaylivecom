import { detectTimezoneOption } from "@/lib/timezone";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Moon, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { seoProps } from "@/lib/seo";
import MoonLoader from "@/components/MoonLoader";
import { useAuth } from "@/contexts/AuthContext";
import LockedBlueprintTeaser from "@/components/LockedBlueprintTeaser";
import { REVEAL_PATH, saveSignupDraft } from "@/lib/signupDraft";
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
  const { user } = useAuth();
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

  // Work out the Moon-change day in the person's OWN timezone:
  // ?tz= (from the reveal step) > saved profile timezone > this device.
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
    if (user) void handleSaveAndContinue(sign);
  };

  const handleSaveAndContinue = async (signToSave: string | null = chosen) => {
    if (!signToSave) return;
    if (!user) {
      // No account yet: hand the birthday and the settled Moon sign to signup so nothing is typed twice.
      // The result is also kept in localStorage and applied after email verification.
      saveSignupDraft({ birthday: birthdayParam, timezone: tz || detectTimezoneOption(), moonSign: signToSave });
      navigate("/signup");
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

  // Revealed only on the results screen; hidden while answering.
  const answersReview =
    cusp?.isCuspDay && questions.length > 0 && answers.length === questions.length ? (
      <div className="space-y-3 text-left">
        <p className="text-lilac text-xs tracking-[0.3em] uppercase text-center">
          How your answers read
        </p>
        <ul className="space-y-3">
          {questions.map((q, i) => {
            const side = answers[i];
            const isEarlier = side === "earlier";
            return (
              <li
                key={q.id}
                className="p-4 rounded-2xl border border-lilac/15 bg-background/30 space-y-2"
              >
                <p className="text-xs text-muted-foreground leading-relaxed">{q.prompt}</p>
                <p className="text-[15px] text-cream/90 leading-relaxed">{q[side]}</p>
                <span
                  className={
                    isEarlier
                      ? "inline-block text-[11px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-full border border-lilac/40 bg-lilac/10 text-lilac"
                      : "inline-block text-[11px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-full border border-gold-medium/40 bg-gold-medium/10 text-gold-light"
                  }
                >
                  {isEarlier ? cusp.from : cusp.to}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    ) : null;

  // ---- States ----
  const noSigns = !birthdayParam || (!resolving && !!cusp?.isCuspDay && !pair);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden flex flex-col">
      <SEO {...seoProps("/transition-quiz")} />
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
              Moon-change birthday
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              Find your true Moon
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
                  Start with your birthday and we'll check whether the Moon changed signs that day.
                </p>
                <button
                  onClick={() => navigate(REVEAL_PATH)}
                  className="mt-2 inline-flex items-center gap-2 h-12 px-6 bg-lilac hover:bg-lilac-light text-primary-foreground rounded-xl text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)]"
                >
                  Enter your birthday <ArrowRight className="w-4 h-4" />
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

            {!resolving && result && !chosen && result.score && cusp?.isCuspDay && (
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

                {answersReview}

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

            {!resolving && chosen && (
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

                {answersReview}

                {user ? (
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => handleSaveAndContinue()}
                      disabled={saving}
                      className="flex-1 min-h-12 bg-lilac hover:bg-lilac-light text-primary-foreground font-medium rounded-xl text-[15px] transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? <MoonLoader size="sm" /> : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Anchor this sign
                        </>
                      )}
                    </button>
                    {result?.score && (
                      <button
                        onClick={handleRetake}
                        className="flex-1 min-h-12 border border-lilac/30 text-lilac hover:bg-lilac/10 rounded-xl text-[15px] transition-all duration-300"
                      >
                        Retake the quiz
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <LockedBlueprintTeaser
                      sunSign={calculateSunSign(birthdayParam)}
                      moonSign={chosen}
                      onCreateAccount={() => handleSaveAndContinue()}
                    />
                    {result?.score && (
                      <button
                        onClick={handleRetake}
                        className="w-full min-h-12 border border-lilac/30 text-lilac hover:bg-lilac/10 rounded-xl text-[15px] transition-all duration-300"
                      >
                        Retake the quiz
                      </button>
                    )}
                  </div>
                )}
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
