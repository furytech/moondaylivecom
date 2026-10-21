import React from "react";
import { Sparkles, Activity, Heart, Compass, Eye, Shield, Lock } from "lucide-react";
import { CurrentMoonData } from "@/lib/currentMoon";
import { useLunarForecast, TriadData } from "@/hooks/useLunarForecast";
import { getTransitBridge } from "@/lib/transitBridge";
import { SIGN_ELEMENT, SIGN_MODALITY, ZodiacSign } from "@/lib/sovereignEngine";
import GlassmorphismCard from "./GlassmorphismCard";
import { Skeleton } from "./ui/skeleton";
import LuminaryGate from "./LuminaryGate";
import { stripBodyClaimsFromRecord } from "@/lib/dailyContentGuard";

export function getBodyPreview(text?: string | null): { preview: string; blurredRemainder: string } {
  if (!text) return { preview: "", blurredRemainder: "" };
  const sentences = text
    .replace(/([.!?])\s+/g, "$1|SPLIT|")
    .split("|SPLIT|")
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    return {
      preview: sentences.join(" "),
      blurredRemainder: "Steady focus channels your momentum into balanced progress across every step of the day.",
    };
  }

  return {
    preview: sentences.slice(0, 2).join(" "),
    blurredRemainder: sentences.slice(2).join(" "),
  };
}

/** First few words of the first sentence: enough to tease a locked section without shipping it. */
export function getLockedPreview(text?: string | null, words = 8): string {
  if (!text) return "";
  const firstSentence = text.trim().split(/(?<=[.!?])\s+/)[0] ?? "";
  const parts = firstSentence.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return `${parts.slice(0, words).join(" ").replace(/[.,;:!?]+$/, "")}…`;
}

/** The first locked section for free members: a heading and a faded line, directly under the last free content. */
export const LockedSectionPreview: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon,
  title,
  children,
}) => (
  <div
    data-testid="locked-section-preview"
    className="relative overflow-hidden rounded-xl p-4 sm:p-5 md:p-6 bg-navy-medium/30 border border-primary/10"
  >
    <div className="flex items-center justify-center gap-2 mb-3 text-primary text-center">
      {icon}
      <h3 className="font-display text-xs uppercase tracking-widest text-primary font-medium text-center">{title}</h3>
      <Lock className="w-3.5 h-3.5 shrink-0 text-primary/70" aria-label="Locked for Luminary" />
    </div>
    {children}
    <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-navy-dark via-navy-dark/80 to-transparent pointer-events-none" />
  </div>
);

interface DailyForecastProps {
  birthMoonSign: string;
  currentMoon: CurrentMoonData;
  natalSunSign?: string | null;
  triadData?: TriadData | null;
  isPro?: boolean;
  onUpgradeClick?: () => void;
  onSelectPlan?: (priceId: string) => Promise<void> | void;
  checkoutLoading?: boolean;
  showGate?: boolean;
}

