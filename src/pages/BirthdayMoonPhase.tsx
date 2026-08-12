import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import SEO from "@/components/SEO";
import SovereignTeaser from "@/components/SovereignTeaser";
import { getCurrentMoon, type CurrentMoonData } from "@/lib/currentMoon";
import { calculateMoonSignAsync } from "@/lib/moonSign";
import { CALCULATION_ERROR_MESSAGE } from "@/lib/safeLunar";
import MoonCalculationFallback from "@/components/MoonCalculationFallback";

const PHASES: { name: string; body: string }[] = [
  { name: "New Moon", body: "The Moon sits between Earth and the Sun, invisible to us. Symbolically tied to beginnings, blank slates, and setting intentions before the cycle builds." },
  { name: "Waxing Crescent", body: "A sliver of light appears and grows each night. Often associated with early momentum — the first small steps taken after an intention is set." },
  { name: "First Quarter", body: "The Moon is half-lit, and growth meets resistance. This phase is commonly linked to decision points, friction, and the push needed to move a plan forward." },
  { name: "Waxing Gibbous", body: "Nearly full, with light continuing to build. Associated with refinement — adjusting and improving something that's already in motion, before it reaches its peak." },
  { name: "Full Moon", body: "The Moon is fully illuminated, opposite the Sun in the sky. Traditionally tied to culmination, heightened emotion, and clarity — the peak of the cycle." },
  { name: "Waning Gibbous", body: "Light begins to recede. Often connected to reflection and gratitude — processing what the Full Moon revealed before releasing it." },
  { name: "Last Quarter", body: "Half-lit again, now shrinking. Associated with letting go, closing loops, and clearing space for what comes next." },
  { name: "Waning Crescent", body: "The final sliver before darkness returns. Linked to rest, surrender, and quiet preparation for the next New Moon to begin the cycle again." },
];

const FAQS: { q: string; a: string }[] = [
  { q: "What moon phase was I born under?", a: "Your birthday moon phase is the stage of the Moon's 29.5-day cycle on the exact day you were born. There are 8 possible phases, ranging from New Moon to Waning Crescent. Enter your birth date above to calculate yours instantly." },
  { q: "Does my birth moon phase affect my personality?", a: "There is no scientific evidence that lunar phase at birth affects personality. This is an astrological and symbolic framework rather than an empirically proven one — many people find it meaningful as a lens for self-reflection." },
  { q: "Can two people have the same birthday moon phase?", a: "Yes. The Moon repeats its 8-phase cycle roughly every 29.5 days, so many people born weeks or months apart share the same birth moon phase." },
];

const CANONICAL = "https://moondaylive.com/birthday-moon-phase";

const softwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Birthday Moon Phase Calculator",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  url: CANONICAL,
  description:
    "Calculate the exact moon phase and moon sign for any birth date. Free, instant, and personalized lunar birth reading.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@type": "Organization", name: "Moonday Live", url: "https://moondaylive.com" },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

interface Result {
  dateLabel: string;
  moon: CurrentMoonData;
  moonSign: string;
  moonSignSymbol: string;
}

