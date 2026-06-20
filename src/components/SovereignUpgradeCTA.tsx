import { Crown, ChevronRight, Sparkles } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";

interface SovereignUpgradeCTAProps {
  onUpgradeClick: () => void;
}

/**
 * The Sovereign upgrade CTA — placed below the free Moon reveal on /blueprint.
 * Edgy, honest, glamour-forward. Tells the truth: a real astrologer can read
 * you closely from your birthday alone.
 */
const SovereignUpgradeCTA = ({ onUpgradeClick }: SovereignUpgradeCTAProps) => {
  return (
    <GlassmorphismCard className="relative overflow-hidden animate-fade-up">
      {/* subtle lilac glow accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.45), transparent 60%)" }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 mb-6">
          <Crown className="w-3.5 h-3.5 text-primary" />
          <span className="font-display text-[11px] uppercase tracking-[0.25em] text-primary">
            The Sovereign Reading
          </span>
        </span>

        <h2 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-4">
          You don't need your birth time.
          <br className="hidden md:block" />
          <span className="text-primary"> A real astrologer never did.</span>
        </h2>

        <p className="font-serif text-lg md:text-xl text-cream-muted max-w-2xl mb-3 leading-relaxed">
          Your Moon sign is the headline. <span className="text-foreground">Sovereign is the rest of the story.</span>
        </p>

        <p className="font-serif text-base md:text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
          From your birthday alone we can read you <em>remarkably</em> close —
          the kind of read you'd pay an astrologer hundreds for. Perfect for the friend
          you just met, the family member who shrugs at &ldquo;what time were you born?&rdquo;,
          or you, right now, with no clock and no certificate. Know the city? We sharpen it.
          You still get more dots connected than any horoscope app will ever offer.
        </p>

        {/* What you get */}
        <div className="w-full max-w-3xl grid md:grid-cols-2 gap-3 mb-8 text-left">
          {[
            { label: "Sun", note: "Your core identity — exact." },
            { label: "Moon", note: "Your emotional weather — already revealed above." },
            { label: "Mercury & Venus", note: "How you think. How you love." },
            { label: "Mars", note: "What drives you. How you fight." },
            { label: "Jupiter & Saturn", note: "Where you expand. Where you grow up." },
            { label: "Uranus · Neptune · Pluto", note: "Your generational signature." },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-start gap-3 px-4 py-3 rounded-xl border border-primary/15 bg-primary/[0.04]"
            >
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-display text-sm uppercase tracking-widest text-primary">
                  {row.label}
                </div>
                <div className="font-serif text-sm text-cream-muted leading-snug">{row.note}</div>
              </div>
            </div>
          ))}
        </div>


        <button
          onClick={onUpgradeClick}
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_40px_hsl(var(--primary)/0.55)] font-display text-sm uppercase tracking-[0.25em] transition-all duration-300"
        >
          <Crown className="w-4 h-4" />
          <span>Unlock the Full Reading</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <p className="mt-4 font-serif text-xs uppercase tracking-widest text-muted-foreground">
          Entertainment, with discipline. Cancel anytime.
        </p>
      </div>
    </GlassmorphismCard>
  );
};

export default SovereignUpgradeCTA;
