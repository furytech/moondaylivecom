import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "react-router-dom";
import { Moon, Sparkles, Compass } from "lucide-react";

const About = () => {
  useSEO({
    title: "About Moonday Live — Luxury Lunar Guidance",
    description:
      "Moonday Live is a modern sanctuary for ancient lunar wisdom — translating the Great Cycle into personalized rituals for Mind, Soul, and Body.",
  });

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto w-full animate-fade-up space-y-6">
        <header className="text-center">
          <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-3">
            About Moonday Live
          </h1>
          <p className="font-serif text-cream-muted text-sm md:text-base">
            A modern sanctuary for the oldest rhythm we know.
          </p>
        </header>

        <GlassmorphismCard>
          <div className="font-serif text-cream-muted leading-relaxed space-y-6 text-sm md:text-base text-center">
            <p>
              Moonday Live was created for those who feel the pull of the Moon
              and wish to live in conversation with it. We believe the Great
              Cycle — waxing, full, waning, dark — is not a metaphor, but a
              practical instrument for the Mind, the Soul, and the Body.
            </p>
            <p>
              Every blueprint, ritual, and forecast on this platform is built
              on precise astronomical engines and dressed in the language of
              ceremony. Nothing here is generic; everything is tuned to your
              Lunar Signature, read through{" "}
              <Link to="/lenses" className="text-primary/90 hover:text-primary underline underline-offset-2 transition-colors">
                three distinct lenses
              </Link>{" "}
              — Tropical, Sidereal, and Draconic — so you see the full picture,
              not just one surface.
            </p>
          </div>
        </GlassmorphismCard>

        <div className="grid md:grid-cols-3 gap-4">
          <GlassmorphismCard size="sm">
            <div className="text-center space-y-2">
              <Moon className="w-5 h-5 text-primary mx-auto" />
              <p className="font-display text-xs uppercase tracking-[0.2em] text-primary/80">
                Mind
              </p>
              <p className="font-serif text-xs text-cream-muted">
                Clarity through the lunar lens.
              </p>
            </div>
          </GlassmorphismCard>
          <GlassmorphismCard size="sm">
            <div className="text-center space-y-2">
              <Sparkles className="w-5 h-5 text-primary mx-auto" />
              <p className="font-display text-xs uppercase tracking-[0.2em] text-primary/80">
                Soul
              </p>
              <p className="font-serif text-xs text-cream-muted">
                Ritual woven from your signature.
              </p>
            </div>
          </GlassmorphismCard>
          <GlassmorphismCard size="sm">
            <div className="text-center space-y-2">
              <Compass className="w-5 h-5 text-primary mx-auto" />
              <p className="font-display text-xs uppercase tracking-[0.2em] text-primary/80">
                Body
              </p>
              <p className="font-serif text-xs text-cream-muted">
                Move with the cycle, not against it.
              </p>
            </div>
          </GlassmorphismCard>
        </div>

        <GlassmorphismCard>
          <div className="font-serif text-cream-muted leading-relaxed space-y-6 text-sm md:text-base text-center">
            <h2 className="font-display text-lg md:text-xl text-gold-gradient tracking-wider">
              Beyond the Birth Certificate
            </h2>
            <p>
              Most people encounter a barrier in astrology before they even
              begin: they don't know their exact minute of birth. I realized
              that this missing piece of paper shouldn't lock someone out of
              understanding their internal rhythm. My vision for Moonday Live
              started there — creating a system that uses the date to provide
              a clear, actionable pulse of the Moon's influence, regardless of
              whether you have a birth certificate in hand.
            </p>
          </div>
        </GlassmorphismCard>

        <GlassmorphismCard>
          <div className="font-serif text-cream-muted leading-relaxed space-y-6 text-sm md:text-base text-center">
            <h2 className="font-display text-lg md:text-xl text-gold-gradient tracking-wider">
              The Gravity of the Moon
            </h2>
            <p>
              We often look to far-off planets, but the Moon is our closest
              and most influential planetary body. It is the silent driver of
              our moods, our intuition, and our daily energy. As a{" "}
              <span className="text-primary/90">Cancer with a Cancer Moon</span>,
              I don't just study these cycles; I live them. I understand
              intimately how the Moon's placement, phase, and daily house
              transit can shift the entire "weather" of a person's life.
            </p>
          </div>
        </GlassmorphismCard>

        <GlassmorphismCard>
          <div className="font-serif text-cream-muted leading-relaxed space-y-6 text-sm md:text-base text-center">
            <h2 className="font-display text-lg md:text-xl text-gold-gradient tracking-wider">
              The Three Lenses Approach
            </h2>
            <p>
              Moonday Live was built to move beyond "flat" horoscopes. By
              looking through the{" "}
              <span className="text-primary/90">
                Tropical, Sidereal, and Draconic lenses
              </span>
              , we offer a balanced perspective on how the Moon affects the
              areas of your life you haven't yet considered. We provide the
              data; you maintain the sovereignty to use that insight to find
              balance and move boldly through your day.
            </p>
            <div className="flex justify-center pt-2">
              <Link
                to="/lenses"
                className="font-display text-xs tracking-widest uppercase px-8 py-3 art-deco-border brass-glow text-primary"
              >
                Explore the Three Lenses
              </Link>
            </div>
          </div>
        </GlassmorphismCard>

        <GlassmorphismCard>
          <div className="font-serif text-cream-muted leading-relaxed space-y-6 text-sm md:text-base text-center">
            <h2 className="font-display text-lg md:text-xl text-gold-gradient tracking-wider">
              Our Promise
            </h2>
            <p>
              No noise. No daily horoscope dressed in glitter. Moonday Live is
              quiet, exact, and beautifully made — a tool you will keep
              returning to as the Moon returns to itself.
            </p>
            <div className="flex justify-center pt-2">
              <Link
                to="/pricing"
                className="font-display text-xs tracking-widest uppercase px-8 py-3 art-deco-border brass-glow text-primary"
              >
                Discover the Sovereign Tier
              </Link>
            </div>
          </div>
        </GlassmorphismCard>
      </div>
    </PageLayout>
  );
};

export default About;
