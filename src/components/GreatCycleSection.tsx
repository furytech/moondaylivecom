import { useState } from "react";
import { Brain, Sparkles, Globe, Lock } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import EducationButton from "@/components/EducationButton";
import EducationModal from "@/components/EducationModal";
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
  const [infoOpen, setInfoOpen] = useState(false);
  const phaseKey = Object.keys(PHASE_GUIDANCE).find(
    (k) => lunar.phase.name.toLowerCase().includes(k.toLowerCase())
  ) || "New";
  const guidance = PHASE_GUIDANCE[phaseKey];

  return (
    <>
    <GlassmorphismCard size="lg" className="animate-fade-up stagger-2">
      <div className="text-center mb-10">
        <p className="font-display text-sm text-primary/90 uppercase tracking-[0.2em] mb-3">
          The Great Cycle
        </p>
        <h2 className="font-display text-2xl md:text-3xl text-gold-gradient tracking-wider mb-2">
          {lunar.phase.emoji} {lunar.phase.name}
        </h2>
        <p className="font-serif text-lg text-cream-muted mb-6">
          {lunar.phase.illumination}% illuminated • {lunar.phase.isWaxing ? "Waxing" : "Waning"}
        </p>
        <EducationButton
          label={`About the ${lunar.phase.name} Phase`}
          onClick={() => setInfoOpen(true)}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {PILLAR_ICONS.map(({ icon: Icon, label, key }) => (
          <div
            key={key}
            className="glass-card p-6 rounded-xl text-center"
          >
            <Icon className="w-6 h-6 text-primary mx-auto mb-4" />
            <p className="font-display text-xs text-primary/90 uppercase tracking-[0.15em] mb-3">
              {label}
            </p>
            <p className="font-serif text-base text-cream-muted leading-relaxed text-center">
              {guidance[key]}
            </p>
          </div>
        ))}
      </div>
    </GlassmorphismCard>
    <EducationModal
      isOpen={infoOpen}
      onClose={() => setInfoOpen(false)}
      eyebrow="The Great Cycle"
      title={`${lunar.phase.name} Phase`}
      symbol={lunar.phase.emoji as string}
      subtitle={`${lunar.phase.illumination}% illuminated • ${lunar.phase.isWaxing ? "Waxing" : "Waning"}`}
      intro="Each lunar phase carries a distinct energetic signature. Working with — rather than against — the current phase amplifies your intentions across mind, soul, and body."
      sections={[
        { label: "Mind", body: guidance.psychological },
        { label: "Soul", body: guidance.spiritual },
        { label: "Body", body: guidance.material },
      ]}
      closing="Move with the cycle. Resist nothing."
    />
    </>
  );
};

export default GreatCycleSection;
