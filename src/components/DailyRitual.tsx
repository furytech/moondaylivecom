import { Lock, Sparkles, Crown, Zap, Clock, Moon } from "lucide-react";
import GlassmorphismCard from "./GlassmorphismCard";
import { getDailyRitual } from "@/lib/dailyRitual";

interface DailyRitualProps {
  currentMoonSign: string;
  birthMoonSign: string | null;
  moonPhase: string;
  isPro: boolean;
  onUpgradeClick: () => void;
}

function getSovereignInsight(birthMoonSign: string, moonPhase: string, currentMoonSign: string): string {
  const phaseInsights: Record<string, string> = {
    "New Moon": `As a ${birthMoonSign} Moon, this New Moon in ${currentMoonSign} invites you to plant seeds in the deepest soil of your psyche. Your emotional nature craves fresh beginnings right now—use this darkness not as emptiness, but as fertile ground. The intentions you set today carry the weight of your natal lunar imprint, making them uniquely potent for your path.`,
    "Waxing Crescent": `Your ${birthMoonSign} Moon responds to this Waxing Crescent with a surge of quiet determination. As the first sliver of light returns in ${currentMoonSign}, your emotional body begins to stir with purpose. This is your window to nurture the intentions you've set—your natal moon gives you an instinctive sense of exactly which ones deserve your energy.`,
    "First Quarter": `The First Quarter Moon in ${currentMoonSign} creates a dynamic tension with your ${birthMoonSign} Moon nature. This is the moment of decision—your emotional instincts are asking you to commit or release. Trust the friction; it's not resistance, it's refinement. Your birth moon knows which battles are worth fighting today.`,
    "Waxing Gibbous": `Under this Waxing Gibbous in ${currentMoonSign}, your ${birthMoonSign} Moon is fine-tuning your emotional antenna. You're receiving subtle signals about what needs adjustment before the full illumination arrives. Pay attention to recurring feelings—they're your natal moon's way of course-correcting your trajectory.`,
    "Full Moon": `This Full Moon in ${currentMoonSign} illuminates the deepest chambers of your ${birthMoonSign} Moon consciousness. Everything you've been feeling beneath the surface is now fully visible. This is your moment of emotional harvest—the lunar light reveals what your birth moon has been cultivating in silence. Let clarity wash over you.`,
    "Waning Gibbous": `As the Moon begins to release in ${currentMoonSign}, your ${birthMoonSign} Moon enters a phase of grateful reflection. The wisdom you've gathered is ready to be shared or integrated. Your emotional body is processing recent revelations—honor this by slowing down and letting your natal instincts guide what you keep and what you release.`,
    "Last Quarter": `The Last Quarter Moon in ${currentMoonSign} asks your ${birthMoonSign} Moon to forgive and let go. Old emotional patterns are ready to dissolve if you allow them. Your birth moon carries ancient wisdom about release—trust it now. What served you before may be the very thing holding you back from your next evolution.`,
    "Waning Crescent": `In this Waning Crescent in ${currentMoonSign}, your ${birthMoonSign} Moon retreats into its most intuitive state. The veil between your conscious and unconscious mind is thin. Dreams, hunches, and quiet knowing are amplified. Surrender to rest—your natal moon is preparing you for the rebirth that comes with the next cycle.`,
  };

  return phaseInsights[moonPhase] || phaseInsights["Full Moon"];
}