const BirthdayMoonPhase = () => {
  const [date, setDate] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<Date | null>(null);

  const runCalculation = async (bd: Date) => {
    setLoading(true);
    try {
      const moon = getCurrentMoon(bd);
      const signResult = await calculateMoonSignAsync(bd);
      if (!moon?.phase || !signResult?.sign) {
        throw new Error("Incomplete lunar payload");
      }
      setResult({
        dateLabel: bd.toLocaleDateString(undefined, {
          year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
        }),
        moon,
        moonSign: signResult.sign,
        moonSignSymbol: signResult.symbol,
      });
    } catch (err) {
      // Keep the form usable: clear the stale reading, explain, offer a retry.
      console.error("[BirthdayMoonPhase] calculation failed", err);
      setResult(null);
      setError(CALCULATION_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const onCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!date) {
      setError("Please enter your birth date.");
      return;
    }
    // Parse as UTC noon to avoid timezone drift
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) {
      setError("Please enter a valid date.");
      return;
    }
    const bd = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    setLastAttempt(bd);
    await runCalculation(bd);
  };


  return (
    <PageLayout>
      <SEO
        title="What Moon Phase Was I Born Under? Free Moon Calculator"
        description="Find the exact moon phase and moon sign on the day you were born. Enter your birth date for an instant, personalized lunar reading — free, no signup."
        canonical={CANONICAL}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      <div className="max-w-3xl mx-auto w-full animate-fade-up space-y-6">
        <header className="text-center">
          <div className="text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--gold-medium))] mb-2">
            The Birthday Reading
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-3 leading-[1.2] pb-1">
            What Moon Phase Was I Born Under?
          </h1>
          <p className="font-serif text-cream-muted text-sm md:text-base max-w-2xl mx-auto">
            Every one of us was born under a specific moon phase — a snapshot of the Moon's
            29.5-day cycle, frozen on the day we entered the world. Enter your birth date
            below to find your exact phase, instantly.
          </p>
        </header>

        {/* Calculator */}
        <GlassmorphismCard>
          <form onSubmit={onCalculate} className="flex flex-col items-center gap-4">
            <label htmlFor="birthdate" className="font-display text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--gold-light))]">
              Your Birth Date
            </label>
            <input
              id="birthdate"
              type="date"
              value={date}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border border-[hsl(var(--gold-medium)/0.45)] rounded-sm px-4 py-2 font-serif text-foreground text-center focus:outline-none focus:border-[hsl(var(--gold-medium))] transition-colors"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-block font-display text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--gold-light))] border border-[hsl(var(--gold-medium)/0.55)] px-6 py-2.5 rounded-sm hover:bg-[hsl(var(--gold-medium)/0.08)] transition-colors disabled:opacity-50"
            >
              {loading ? "Reading the Sky…" : "Reveal My Birth Moon →"}
            </button>
            {error && error !== CALCULATION_ERROR_MESSAGE && (
              <p className="text-xs text-red-400 font-serif">{error}</p>
            )}
          </form>

          {error === CALCULATION_ERROR_MESSAGE && (
            <div className="mt-6 pt-4 border-t border-[hsl(var(--gold-medium)/0.25)]">
              <MoonCalculationFallback
                bare
                title="We couldn't calculate this reading"
                onRetry={lastAttempt ? () => runCalculation(lastAttempt) : undefined}
                retrying={loading}
              />
            </div>
          )}

          {result && (
            <div className="mt-8 pt-6 border-t border-[hsl(var(--gold-medium)/0.25)] text-center space-y-3">
              <p className="font-serif text-xs uppercase tracking-[0.3em] text-cream-muted/70">
                {result.dateLabel}
              </p>
              <div className="text-5xl md:text-6xl" aria-hidden="true">
                {result.moon.phaseEmoji}
              </div>
              <h2 className="font-display text-2xl md:text-3xl text-gold-gradient tracking-wider">
                {result.moon.phase}
              </h2>
              <p className="font-serif text-cream-muted text-sm">
                {result.moon.illumination}% illuminated · Moon in{" "}
                <span className="text-foreground">
                  {result.moonSignSymbol} {result.moonSign}
                </span>
              </p>
            </div>
          )}

        </GlassmorphismCard>

        {/* Why it matters */}
        <GlassmorphismCard>
          <h2 className="font-display text-lg tracking-widest uppercase text-foreground text-center mb-4">
            Why Your Birth Moon Phase Matters
          </h2>
          <div className="font-serif text-cream-muted leading-relaxed space-y-4 text-sm md:text-base text-center">
            <p>
              Your Sun sign describes the self you show the world. Your birth moon phase is
              its quiet companion — the emotional weather the sky was holding the day you
              arrived. Where the Sun tells the story of your identity, the phase you were
              born under hints at the rhythm underneath it: how you begin, how you build,
              how you release.
            </p>
            <p>
              Traditional astrology treats the birth moon phase as a lens for self-reflection,
              not a forecast. We keep it that way — a beautiful frame, honestly labeled.
            </p>
          </div>
        </GlassmorphismCard>

        {/* 8 phases */}
        <GlassmorphismCard>
          <h2 className="font-display text-lg tracking-widest uppercase text-foreground text-center mb-4">
            The 8 Moon Phases and What They Mean
          </h2>
          <div className="font-serif text-cream-muted leading-relaxed space-y-3 text-sm md:text-base text-left max-w-xl mx-auto">
            {PHASES.map((p) => (
              <p key={p.name}>
                <strong className="text-foreground">{p.name} —</strong> {p.body}
              </p>
            ))}
          </div>
          <p className="mt-5 font-serif text-[11px] text-cream-muted/60 text-center italic max-w-xl mx-auto">
            These are traditional astrological associations, not scientific claims.
          </p>
        </GlassmorphismCard>

        {/* FAQ */}
        <GlassmorphismCard>
          <h2 className="font-display text-lg tracking-widest uppercase text-foreground text-center mb-4">
            Frequently Asked Questions
          </h2>
          <div className="font-serif text-cream-muted leading-relaxed space-y-5 text-sm md:text-base text-left max-w-xl mx-auto">
            {FAQS.map((f) => (
              <div key={f.q}>
                <p className="text-foreground font-display text-[13px] tracking-widest uppercase mb-1.5">
                  {f.q}
                </p>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </GlassmorphismCard>

        {/* Dual CTA */}
        <GlassmorphismCard>
          <div className="grid md:grid-cols-2 gap-6 text-center">
            <div className="space-y-3">
              <p className="font-serif text-cream-muted text-sm md:text-base">
                Curious what your Moon sign says about you?
              </p>
              <Link
                to="/my-moon-card"
                className="inline-block font-display text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--gold-light))] border border-[hsl(var(--gold-medium)/0.55)] px-5 py-2 rounded-sm hover:bg-[hsl(var(--gold-medium)/0.08)] transition-colors"
              >
                Find Your Moon Sign →
              </Link>
            </div>
            <div className="space-y-3">
              <p className="font-serif text-cream-muted text-sm md:text-base">
                Want daily guidance, not just your birth chart?
              </p>
              <Link
                to="/pricing"
                className="inline-block font-display text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--gold-light))] border border-[hsl(var(--gold-medium)/0.55)] px-5 py-2 rounded-sm hover:bg-[hsl(var(--gold-medium)/0.08)] transition-colors"
              >
                Explore Moonday Live Premium →
              </Link>
            </div>
          </div>
        </GlassmorphismCard>

        <SovereignTeaser />

        <p className="font-serif text-[11px] text-cream-muted/50 text-center max-w-xl mx-auto">
          For entertainment and reflection only. Not a substitute for medical, financial, or professional advice.
        </p>
      </div>
    </PageLayout>
  );
};

export default BirthdayMoonPhase;
