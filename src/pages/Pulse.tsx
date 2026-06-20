import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import DailyPulse from "@/components/DailyPulse";
import SovereignTeaser from "@/components/SovereignTeaser";
import { Link } from "react-router-dom";

/* Public entry portal — UTC-noon global pulse, accessible to all visitors. */
export default function Pulse() {
  return (
    <div className="sov-shell min-h-screen">
      <SEO
        title="Today's Moon Sign & Phase — Live Now | Moonday Live"
        description="Ever wonder why today feels different? The Moon's 2.5-day cycle shapes your emotional climate. Today's live moon sign & phase — free."
        canonical="https://moondaylive.com/pulse"
      />
      <Navigation />
      <main className="pt-[76px] pb-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <header className="text-center mb-6">
            <div className="text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--gold-medium))] mb-2">
              The Portal
            </div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight text-[hsl(var(--cream))]">
              Begin Here
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[hsl(var(--cream)/0.7)] max-w-xl mx-auto leading-relaxed">
              A standardized global pulse, anchored to UTC noon — the same reading the world is moving through together.
            </p>
          </header>

          <DailyPulse useUtcNoon />

          <div className="mt-8 text-center">
            <Link
              to="/lenses"
              className="inline-block font-display text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--gold-light))] border border-[hsl(var(--gold-medium)/0.55)] px-5 py-2 rounded-sm hover:bg-[hsl(var(--gold-medium)/0.08)] transition-colors"
            >
              Personalize the Lenses →
            </Link>
          </div>

          <div className="mt-10">
            <SovereignTeaser />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