const DailyRitual = ({ currentMoonSign, birthMoonSign, moonPhase, isPro, onUpgradeClick }: DailyRitualProps) => {
  const ritual = getDailyRitual(currentMoonSign);

  return (
    <GlassmorphismCard size="lg" className={isPro ? "shadow-glow" : ""}>
      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <Moon className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl tracking-widest text-foreground uppercase">
          Daily Ritual
        </h2>
        <Moon className="w-5 h-5 text-primary" />
      </div>

      {/* Ritual Title & Element */}
      <div className="text-center mb-6">
        <h3 className="font-display text-2xl text-gold-gradient mb-2">{ritual.title}</h3>
        <span className="font-display text-xs text-primary/60 uppercase tracking-widest">
          {ritual.element} Element
        </span>
      </div>

      {/* Affirmation */}
      <div className="mb-8 text-center">
        <p className="font-display text-xs text-primary/60 uppercase tracking-widest mb-3">Affirmation</p>
        <p className="font-serif text-xl text-primary italic leading-relaxed max-w-2xl mx-auto">
          "{ritual.affirmation}"
        </p>
      </div>

      {/* Action Tiles — flexible grid, hero insight dominant */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-primary/10 mb-8 items-start">
        {/* Timing */}
        <div className="sov-card sov-card--wide h-auto">
          <div className="sov-data">
            <span className="sov-data__label">Timing</span>
            <span className="sov-data__value">{ritual.timing}</span>
          </div>
          <p className="sov-statement">
            <strong>The Window of Opportunity</strong>
            These specific hours represent the peak saturation of your natal lunar frequency. Act within this window.
          </p>
        </div>

        {/* Practice */}
        <div className="sov-card sov-card--wide h-auto">
          <div className="sov-data">
            <span className="sov-data__label">Practice</span>
            <span className="sov-data__value">{ritual.practice}</span>
          </div>
          <p className="sov-statement">
            <strong>Daily Alignment</strong>
            Use this physical exercise to ground your birth moon's energy into your body.
          </p>
        </div>

        {/* Crystals */}
        <div className="sov-card sov-card--wide h-auto">
          <div className="sov-data">
            <span className="sov-data__label">Crystals</span>
            <span className="sov-data__value">{ritual.crystals.join(" · ")}</span>
          </div>
          <p className="sov-statement">
            <strong>Environmental Resonance</strong>
            These stones act as a supportive vibration for your current transit.
          </p>
        </div>
      </div>

      {/* === TIERED SECTION === */}
      {isPro && birthMoonSign ? (
        /* Sovereign Insight */
        <div className="border-t border-primary/20 pt-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Crown className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg tracking-widest text-primary uppercase">
              Sovereign Insight
            </h3>
          </div>
          <div className="text-center mb-4">
            <p className="font-display text-xs text-primary/60 uppercase tracking-widest mb-3">
              Why This Matters to You
            </p>
          </div>
          <p className="font-serif text-lg text-cream-muted leading-relaxed text-center max-w-3xl mx-auto">
            {getSovereignInsight(birthMoonSign, moonPhase, currentMoonSign)}
          </p>
        </div>
      ) : isPro && !birthMoonSign ? (
        /* Subscriber without birth moon sign - prompt to enter details */
        <div className="border-t border-primary/20 pt-8">
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center mx-auto mb-5 shadow-glow">
              <Moon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display text-lg text-gold-gradient mb-4 tracking-widest uppercase">
              Complete Your Profile
            </h3>
            <p className="font-serif text-base text-cream-muted mb-6 max-w-md mx-auto">
              Enter your birth details above to unlock your personalized Sovereign Insight — a deep reading of how today's moon interacts with your natal lunar imprint.
            </p>
          </div>
        </div>
      ) : (
        /* Locked Sovereign Features - non-subscriber */
        <div className="border-t border-primary/20 pt-8">
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center mx-auto mb-5 shadow-glow">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display text-lg text-gold-gradient mb-6 tracking-widest uppercase">
              Sovereign Features
            </h3>
            <ul className="space-y-4 text-left max-w-md mx-auto mb-8">
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="font-serif text-base text-cream-muted">
                  Personalized "Why this matters to you" insights based on your Moon Sign.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="font-serif text-base text-cream-muted">
                  Exclusive lunar rituals tailored to your current energy.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="font-serif text-base text-cream-muted">
                  Your daily "Peak Energy Window" for productivity.
                </span>
              </li>
            </ul>
            <button
              onClick={onUpgradeClick}
              className="inline-flex items-center gap-2 px-8 py-4 font-display text-sm tracking-widest uppercase bg-primary text-primary-foreground rounded-xl shadow-glow hover:shadow-gold transition-all duration-500"
            >
              <Crown className="w-4 h-4" />
              Unlock Sovereign Access
            </button>
          </div>
        </div>
      )}
    </GlassmorphismCard>
  );
};

export default DailyRitual;
