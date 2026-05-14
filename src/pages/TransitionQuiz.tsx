import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Moon, ArrowRight } from "lucide-react";
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
import { getMoonSignByName, getTransitionInfoAsync, type TransitionInfo } from "@/lib/moonSign";

const VALID_SIGNS = new Set([
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
]);

const TransitionQuiz = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Resolve signs from a birthday if not supplied
  useEffect(() => {
    if (!birthdayParam || (signA && signB)) return;
    let cancelled = false;
    setResolving(true);
    const d = new Date(`${birthdayParam}T12:00:00`);
    getTransitionInfoAsync(d)
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
    }
  };

  const handleSaveAndContinue = async () => {
    if (!result) return;
    if (!user) {
      navigate(`/signup${birthdayParam ? `?birthday=${birthdayParam}` : ""}`);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ moon_sign: result.primarySign })
        .eq("user_id", user.id);
      if (error) throw error;
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

            {!resolving && result && (
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
                    On your birth date the Moon ingressed at{" "}
                    {String(Math.floor(info.ingressHour ?? 0)).padStart(2, "0")}:
                    {String(Math.floor(((info.ingressHour ?? 0) % 1) * 60)).padStart(2, "0")} UTC.
                    Sovereign Tier resolves this exactly with birth time.
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
                        {user ? "Anchor This Sign" : "Sign Up to Save"}
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
