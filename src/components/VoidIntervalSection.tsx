import { Brain, Sparkles, Globe, Lock, Zap, Pause } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { VOC_CONNECTED, VOC_UNPLUGGED } from "@/lib/innerCircleDictionary";
import type { LunarIntelligence } from "@/lib/lunarEngine";
import { getVocTimingWindow } from "@/lib/lunarEngine";

interface VoidIntervalSectionProps {
  lunar: LunarIntelligence;
  isPro: boolean;
  onUpgradeClick: () => void;
}

const PILLAR_ICONS = [
  { icon: Brain, label: "Mind", key: "psychological" as const },
  { icon: Sparkles, label: "Soul", key: "spiritual" as const },
  { icon: Globe, label: "Body", key: "material" as const },
];

const VoidIntervalSection = ({ lunar, isPro, onUpgradeClick }: VoidIntervalSectionProps) => {
  const isVoid = lunar.voidOfCourse;
  const guidance = isVoid ? VOC_UNPLUGGED : VOC_CONNECTED;
  const StatusIcon = isVoid ? Pause : Zap;
  const statusLabel = isVoid ? "Unplugged" : "Connected";
  const statusColor = isVoid ? "text-muted-foreground" : "text-primary";
  const vocTiming = getVocTimingWindow();

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <GlassmorphismCard size="lg" className="animate-fade-up stagger-4 shadow-glow">
      <div className="text-center mb-10">
        <p className="font-display text-sm text-primary/60 uppercase tracking-[0.2em] mb-3">
          Between Phases
        </p>
        <div className="flex items-center justify-center gap-3 mb-2">
          <StatusIcon className={`w-6 h-6 ${statusColor}`} />
          <h2 className={`font-display text-2xl md:text-3xl tracking-wider ${statusColor}`}>
            {statusLabel}
          </h2>
        </div>
        <p className="font-serif text-lg text-cream-muted">
          {isVoid
            ? "The Moon is between signs. Routine tasks only."
            : "The Moon's signal is clear. Act with confidence."}
        </p>
      </div>

      {/* Phase Timing Window */}
      <div className="glass-card rounded-xl p-6 mb-10 text-center">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="font-display text-xs text-primary/60 uppercase tracking-widest mb-1">
              Start Time <span className="text-cream-muted/80 normal-case tracking-normal">· {formatDate(vocTiming.startTime)}</span>
            </p>
            <p className="font-display text-lg text-primary">{formatTime(vocTiming.startTime)}</p>
          </div>
          <div>
            <p className="font-display text-xs text-primary/60 uppercase tracking-widest mb-1">
              End Time <span className="text-cream-muted/80 normal-case tracking-normal">· {formatDate(vocTiming.endTime)}</span>
            </p>
            <p className="font-display text-lg text-primary">{formatTime(vocTiming.endTime)}</p>
          </div>
        </div>
        <p className="font-serif text-base text-cream-muted mb-3 text-center">
          This period peaks at <span className="text-primary font-display">{formatTime(vocTiming.peakTime)}</span> on <span className="text-primary font-display">{formatDate(vocTiming.peakTime)}</span>.
        </p>
        <p className="font-serif text-sm text-muted-foreground italic text-center">
          Note: These transitions are gradual rather than black and white; you may feel the shift slightly before or after these times.
        </p>
      </div>

      {/* Pillar cards - gated */}
      <div className="relative">
        {!isPro && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl glass-card bg-background/80 backdrop-blur-xl">
            <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center mb-5 shadow-glow">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display text-lg md:text-xl text-gold-gradient mb-2 text-center px-6">
              Sovereign Feature
            </h3>
            <p className="font-serif text-base text-cream-muted text-center max-w-md mb-5 px-6">
              Unlock the Mind, Soul &amp; Body pillars of Between Phases.
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

        <div className={`grid md:grid-cols-3 gap-6 ${!isPro ? "opacity-30 blur-md pointer-events-none" : ""}`}>
          {PILLAR_ICONS.map(({ icon: Icon, label, key }) => (
            <div
              key={key}
              className="glass-card p-6 rounded-xl text-center card-lift"
            >
              <Icon className={`w-6 h-6 mx-auto mb-4 ${statusColor}`} />
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

export default VoidIntervalSection;
