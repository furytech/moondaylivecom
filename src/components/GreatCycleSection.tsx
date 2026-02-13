import { Brain, Sparkles, Globe, Lock } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { PHASE_GUIDANCE } from "@/lib/innerCircleDictionary";
import type { LunarIntelligence } from "@/lib/lunarEngine";

interface GreatCycleSectionProps {
  lunar: LunarIntelligence;
  isSubscriber: boolean;
  onUpgradeClick: () => void;
}

const PILLAR_ICONS = [
  { icon: Brain, label: "Mind", key: "psychological" as const },
  { icon: Sparkles, label: "Soul", key: "spiritual" as const },
  { icon: Globe, label: "Body", key: "material" as const },
];

const GreatCycleSection = ({ lunar, isSubscriber, onUpgradeClick }: GreatCycleSectionProps) => {
  const phaseKey = Object.keys(PHASE_GUIDANCE).find(
    (k) => lunar.phase.name.toLowerCase().includes(k.toLowerCase())
  ) || "New";
  const guidance = PHASE_GUIDANCE[phaseKey];

  return (
    <GlassmorphismCard size="lg" className="animate-fade-up stagger-2">
      <div className="text-center mb-10">
        <p className="font-display text-sm text-primary/60 uppercase tracking-[0.2em] mb-3">
          The Great Cycle
        </p>
        <h2 className="font-display text-2xl md:text-3xl text-gold-gradient tracking-wider mb-2">
          {lunar.phase.emoji} {lunar.phase.name}
        </h2>
        <p className="font-serif text-lg text-cream-muted">
          {lunar.phase.illumination}% illuminated • {lunar.phase.isWaxing ? "Waxing" : "Waning"}
        </p>
      </div>

      <div className="relative">
        {!isSubscriber && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl glass-card bg-background/80 backdrop-blur-xl">
            <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center mb-5 shadow-glow">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display text-lg md:text-xl text-gold-gradient mb-2 text-center px-6">
              Sovereign Feature
            </h3>
            <p className="font-serif text-base text-cream-muted text-center max-w-md mb-5 px-6">
              Unlock the Mind, Soul &amp; Body pillars of the lunar cycle.
            </p>
            <button
              onClick={onUpgradeClick}
              className="inline-flex items-center gap-3 px-8 py-3 font-display text-sm tracking-widest uppercase glass-card shadow-glow hover:shadow-gold text-primary transition-all duration-500 rounded-xl"
            >
              <Sparkles className="w-4 h-4" />
              Subscribe for $2.88/mo
            </button>
          </div>
        )}

        <div className={`grid md:grid-cols-3 gap-6 ${!isSubscriber ? "opacity-30 blur-md pointer-events-none" : ""}`}>
          {PILLAR_ICONS.map(({ icon: Icon, label, key }) => (
            <div
              key={key}
              className="glass-card p-6 rounded-xl text-center"
            >
              <Icon className="w-6 h-6 text-primary mx-auto mb-4" />
              <p className="font-display text-xs text-primary/60 uppercase tracking-[0.15em] mb-3">
                {label}
              </p>
              <p className="font-serif text-base text-cream-muted leading-relaxed text-center">
                {guidance[key]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </GlassmorphismCard>
  );
};

export default GreatCycleSection;
