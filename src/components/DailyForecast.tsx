import { Lock, Sparkles } from "lucide-react";
import { CurrentMoonData } from "@/lib/currentMoon";
import { useLunarForecast } from "@/hooks/useLunarForecast";
import GlassmorphismCard from "./GlassmorphismCard";
import { Skeleton } from "./ui/skeleton";

interface DailyForecastProps {
  birthMoonSign: string;
  currentMoon: CurrentMoonData;
  isPro: boolean;
  onUpgradeClick: () => void;
}

const DailyForecast = ({ birthMoonSign, currentMoon, isPro, onUpgradeClick }: DailyForecastProps) => {
  const { forecast, loading } = useLunarForecast(birthMoonSign, currentMoon);

  if (loading) {
    return (
      <GlassmorphismCard size="lg">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl tracking-widest text-foreground uppercase">
            Daily Lunar Forecast
          </h2>
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <Skeleton className="h-20 w-full" />
          <div className="grid md:grid-cols-2 gap-6 pt-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </GlassmorphismCard>
    );
  }

  if (!forecast) {
    return null;
  }

  return (
    <GlassmorphismCard size="lg" className={isPro ? "shadow-glow" : ""}>
      <div className="flex items-center justify-center gap-3 mb-8">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl tracking-widest text-foreground uppercase">
          Daily Lunar Forecast
        </h2>
        <Sparkles className="w-5 h-5 text-primary" />
      </div>

      {/* Moon Comparison Header - Always visible */}
      <div className="flex items-center justify-center gap-8 mb-8">
        <div className="text-center">
          <p className="font-display text-xs text-primary/60 uppercase tracking-widest mb-2">
            Your Birth Moon
          </p>
          <p className="font-display text-xl text-primary">
            {birthMoonSign}
          </p>
        </div>
        <div className="text-2xl text-primary/40">⟷</div>
        <div className="text-center">
          <p className="font-display text-xs text-primary/60 uppercase tracking-widest mb-2">
            Today's Moon
          </p>
          <p className="font-display text-xl text-primary">
            {currentMoon.sign}
          </p>
        </div>
      </div>

      {isPro ? (
        /* UNLOCKED - Full Forecast */
        <>
          {/* Headline */}
          <div className="mb-8 text-center">
            <p className="font-display text-xs text-primary/60 uppercase tracking-widest mb-3">
              {currentMoon.phaseEmoji} {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h3 className="sanctuary-text text-gold-gradient italic leading-relaxed">
              {forecast.headline}
            </h3>
          </div>

          {/* Forecast Body with Phase Modifier */}
          <div className="mb-8">
            <p className="font-serif text-lg text-cream-muted leading-relaxed text-center max-w-3xl mx-auto">
              {forecast.forecast}
              {forecast.phaseModifier && (
                <span className="block mt-4 text-primary/80 italic">
                  {forecast.phaseModifier}
                </span>
              )}
            </p>
          </div>

          {/* Energy & Focus */}
          <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-primary/10">
            <div className="text-center">
              <p className="font-display text-xs text-primary/60 uppercase tracking-widest mb-2">
                Today's Energy
              </p>
              <p className="font-display text-xl text-primary capitalize">
                {forecast.energy}
              </p>
            </div>
            <div className="text-center">
              <p className="font-display text-xs text-primary/60 uppercase tracking-widest mb-2">
                Lucky Focus
              </p>
              <p className="font-serif text-lg text-cream-muted capitalize">
                {forecast.luckyFocus}
              </p>
            </div>
          </div>
        </>
      ) : (
        /* LOCKED - Blurred Preview */
        <div className="relative">
          {/* Blurred content */}
          <div className="blur-md opacity-50 pointer-events-none select-none">
            <div className="mb-8 text-center">
              <p className="font-display text-xs text-primary/60 uppercase tracking-widest mb-3">
                {currentMoon.phaseEmoji} Today's Forecast
              </p>
              <h3 className="sanctuary-text text-gold-gradient italic leading-relaxed">
                {forecast.headline}
              </h3>
            </div>

            <div className="mb-8">
              <p className="font-serif text-lg text-cream-muted leading-relaxed text-center max-w-3xl mx-auto">
                {forecast.forecast}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-primary/10">
              <div className="text-center">
                <p className="font-display text-xs text-primary/60 uppercase tracking-widest mb-2">
                  Today's Energy
                </p>
                <p className="font-display text-xl text-primary capitalize">
                  {forecast.energy}
                </p>
              </div>
              <div className="text-center">
                <p className="font-display text-xs text-primary/60 uppercase tracking-widest mb-2">
                  Lucky Focus
                </p>
                <p className="font-serif text-lg text-cream-muted capitalize">
                  {forecast.luckyFocus}
                </p>
              </div>
            </div>
          </div>

          {/* Overlay with unlock prompt */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
            <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center mb-6 shadow-glow">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-xl text-gold-gradient mb-3 text-center px-4">
              Unlock Your Daily Forecast
            </h3>
            <p className="font-serif text-base text-cream-muted mb-6 text-center max-w-sm px-4">
              Discover how today's moon interacts with your birth moon
            </p>
            <button
              onClick={onUpgradeClick}
              className="inline-flex items-center gap-2 px-8 py-3 font-display text-sm tracking-widest uppercase glass-card shadow-glow hover:shadow-gold text-primary transition-all duration-500 rounded-xl"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}
    </GlassmorphismCard>
  );
};

export default DailyForecast;
