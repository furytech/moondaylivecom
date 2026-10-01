import React from "react";
import { Sparkles, Activity, Heart, Compass, Eye, Shield } from "lucide-react";
import { CurrentMoonData } from "@/lib/currentMoon";
import { useLunarForecast, TriadData } from "@/hooks/useLunarForecast";
import { getTransitBridge } from "@/lib/transitBridge";
import { SIGN_ELEMENT, SIGN_MODALITY, ZodiacSign } from "@/lib/sovereignEngine";
import GlassmorphismCard from "./GlassmorphismCard";
import { Skeleton } from "./ui/skeleton";

interface DailyForecastProps {
  birthMoonSign: string;
  currentMoon: CurrentMoonData;
  natalSunSign?: string | null;
  triadData?: TriadData | null;
}

const DailyForecast: React.FC<DailyForecastProps> = ({
  birthMoonSign,
  currentMoon,
  natalSunSign,
  triadData: propTriadData,
}) => {
  const { forecast, triadData: hookTriadData, loading } = useLunarForecast(
    birthMoonSign,
    currentMoon,
    natalSunSign
  );

  const natalElement = SIGN_ELEMENT[birthMoonSign as ZodiacSign] || "Water";
  const natalModality = SIGN_MODALITY[birthMoonSign as ZodiacSign] || "Cardinal";
  const transitBridge = getTransitBridge(natalElement, natalModality, currentMoon.sign);

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
          <div className="grid lg:grid-cols-2 gap-6 pt-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </GlassmorphismCard>
    );
  }

  if (!forecast && !propTriadData) {
    return null;
  }

  const activeTriad = propTriadData || hookTriadData || forecast?.triadData;
  const hasTriadData = Boolean(
    activeTriad &&
      (activeTriad.physical_guidance ||
        activeTriad.emotional_guidance ||
        activeTriad.spiritual_guidance ||
        activeTriad.daily_ritual)
  );

  return (
    <GlassmorphismCard size="lg">
      <div className="flex items-center justify-center gap-3 mb-8">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl tracking-widest text-foreground uppercase">
          Daily Lunar Forecast
        </h2>
        <Sparkles className="w-5 h-5 text-primary" />
      </div>

      {/* Moon Comparison Header */}
      <div className="flex items-center justify-center gap-8 mb-6">
        <div className="text-center">
          <p className="font-display text-xs text-primary/90 uppercase tracking-widest mb-1.5">
            {natalSunSign ? `${natalSunSign} Sun • ${birthMoonSign} Moon` : "Your Birth Moon"}
          </p>
          <p className="font-display text-xl text-primary font-medium">
            {birthMoonSign}
          </p>
        </div>
        <div className="text-2xl text-primary/40">⟷</div>
        <div className="text-center">
          <p className="font-display text-xs text-primary/90 uppercase tracking-widest mb-1.5">
            Today's Moon
          </p>
          <p className="font-display text-xl text-primary font-medium">
            {currentMoon.sign}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TRIAD ACTIVATION LAYOUT (8-STEP ORDER)
          Shown when Triad data is available for this Sun/Moon/Transit.
         ───────────────────────────────────────────────────────────── */}
      {hasTriadData && activeTriad ? (
        <div className="animate-fade-up">
          {/* 1. Transit bridge sentence (italic) between sign header and physical guidance */}
          {transitBridge && (
            <div className="mb-8 text-center max-w-2xl mx-auto px-4">
              <p className="font-serif italic text-lg md:text-xl text-cream-muted leading-relaxed">
                {transitBridge}
              </p>
            </div>
          )}

          {/* Morning Read: Physical -> Emotional -> Spiritual Flow */}
          <div className="space-y-5 mb-8">
            {/* 2. Physical guidance */}
            {activeTriad.physical_guidance && (
              <div className="rounded-xl p-5 md:p-6 bg-navy-medium/30 border border-primary/10">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="font-display text-xs uppercase tracking-widest text-primary font-medium">
                    Your body today
                  </span>
                </div>
                <p className="font-serif text-base md:text-lg text-cream-muted leading-relaxed">
                  {activeTriad.physical_guidance}
                </p>
              </div>
            )}

            {/* 3. Emotional guidance */}
            {activeTriad.emotional_guidance && (
              <div className="rounded-xl p-5 md:p-6 bg-navy-medium/30 border border-primary/10">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="font-display text-xs uppercase tracking-widest text-primary font-medium">
                    Your emotional field
                  </span>
                </div>
                <p className="font-serif text-base md:text-lg text-cream-muted leading-relaxed">
                  {activeTriad.emotional_guidance}
                </p>
              </div>
            )}

            {/* 4. Spiritual guidance */}
            {activeTriad.spiritual_guidance && (
              <div className="rounded-xl p-5 md:p-6 bg-navy-medium/30 border border-primary/10">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <Compass className="w-4 h-4 text-primary" />
                  <span className="font-display text-xs uppercase tracking-widest text-primary font-medium">
                    The deeper invitation
                  </span>
                </div>
                <p className="font-serif text-base md:text-lg text-cream-muted leading-relaxed">
                  {activeTriad.spiritual_guidance}
                </p>
              </div>
            )}
          </div>

          {/* 5. Daily ritual — styled as a distinct "practice" takeaway block */}
          {activeTriad.daily_ritual && (
            <div className="mb-10 rounded-xl p-6 bg-primary/10 border border-primary/30 shadow-lg relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-3 text-primary">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-display text-sm uppercase tracking-widest font-semibold text-primary">
                  Today's practice
                </span>
              </div>
              <p className="font-serif text-lg md:text-xl text-cream leading-relaxed font-light">
                {activeTriad.daily_ritual}
              </p>
            </div>
          )}

          {/* 6. Subtle Divider between Practice and Shadow Layer */}
          <div className="relative my-8 border-t border-primary/15">
            <div className="absolute left-1/2 -top-3 -translate-x-1/2 px-4 bg-navy-dark text-xs font-display tracking-widest uppercase text-cream-muted/70">
              Shadow & Integration
            </div>
          </div>

          {/* Shadow Layer: 7. Shadow activation & 8. Integration invitation */}
          <div className="grid md:grid-cols-2 gap-5 pt-2">
            {activeTriad.shadow_activation && (
              <div className="rounded-xl p-5 md:p-6 bg-navy-medium/15 border border-primary/10">
                <div className="flex items-center gap-2 mb-2 text-primary/80">
                  <Eye className="w-4 h-4 text-primary/80" />
                  <span className="font-display text-xs uppercase tracking-widest text-primary/80 font-medium">
                    What to watch for
                  </span>
                </div>
                <p className="font-serif text-base text-cream-muted/90 leading-relaxed">
                  {activeTriad.shadow_activation}
                </p>
              </div>
            )}

            {activeTriad.integration_invitation && (
              <div className="rounded-xl p-5 md:p-6 bg-navy-medium/15 border border-primary/10">
                <div className="flex items-center gap-2 mb-2 text-primary/80">
                  <Shield className="w-4 h-4 text-primary/80" />
                  <span className="font-display text-xs uppercase tracking-widest text-primary/80 font-medium">
                    The integration opportunity
                  </span>
                </div>
                <p className="font-serif text-base text-cream-muted/90 leading-relaxed">
                  {activeTriad.integration_invitation}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
           BACKWARDS COMPATIBILITY FALLBACK LAYOUT
           Rendered only when Triad data is absent.
           ───────────────────────────────────────────────────────────── */
        forecast && (
          <div className="animate-fade-up">
            {/* Headline */}
            <div className="mb-8 text-center">
              <p className="font-display text-xs text-primary/90 uppercase tracking-widest mb-3">
                {currentMoon.phaseEmoji}{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
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
                {forecast.integrationInvitation && (
                  <span className="block mt-3 text-cream-muted/90 italic text-base">
                    ✦ {forecast.integrationInvitation}
                  </span>
                )}
              </p>
            </div>

            {/* Energy & Focus */}
            <div className="grid lg:grid-cols-2 gap-6 pt-6 border-t border-primary/10">
              <div className="text-center">
                <p className="font-display text-xs text-primary/90 uppercase tracking-widest mb-2">
                  Today's Energy
                </p>
                <p className="font-display text-xl text-primary capitalize">
                  {forecast.energy}
                </p>
              </div>
              <div className="text-center">
                <p className="font-display text-xs text-primary/90 uppercase tracking-widest mb-2">
                  Lucky Focus
                </p>
                <p className="font-display text-xl text-primary capitalize">
                  {forecast.luckyFocus}
                </p>
              </div>
            </div>
          </div>
        )
      )}
    </GlassmorphismCard>
  );
};

export default DailyForecast;
