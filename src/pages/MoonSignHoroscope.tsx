import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";

const MoonSignHoroscope = () => {
  return (
    <PageLayout>
      <SEO
        title="Moon Sign Horoscope — Daily Lunar Reading | Moonday Live"
        description="Your moon sign horoscope, refreshed with every lunar transit. Read today's emotional climate through the moon sign you were born under."
        canonical="https://moondaylive.com/moon-sign-horoscope"
      />
      <div className="max-w-3xl mx-auto w-full animate-fade-up space-y-6">
        <header className="text-center">
          <div className="text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--gold-medium))] mb-2">
            The Reading
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-3 leading-[1.2] pb-1">
            Moon Sign Horoscope
          </h1>
          <p className="font-serif text-cream-muted text-sm md:text-base">
            A daily lunar reading, tuned to the sign you were born under.
          </p>
        </header>

        <GlassmorphismCard>
          <div className="font-serif text-cream-muted leading-relaxed space-y-5 text-sm md:text-base text-center">
            <p>
              A traditional horoscope reads the Sun. A <strong className="text-foreground">moon sign horoscope</strong> reads
              the part of you the world rarely sees — your inner climate, your instincts, the way you process the day after
              it has ended. It is the most honest forecast in astrology, because the Moon moves quickly and asks
              quickly: <em>How are you, really?</em>
            </p>
            <p>
              Every two and a half days the transiting Moon enters a new sign, and the emotional weather shifts with it.
              When the transiting Moon harmonizes with your <strong className="text-foreground">natal moon sign</strong>,
              the day feels effortless. When it squares or opposes it, the day asks more of you. A daily moon sign
              horoscope tells you which kind of day is unfolding before you live it.
            </p>
          </div>
        </GlassmorphismCard>

        <GlassmorphismCard>
          <h2 className="font-display text-lg tracking-widest uppercase text-foreground text-center mb-4">
            How Your Moon Sign Horoscope Works
          </h2>
          <div className="font-serif text-cream-muted leading-relaxed space-y-4 text-sm md:text-base text-center">
            <p>
              Moonday Live composes your reading from two live inputs: the <strong className="text-foreground">current transiting
              moon sign</strong> (where the Moon is right now in the sky) and your <strong className="text-foreground">natal
              moon sign</strong> (where it was the moment you were born). The aspect between them — harmonious, neutral, or
              challenging — sets the tone of your day.
            </p>
            <p>
              We don't write twelve generic blurbs. Your horoscope is generated against the live lunar climate score, the
              current phase of the Great Cycle, and any void-of-course intervals between phases. That is why the same
              moon sign can read very differently from one Tuesday to the next.
            </p>
          </div>
        </GlassmorphismCard>

        <GlassmorphismCard>
          <h2 className="font-display text-lg tracking-widest uppercase text-foreground text-center mb-4">
            Daily Lunar Climate, In Plain Language
          </h2>
          <div className="font-serif text-cream-muted leading-relaxed space-y-4 text-sm md:text-base text-center">
            <p>
              The <Link to="/pulse" className="text-primary/90 hover:text-primary underline underline-offset-2">live lunar pulse</Link> shows
              today's moon sign and phase for the whole world. Your personal horoscope layers your Lunar Signature on top of
              it — so you see not just <em>what the sky is doing</em>, but <em>what it means for you</em>.
            </p>
            <p>
              Become a member to receive your daily moon sign horoscope, your full natal blueprint, and rituals tuned to
              every phase of the Great Cycle.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/signup"
              className="inline-block font-display text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--gold-light))] border border-[hsl(var(--gold-medium)/0.55)] px-5 py-2 rounded-sm hover:bg-[hsl(var(--gold-medium)/0.08)] transition-colors"
            >
              Begin Your Blueprint →
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

export default MoonSignHoroscope;
