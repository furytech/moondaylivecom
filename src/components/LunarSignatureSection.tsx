import { useState } from "react";
import { Brain, Sparkles, Globe, Lock } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import EducationButton from "@/components/EducationButton";
import EducationModal from "@/components/EducationModal";
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
  const [infoOpen, setInfoOpen] = useState(false);
  const signature = INNER_CIRCLE[lunar.sign.name] || INNER_CIRCLE.Aries;

  return (
    <>
    <GlassmorphismCard size="lg" className="animate-fade-up stagger-3 shadow-glow">
      <div className="text-center mb-10">
        <p className="font-display text-sm text-primary/90 uppercase tracking-[0.2em] mb-3">
          The Lunar Signature
        </p>
        <h2 className="font-display text-2xl md:text-3xl text-gold-gradient tracking-wider mb-2">
          {lunar.sign.symbol} {lunar.sign.name}
        </h2>
        <p className="font-serif text-lg text-cream-muted mb-6">
          {lunar.sign.element} Sign
        </p>
        <EducationButton
          label={`About Moon in ${lunar.sign.name}`}
          onClick={() => setInfoOpen(true)}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {PILLAR_ICONS.map(({ icon: Icon, label, key }) => (
          <div
            key={key}
            className="glass-card p-6 rounded-xl text-center card-lift"
          >
            <Icon className="w-6 h-6 text-primary mx-auto mb-4" />
            <p className="font-display text-xs text-primary/90 uppercase tracking-[0.15em] mb-3">
              {label}
            </p>
            <p className="font-serif text-base text-cream-muted leading-relaxed text-center">
              {signature[key]}
            </p>
          </div>
        ))}
      </div>
    </GlassmorphismCard>
    <EducationModal
      isOpen={infoOpen}
      onClose={() => setInfoOpen(false)}
      eyebrow="The Lunar Signature"
      title={`Moon in ${lunar.sign.name}`}
      symbol={lunar.sign.symbol}
      subtitle={`${lunar.sign.element} Sign`}
      intro={`When the transiting Moon moves through ${lunar.sign.name}, the collective emotional tone shifts to match this sign's frequency. Align your Mind, Soul, and Body to the current signature.`}
      sections={[
        { label: "Mind", body: signature.psychological },
        { label: "Soul", body: signature.spiritual },
        { label: "Body", body: signature.material },
      ]}
      closing={`Today, the Moon speaks in the language of ${lunar.sign.name}.`}
    />
    </>
  );
};

export default LunarSignatureSection;
