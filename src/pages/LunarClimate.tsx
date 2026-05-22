import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";

const LunarClimate = () => {
  return (
    <PageLayout>
      <SEO
        title="Daily Lunar Climate — Read Today's Moon Weather | Moonday Live"
        description="The daily lunar climate is the emotional weather the Moon creates as it moves through the zodiac. Read today's lunar climate, live."
        canonical="https://moondaylive.com/lunar-climate"
      />
      <div className="max-w-3xl mx-auto w-full animate-fade-up space-y-6">
        <header className="text-center">
          <div className="text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--gold-medium))] mb-2">
            The Climate
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-3 leading-[1.2] pb-1">
            Daily Lunar Climate
          </h1>
          <p className="font-serif text-cream-muted text-sm md:text-base">
            The emotional weather the Moon creates as it crosses the zodiac.
          </p>
        </header>

        <GlassmorphismCard>
          <div className="font-serif text-cream-muted leading-relaxed space-y-5 text-sm md:text-base text-center">
            <p>
              The <strong className="text-foreground">lunar climate</strong> is the felt sense of the day —
              the difference between a morning that flows and one that drags for reasons you cannot name. It is set
              by the sign the Moon is currently transiting, the phase of the Great Cycle, and the small void
              intervals when the Moon is briefly Between Phases.
            </p>
            <p>
              Unlike sun-sign astrology, which moves in months, the lunar climate moves in hours. Reading it is the
              difference between guessing at your own mood and naming it before it names you.
            </p>
          </div>
        </GlassmorphismCard>

        <GlassmorphismCard>
          <h2 className="font-display text-lg tracking-widest uppercase text-foreground text-center mb-4">
            What Sets Today's Lunar Climate
          </h2>
          <div className="font-serif text-cream-muted leading-relaxed space-y-4 text-sm md:text-base text-center">
            <p>
              Three live signals: the <strong className="text-foreground">current moon sign</strong> (where the Moon sits
              in the zodiac right now), the <strong className="text-foreground">current phase</strong> (waxing, full,
              waning, dark), and any <strong className="text-foreground">void-of-course interval</strong> — the quiet
              moments Between Phases when the Moon is making no aspects to other planets.
            </p>
            <p>
              Moonday Live composes these into a single climate score, refreshed continuously. You can see the global
              pulse on the <Link to="/pulse" className="text-primary/90 hover:text-primary underline underline-offset-2">live
              lunar pulse</Link> page, and your personal climate — layered with your natal Lunar Signature — inside your blueprint.
            </p>
          </div>
        </GlassmorphismCard>

        <GlassmorphismCard>
          <h2 className="font-display text-lg tracking-widest uppercase text-foreground text-center mb-4">
            Lunar Cycle Tracking, Made Practical
          </h2>
          <div className="font-serif text-cream-muted leading-relaxed space-y-4 text-sm md:text-base text-center">
            <p>
              Tracking the lunar cycle is not about superstition. It is about giving language and rhythm to states you
              already experience — the surge before a full moon, the quiet ache of the dark phase, the lift of a
              waxing crescent. When you can name the climate, you can meet it instead of fighting it.
            </p>
            <p>
              Members receive daily climate readings, ritual prompts for every phase, and a year-long view of how the
              Great Cycle is shaping their Mind, Soul, and Body.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/signup"
              className="inline-block font-display text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--gold-light))] border border-[hsl(var(--gold-medium)/0.55)] px-5 py-2 rounded-sm hover:bg-[hsl(var(--gold-medium)/0.08)] transition-colors"
            >
              Track Your Lunar Cycle →
            </Link>
          </div>
        </GlassmorphismCard>

        <p className="font-serif text-[11px] text-cream-muted/50 text-center max-w-xl mx-auto">
          For entertainment and reflection only. Not a substitute for medical, financial, or professional advice.
        </p>
      </div>
    </PageLayout>
  );
};

export default LunarClimate;
