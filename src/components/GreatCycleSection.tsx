import { Brain, Sparkles, Globe } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { PHASE_GUIDANCE } from "@/lib/innerCircleDictionary";
import type { LunarIntelligence } from "@/lib/lunarEngine";

interface GreatCycleSectionProps {
  lunar: LunarIntelligence;
}

const PILLAR_ICONS = [
  { icon: Brain, label: "The Mind", key: "psychological" as const },
  { icon: Sparkles, label: "The Essence", key: "spiritual" as const },
  { icon: Globe, label: "The World", key: "material" as const },
];

const GreatCycleSection = ({ lunar }: GreatCycleSectionProps) => {
  // Match phase name to our dictionary keys
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

      <div className="grid md:grid-cols-3 gap-6">
        {PILLAR_ICONS.map(({ icon: Icon, label, key }) => (
          <div
            key={key}
            className="glass-card p-6 rounded-xl text-center"
          >
            <Icon className="w-6 h-6 text-primary mx-auto mb-4" />
            <p className="font-display text-xs text-primary/60 uppercase tracking-[0.15em] mb-3">
              {label}
            </p>
            <p className="font-serif text-base text-cream-muted leading-relaxed">
              {guidance[key]}
            </p>
          </div>
        ))}
      </div>
    </GlassmorphismCard>
  );
};

export default GreatCycleSection;
