import { Brain, Sparkles, Globe, Lock } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { INNER_CIRCLE } from "@/lib/innerCircleDictionary";
import type { LunarIntelligence } from "@/lib/lunarEngine";

interface LunarSignatureSectionProps {
  lunar: LunarIntelligence;
  isPro: boolean;
  onUpgradeClick: () => void;
}

const PILLAR_ICONS = [
  { icon: Brain, label: "Mind", key: "psychological" as const },
  { icon: Sparkles, label: "Soul", key: "spiritual" as const },
  { icon: Globe, label: "Body", key: "material" as const },
];

const LunarSignatureSection = ({ lunar, isPro, onUpgradeClick }: LunarSignatureSectionProps) => {
  const signature = INNER_CIRCLE[lunar.sign.name] || INNER_CIRCLE.Aries;

  if (!isPro) {
    return (
      <div className="relative animate-fade-up stagger-3">
        {/* Gated overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl glass-card bg-background/80 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center mb-6 shadow-glow">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display text-xl md:text-2xl text-gold-gradient mb-3 text-center px-6">
            Sovereign Tier
          </h3>
          <p className="font-serif text-base text-cream-muted text-center max-w-md mb-6 px-6">
            Align your Psychological, Spiritual, and Material worlds with the Moon's frequency.
          </p>
          <button
            onClick={onUpgradeClick}
            className="inline-flex items-center gap-3 px-8 py-3 font-display text-sm tracking-widest uppercase glass-card shadow-glow hover:shadow-gold text-primary transition-all duration-500 rounded-xl"
          >
            <Sparkles className="w-4 h-4" />
            Unlock Sovereign Insights
          </button>
        </div>

        {/* Blurred background content */}
        <GlassmorphismCard size="lg" className="opacity-30 blur-md pointer-events-none">
          <div className="text-center mb-8">
            <p className="font-display text-sm uppercase tracking-[0.2em] mb-3">The Lunar Signature</p>
            <h2 className="font-display text-2xl">{lunar.sign.symbol} {lunar.sign.name}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PILLAR_ICONS.map(({ label, key }) => (
              <div key={key} className="glass-card p-6 rounded-xl text-center">
                <p className="font-display text-xs mb-3">{label}</p>
                <p className="font-serif text-base">{signature[key]}</p>
              </div>
            ))}
          </div>
        </GlassmorphismCard>
      </div>
    );
  }

  return (
    <GlassmorphismCard size="lg" className="animate-fade-up stagger-3 shadow-glow">
      <div className="text-center mb-10">
        <p className="font-display text-sm text-primary/60 uppercase tracking-[0.2em] mb-3">
          The Lunar Signature
        </p>
        <h2 className="font-display text-2xl md:text-3xl text-gold-gradient tracking-wider mb-2">
          {lunar.sign.symbol} {lunar.sign.name}
        </h2>
        <p className="font-serif text-lg text-cream-muted">
          {lunar.sign.element} Sign
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PILLAR_ICONS.map(({ icon: Icon, label, key }) => (
          <div
            key={key}
            className="glass-card p-6 rounded-xl text-center card-lift"
          >
            <Icon className="w-6 h-6 text-primary mx-auto mb-4" />
            <p className="font-display text-xs text-primary/60 uppercase tracking-[0.15em] mb-3">
              {label}
            </p>
            <p className="font-serif text-base text-cream-muted leading-relaxed text-center">
              {signature[key]}
            </p>
          </div>
        ))}
      </div>
    </GlassmorphismCard>
  );
};

export default LunarSignatureSection;
