import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Moon, Sun, Sparkles, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import MoonLoader from "@/components/MoonLoader";
import BirthdayPicker, { type BirthdayParts } from "@/components/BirthdayPicker";
import LockedBlueprintTeaser from "@/components/LockedBlueprintTeaser";
import { seoProps } from "@/lib/seo";
import { buildBirthday, isValidBirthday, revealForBirthday, type BirthdayReveal } from "@/lib/birthdayReveal";
import { loadSignupDraft, saveSignupDraft } from "@/lib/signupDraft";
import { getMoonSignByName } from "@/lib/moonSign";
import { getMoonSignDeepDive } from "@/lib/moonSignContent";
import { formatBirthdayLong } from "@/lib/cuspDay";
import { detectTimezoneOption } from "@/lib/timezone";
import { trackEvent } from "@/lib/analytics";

const GOLD = "#d4af37";

const EMPTY: BirthdayParts = { month: "", day: "", year: "" };

const splitBirthday = (birthday: string): BirthdayParts => {
  const [year, month, day] = birthday.split("-");
  return { year, month, day };
};

const FindMoonSign = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const timezone = useMemo(() => detectTimezoneOption(), []);
  const draft = useMemo(() => loadSignupDraft(), []);

  const [parts, setParts] = useState<BirthdayParts>(() => (draft ? splitBirthday(draft.birthday) : EMPTY));
  const [reveal, setReveal] = useState<BirthdayReveal | null>(null);
  const [calculating, setCalculating] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const birthday = buildBirthday(parts.year, parts.month, parts.day);
  const complete = parts.year !== "" && parts.month !== "" && parts.day !== "";
  const invalid = complete && !isValidBirthday(birthday);
  const email = searchParams.get("email") ?? draft?.email ?? undefined;

  useEffect(() => {
    if (!isValidBirthday(birthday)) {
      setReveal(null);
      return;
    }
    let cancelled = false;
    setCalculating(true);
    revealForBirthday(birthday, timezone)
      .then((raw) => {
        if (cancelled) return;
        // Coming back via "Change" with a quiz result already settled for this same birthday: keep it.
        const settled =
          raw.isCuspDay && draft?.birthday === birthday && draft.moonSign && raw.cuspSigns?.includes(draft.moonSign);
        const result: BirthdayReveal = settled
          ? { ...raw, isCuspDay: false, cuspSigns: null, moonSign: draft!.moonSign }
          : raw;
        setReveal(result);
        trackEvent("moon_reveal_shown", { moon_change_birthday: result.isCuspDay });
      })
      .catch(() => {
        if (!cancelled) setReveal(null);
      })
      .finally(() => {
        if (!cancelled) setCalculating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [birthday, timezone, draft]);

  const revealKey = reveal ? `${reveal.birthday}` : "";
  useEffect(() => {
    if (revealKey) resultRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [revealKey]);

  const goToSignup = () => {
    if (!reveal?.moonSign) return;
    saveSignupDraft({ birthday: reveal.birthday, timezone, moonSign: reveal.moonSign, email });
    trackEvent("moon_reveal_create_account");
    navigate({ pathname: "/signup", search: searchParams.toString() ? `?${searchParams.toString()}` : "" });
  };

  const goToQuiz = () => {
    if (!reveal?.isCuspDay) return;
    saveSignupDraft({ birthday: reveal.birthday, timezone, moonSign: null, email });
    trackEvent("moon_reveal_start_quiz");
    navigate(`/transition-quiz?birthday=${reveal.birthday}&tz=${encodeURIComponent(timezone)}`);
  };

  const moonInfo = reveal?.moonSign ? getMoonSignByName(reveal.moonSign) : null;
  const deepDive = reveal?.moonSign ? getMoonSignDeepDive(reveal.moonSign) : null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden flex flex-col">
      <SEO {...seoProps("/find-my-moon-sign")} />
      <Navigation />

      <main className="relative z-10 flex-1 flex items-start justify-center px-4 sm:px-6 pt-[68px] pb-16">
        <div className="max-w-md w-full">
          <div className="text-center mb-6 animate-fade-up">
            <div className="relative inline-block mb-4">
              <img
                src="/assets/MoondayLive-Logo.png"
                alt="Moonday Live logo"
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border border-lilac/30 shadow-[0_0_50px_-10px_hsl(var(--lilac)/0.5)]"
              />
            </div>
            <p className="text-lilac text-xs tracking-[0.3em] uppercase mb-2">Free · Birthday only</p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              Find your Moon sign
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Enter your birthday and see it now. No account, no birth time.
            </p>
          </div>

          <div className="p-5 sm:p-8 rounded-3xl border border-lilac/20 bg-card/50 backdrop-blur-xl shadow-[0_0_80px_-20px_hsl(var(--lilac)/0.4)] animate-fade-up stagger-1">
            <p className="block text-xs tracking-[0.2em] uppercase text-lilac/80 pl-1 mb-2 text-left">
              Your birthday
            </p>
            <BirthdayPicker value={parts} onChange={setParts} />
            {invalid && (
              <p role="alert" className="text-destructive text-sm pt-3 text-left">
                That date doesn't exist. Please check the month and day.
              </p>
            )}
            {!complete && (
              <p className="text-xs text-muted-foreground/80 pt-3 text-left leading-relaxed">
                Pick the month, day and year. We assume noon on your birthday, so your birth time never matters.
              </p>
            )}
          </div>

          <div ref={resultRef} aria-live="polite" className="scroll-mt-20">
            {calculating && !reveal && (
              <div className="flex flex-col items-center gap-3 py-10">
                <MoonLoader size="md" />
                <p className="text-sm text-muted-foreground">Reading the sky on your birthday…</p>
              </div>
            )}

            {reveal && reveal.isCuspDay && reveal.cuspSigns && (
              <section className="mt-6 p-5 sm:p-8 rounded-3xl border border-lilac/20 bg-card/50 space-y-5 animate-fade-up">
                <div className="space-y-2">
                  <p className="text-lilac text-xs tracking-[0.3em] uppercase text-left">Moon-change birthday</p>
                  <p className="font-sans text-lg leading-snug text-foreground text-left">
                    On {formatBirthdayLong(reveal.birthday)} the Moon moved from {reveal.cuspSigns[0]} into{" "}
                    {reveal.cuspSigns[1]}. Your Moon sign is one of these two.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {reveal.cuspSigns.map((sign) => (
                    <div key={sign} className="rounded-xl border border-lilac/20 bg-background/30 p-4 text-center">
                      <p className="text-3xl leading-none mb-2" aria-hidden="true">
                        {getMoonSignByName(sign)?.symbol}
                      </p>
                      <p className="font-display text-lg" style={{ color: GOLD }}>
                        {sign}
                      </p>
                      <p className="text-xs text-muted-foreground">{getMoonSignByName(sign)?.element}</p>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed text-left flex items-center gap-2">
                  <Sun className="h-4 w-4 shrink-0 text-lilac" aria-hidden="true" />
                  <span>Your Sun sign: {reveal.sunSign}</span>
                </p>

                <p className="text-[15px] text-cream/85 leading-relaxed text-left">
                  Five short questions settle which one is yours. Then you'll see your Moon sign and your Blueprint
                  offer.
                </p>

                <button
                  type="button"
                  onClick={goToQuiz}
                  className="w-full min-h-12 px-5 py-3 bg-lilac hover:bg-lilac-light text-primary-foreground font-sans text-[15px] font-medium normal-case tracking-normal rounded-xl transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)] inline-flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Take the Moon quiz
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </section>
            )}

            {reveal && !reveal.isCuspDay && reveal.moonSign && moonInfo && (
              <section className="mt-6 space-y-6 animate-fade-up">
                <div className="p-5 sm:p-8 rounded-3xl border border-lilac/20 bg-card/50 space-y-5">
                  <div className="text-center space-y-1">
                    <p className="text-lilac text-xs tracking-[0.3em] uppercase">Your Moon sign</p>
                    <p className="text-5xl leading-none pt-2" aria-hidden="true" style={{ color: GOLD }}>
                      {moonInfo.symbol}
                    </p>
                    <h2
                      className="font-display text-3xl md:text-4xl tracking-wide pt-1"
                      style={{ color: GOLD, textShadow: "0 0 22px rgba(212, 175, 55, 0.35)" }}
                    >
                      {reveal.moonSign} Moon
                    </h2>
                    {deepDive && (
                      <p className="text-sm text-muted-foreground tracking-wide">
                        {deepDive.archetype} · {moonInfo.element}
                      </p>
                    )}
                  </div>

                  <p className="text-[15px] md:text-base text-cream/90 leading-relaxed text-left">
                    {moonInfo.description} {moonInfo.emotionalStyle}
                  </p>

                  <p className="border-t border-lilac/15 pt-4 text-sm text-muted-foreground leading-relaxed text-left flex items-center gap-2">
                    <Sun className="h-4 w-4 shrink-0 text-lilac" aria-hidden="true" />
                    <span>Your Sun sign: {reveal.sunSign}</span>
                  </p>
                </div>

                <LockedBlueprintTeaser
                  sunSign={reveal.sunSign}
                  moonSign={reveal.moonSign}
                  onCreateAccount={goToSignup}
                />

                <p className="text-xs text-muted-foreground/80 leading-relaxed text-left flex gap-2">
                  <Moon className="h-4 w-4 shrink-0 text-lilac/70" aria-hidden="true" />
                  <span>
                    Free account, birthday only. We never ask for your birth time or place. Your birthday is locked
                    once you create your account.
                  </span>
                </p>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FindMoonSign;