const DailyForecast: React.FC<DailyForecastProps> = ({
  birthMoonSign,
  currentMoon,
  natalSunSign,
  triadData: propTriadData,
  isPro = true,
  onUpgradeClick,
  onSelectPlan,
  checkoutLoading = false,
  showGate = true,
}) => {
  const { forecast: rawForecast, triadData: hookTriadData, loading } = useLunarForecast(
    birthMoonSign,
    currentMoon,
    natalSunSign
  );

  const forecast = rawForecast ? stripBodyClaimsFromRecord(rawForecast) : rawForecast;

  const natalElement = SIGN_ELEMENT[birthMoonSign as ZodiacSign] || "Water";
  const natalModality = SIGN_MODALITY[birthMoonSign as ZodiacSign] || "Cardinal";
  const transitBridge = getTransitBridge(natalElement, natalModality, currentMoon.sign);

  if (loading) {
    return (
      <GlassmorphismCard size="md" flush>
        <div className="flex items-center justify-center gap-3 mb-5">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg sm:text-xl tracking-wider sm:tracking-widest text-foreground uppercase text-center">
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

  if (!forecast && !propTriadData && !hookTriadData) {
    return null;
  }

  // Daily content never makes body, health or medical claims: a stored line that does is not shown.
  const rawTriad = propTriadData || hookTriadData || rawForecast?.triadData;
  const activeTriad = rawTriad ? stripBodyClaimsFromRecord(rawTriad) : rawTriad;
  const hasTriadData = Boolean(
    activeTriad &&
      (activeTriad.physical_guidance ||
        activeTriad.emotional_guidance ||
        activeTriad.spiritual_guidance ||
        activeTriad.daily_ritual)
  );

  return (
    <GlassmorphismCard size="md" flush>
      <div className="flex items-center justify-center gap-3 mb-5">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg sm:text-xl tracking-wider sm:tracking-widest text-foreground uppercase text-center">
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
            <div className="mb-5 max-w-2xl mx-auto">
              <p className="font-serif italic text-lg md:text-xl text-cream-muted leading-relaxed text-left">
                {transitBridge}
              </p>
            </div>
          )}

          {/* Morning Read: Physical -> Emotional -> Spiritual Flow */}
          <div className="space-y-5 mb-6">
            {/* 2. Physical guidance */}
            {activeTriad.physical_guidance && (
              <div className="rounded-xl p-4 sm:p-5 md:p-6 bg-navy-medium/30 border border-primary/10">
                <div className="flex items-center justify-center gap-2 mb-3 text-primary text-center">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="font-display text-xs uppercase tracking-widest text-primary font-medium text-center">
                    Your energy today
                  </h3>
                </div>
                {isPro ? (
                  <p className="font-serif text-base md:text-lg text-cream-muted leading-relaxed text-left">
                    {activeTriad.physical_guidance}
                  </p>
                ) : (
                  <div className="relative overflow-hidden pb-1">
                    <p className="font-serif text-base md:text-lg text-cream-muted leading-relaxed text-left">
                      <span>{getBodyPreview(activeTriad.physical_guidance).preview}</span>{" "}
                      {getBodyPreview(activeTriad.physical_guidance).blurredRemainder && (
                        <span className="blur-[4px] select-none opacity-30 pointer-events-none inline-block">
                          {getBodyPreview(activeTriad.physical_guidance).blurredRemainder}
                        </span>
                      )}
                    </p>
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-navy-dark via-navy-dark/40 to-transparent pointer-events-none" />
                  </div>
                )}
              </div>
            )}

            {/* Free members: a faded peek at the first locked section, then the single upgrade card */}
            {!isPro && activeTriad.emotional_guidance && (
              <LockedSectionPreview icon={<Heart className="w-4 h-4 text-primary" />} title="Your emotional field">
                <p className="font-serif text-base md:text-lg text-cream-muted leading-relaxed text-left">
                  {getLockedPreview(activeTriad.emotional_guidance)}
                </p>
              </LockedSectionPreview>
            )}

            {/* Gate Component rendered immediately after the Body preview fade for free users */}
            {!isPro && showGate && (
              <LuminaryGate
                currentMoonSign={currentMoon.sign}
                birthMoonSign={birthMoonSign}
                onSelectPlan={onSelectPlan}
                onUnlockClick={onUpgradeClick}
                loading={checkoutLoading}
              />
            )}

            {/* Luminary only: Emotional & Deeper Invitation */}
            {isPro && (
              <>
                {/* 3. Emotional guidance */}
                {activeTriad.emotional_guidance && (
                  <div className="rounded-xl p-4 sm:p-5 md:p-6 bg-navy-medium/30 border border-primary/10">
                    <div className="flex items-center justify-center gap-2 mb-3 text-primary text-center">
                      <Heart className="w-4 h-4 text-primary" />
                      <h3 className="font-display text-xs uppercase tracking-widest text-primary font-medium text-center">
                        Your emotional field
                      </h3>
                    </div>
                    <p className="font-serif text-base md:text-lg text-cream-muted leading-relaxed text-left">
                      {activeTriad.emotional_guidance}
                    </p>
                  </div>
                )}

                {/* 4. Spiritual guidance */}
                {activeTriad.spiritual_guidance && (
                  <div className="rounded-xl p-4 sm:p-5 md:p-6 bg-navy-medium/30 border border-primary/10">
                    <div className="flex items-center justify-center gap-2 mb-3 text-primary text-center">
                      <Compass className="w-4 h-4 text-primary" />
                      <h3 className="font-display text-xs uppercase tracking-widest text-primary font-medium text-center">
                        The deeper invitation
                      </h3>
                    </div>
                    <p className="font-serif text-base md:text-lg text-cream-muted leading-relaxed text-left">
                      {activeTriad.spiritual_guidance}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Luminary only: 5. Daily ritual, 6. Divider, 7. Shadow, 8. Integration */}
          {isPro && (
            <>
              {/* 5. Daily ritual — styled as a distinct "practice" takeaway block */}
              {activeTriad.daily_ritual && (
                <div className="mb-8 rounded-xl p-4 sm:p-6 bg-primary/10 border border-primary/30 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-center gap-2.5 mb-3 text-primary text-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="font-display text-sm uppercase tracking-widest font-semibold text-primary text-center">
                      Today's practice
                    </h3>
                  </div>
                  <p className="font-serif text-lg md:text-xl text-cream leading-relaxed font-light text-left">
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
                  <div className="rounded-xl p-4 sm:p-5 md:p-6 bg-navy-medium/15 border border-primary/10">
                    <div className="flex items-center justify-center gap-2 mb-3 text-primary/80 text-center">
                      <Eye className="w-4 h-4 text-primary/80" />
                      <h3 className="font-display text-xs uppercase tracking-widest text-primary/80 font-medium text-center">
                        What to watch for
                      </h3>
                    </div>
                    <p className="font-serif text-base text-cream-muted/90 leading-relaxed text-left">
                      {activeTriad.shadow_activation}
                    </p>
                  </div>
                )}

                {activeTriad.integration_invitation && (
                  <div className="rounded-xl p-4 sm:p-5 md:p-6 bg-navy-medium/15 border border-primary/10">
                    <div className="flex items-center justify-center gap-2 mb-3 text-primary/80 text-center">
                      <Shield className="w-4 h-4 text-primary/80" />
                      <h3 className="font-display text-xs uppercase tracking-widest text-primary/80 font-medium text-center">
                        The integration opportunity
                      </h3>
                    </div>
                    <p className="font-serif text-base text-cream-muted/90 leading-relaxed text-left">
                      {activeTriad.integration_invitation}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
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
              {isPro ? (
                <p className="font-serif text-lg text-cream-muted leading-relaxed text-left max-w-3xl mx-auto">
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
              ) : (
                <div className="relative overflow-hidden max-w-3xl mx-auto text-center pb-2">
                  <p className="font-serif text-lg text-cream-muted leading-relaxed text-left">
                    <span>{getBodyPreview(forecast.forecast).preview}</span>{" "}
                    {getBodyPreview(forecast.forecast).blurredRemainder && (
                      <span className="blur-[4px] select-none opacity-30 pointer-events-none inline-block">
                        {getBodyPreview(forecast.forecast).blurredRemainder}
                      </span>
                    )}
                  </p>
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-navy-dark via-navy-dark/40 to-transparent pointer-events-none" />
                </div>
              )}
            </div>

            {!isPro && (
              <LockedSectionPreview icon={<Sparkles className="w-4 h-4 text-primary" />} title="Today's energy and focus">
                <div className="space-y-2 pt-1" aria-hidden="true">
                  <div className="h-3 w-3/4 rounded-md bg-primary/20" />
                  <div className="h-3 w-1/2 rounded-md bg-primary/15" />
                </div>
              </LockedSectionPreview>
            )}

            {!isPro && showGate && (
              <LuminaryGate
                currentMoonSign={currentMoon.sign}
                birthMoonSign={birthMoonSign}
                onSelectPlan={onSelectPlan}
                onUnlockClick={onUpgradeClick}
                loading={checkoutLoading}
              />
            )}

            {/* Energy & Focus */}
            {isPro && (
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
            )}
          </div>
        )
      )}
    </GlassmorphismCard>
  );
};

export default DailyForecast;
