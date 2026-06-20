import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import SEO from "@/components/SEO";
import SovereignTeaser from "@/components/SovereignTeaser";
import { Link } from "react-router-dom";

const LunarCycleTracking = () => {
  return (
    <PageLayout>
      <SEO
        title="Lunar Cycle Tracking — The Great Cycle, Daily | Moonday Live"
        description="Lunar cycle tracking translates the Moon's 29.5-day journey into daily guidance for Mind, Soul, and Body. Follow the Great Cycle, live."
        canonical="https://moondaylive.com/lunar-cycle-tracking"
      />
      <div className="max-w-3xl mx-auto w-full animate-fade-up space-y-6">
        <header className="text-center">
          <div className="text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--gold-medium))] mb-2">
            The Great Cycle
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-3 leading-[1.2] pb-1">
            Lunar Cycle Tracking
          </h1>
          <p className="font-serif text-cream-muted text-sm md:text-base">
            The Moon's 29.5-day rhythm, translated into daily practice.
          </p>
        </header>

        <GlassmorphismCard>
          <div className="font-serif text-cream-muted leading-relaxed space-y-5 text-sm md:text-base text-center">
            <p>
              The lunar cycle — what we call the <strong className="text-foreground">Great Cycle</strong> — runs in roughly
              29.5 days, from new moon to new moon. Each phase has its own tone: the seed of the new moon, the build of
              the waxing crescent, the peak of the full moon, the release of the waning, the quiet of the dark.
            </p>
            <p>
              <strong className="text-foreground">Lunar cycle tracking</strong> is the practice of moving with these phases
              instead of against them. Done well, it is the most grounded form of self-observation we have — older than
              any productivity system, and far more honest.
            </p>
          </div>
        </GlassmorphismCard>

        <GlassmorphismCard>
          <h2 className="font-display text-lg tracking-widest uppercase text-foreground text-center mb-4">
            The Eight Phases of the Great Cycle
          </h2>
          <div className="font-serif text-cream-muted leading-relaxed space-y-3 text-sm md:text-base text-left max-w-xl mx-auto">
            <p><strong className="text-foreground">New Moon —</strong> Set the seed. Quiet intention. Begin.</p>
            <p><strong className="text-foreground">Waxing Crescent —</strong> Build. Take the first concrete step.</p>
            <p><strong className="text-foreground">First Quarter —</strong> Push through resistance. Decide.</p>
            <p><strong className="text-foreground">Waxing Gibbous —</strong> Refine. The shape is almost ready.</p>
            <p><strong className="text-foreground">Full Moon —</strong> Reveal. Peak energy. Peak honesty.</p>
            <p><strong className="text-foreground">Waning Gibbous —</strong> Share what was learned. Express.</p>
            <p><strong className="text-foreground">Last Quarter —</strong> Release. Let go of what cannot continue.</p>
            <p><strong className="text-foreground">Waning Crescent —</strong> Rest. Compost. Prepare the next seed.</p>
          </div>
        </GlassmorphismCard>

        <GlassmorphismCard>
          <h2 className="font-display text-lg tracking-widest uppercase text-foreground text-center mb-4">
            Tracking the Cycle With Moonday Live
          </h2>
          <div className="font-serif text-cream-muted leading-relaxed space-y-4 text-sm md:text-base text-center">
            <p>
              Inside your blueprint, every phase of the Great Cycle is mapped to a ritual for Mind, Soul, and Body —
              tuned to your natal moon sign. You'll see exactly where you are in the cycle, what phase comes next, and
              when the Moon is Between Phases and asking for stillness.
            </p>
            <p>
              You can preview the current global pulse on the <Link to="/pulse" className="text-primary/90 hover:text-primary underline underline-offset-2">live
              lunar pulse</Link> page, or read today's <Link to="/lunar-climate" className="text-primary/90 hover:text-primary underline underline-offset-2">daily
              lunar climate</Link> for the emotional weather behind the phase.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/signup"
              className="inline-block font-display text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--gold-light))] border border-[hsl(var(--gold-medium)/0.55)] px-5 py-2 rounded-sm hover:bg-[hsl(var(--gold-medium)/0.08)] transition-colors"
            >
              Begin Tracking The Cycle →
            </Link>
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

export default LunarCycleTracking;
