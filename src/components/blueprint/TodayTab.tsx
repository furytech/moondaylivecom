import { useMemo, useState, type ReactNode } from "react";
import { ChevronRight, Clock } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import CalculationBoundary from "@/components/CalculationBoundary";
import MoonCalculationFallback from "@/components/MoonCalculationFallback";
import DailyForecast from "@/components/DailyForecast";
import LuminaryGate from "@/components/LuminaryGate";
import DailyRitual from "@/components/DailyRitual";
import ClimateGauge from "@/components/ClimateGauge";
import GreatCycleSection from "@/components/GreatCycleSection";
import LunarSignatureSection from "@/components/LunarSignatureSection";
import VoidIntervalSection from "@/components/VoidIntervalSection";
import { TriadStateLine } from "@/components/BlueprintIdentity";
import type { LunarIntelligence } from "@/lib/lunarEngine";
import type { CurrentMoonData } from "@/lib/currentMoon";
import { getNextMoonSign } from "@/lib/currentMoon";
import { comeBackLine } from "@/lib/comeBack";

interface TodayTabProps {
  lunar: LunarIntelligence | null;
  lunarError: string | null;
  retrying: boolean;
  onRetry: () => void;
  timeUntilTransition: string;
  moonData: CurrentMoonData | null;
  natalMoon: string | null;
  natalSun: string | null;
  isPro: boolean;
  /** Free member whose profile has loaded: the single upgrade card goes after the free content */
  showUpgrade: boolean;
  timezone: string;
  onOpenTodaysMoon: () => void;
  onUpgradeClick: () => void;
  onPrimaryUpgrade: () => void;
  onSelectPlan: (priceId: string) => Promise<void> | void;
  checkoutLoading: boolean;
  /** Shown right under Today's Moon (the share nudge, when it is due) */
  afterMoon?: ReactNode;
}

const buttonClass =
  "w-full group inline-flex items-center justify-between gap-2 px-5 py-3 rounded-xl btn-lime font-sans text-[15px] md:text-base font-medium normal-case tracking-normal transition-all duration-300 min-h-[56px] text-left leading-snug";

/** Luminary's deeper daily readings, one tap away so the tab stays short. */
const MoreForToday = ({ lunar, natalMoon, onUpgradeClick }: { lunar: LunarIntelligence; natalMoon: string | null; onUpgradeClick: () => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={buttonClass}>
        <span>{open ? "Show less for today" : "More for today"}</span>
        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <CalculationBoundary scope="LunarSections" title="Your lunar readings are unavailable">
          <DailyRitual
            currentMoonSign={lunar.sign.name}
            birthMoonSign={natalMoon}
            moonPhase={lunar.phase.name}
            isPro
            onUpgradeClick={onUpgradeClick}
          />
          <div className="mt-6">
            <ClimateGauge illumination={lunar.phase.illumination} sign={lunar.sign.name} />
          </div>
          <div className="mt-6">
            <GreatCycleSection lunar={lunar} isSubscriber onUpgradeClick={onUpgradeClick} />
          </div>
          <div className="mt-6">
            <LunarSignatureSection lunar={lunar} isPro onUpgradeClick={onUpgradeClick} />
          </div>
        </CalculationBoundary>
      )}
    </div>
  );
};

/**
 * Today: what changes every day, quick to read. Free content first (the Moon, how it meets your Moon, the forecast),
 * then the one upgrade card with its faded preview, then a closing line that brings you back tomorrow.
 */
const TodayTab = ({
  lunar,
  lunarError,
  retrying,
  onRetry,
  timeUntilTransition,
  moonData,
  natalMoon,
  natalSun,
  isPro,
  showUpgrade,
  timezone,
  onOpenTodaysMoon,
  onUpgradeClick,
  onPrimaryUpgrade,
  onSelectPlan,
  checkoutLoading,
  afterMoon,
}: TodayTabProps) => {
  const nextMoon = useMemo(() => getNextMoonSign(), [lunar?.sign.name]);
  const comeBack = comeBackLine(nextMoon.sign, nextMoon.ingressAt, new Date(), timezone);

  return (
    <div role="tabpanel" id="blueprint-panel-today" aria-labelledby="blueprint-tab-today" className="space-y-6 pt-6">
      {/* Today's Moon */}
      <GlassmorphismCard size="sm" className="animate-fade-up">
        {lunar ? (
          <div className="space-y-5">
            <div className="flex items-center gap-5">
              <span className="text-6xl leading-none text-primary font-display" aria-hidden="true">
                {lunar.sign.symbol}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="font-display text-xs uppercase tracking-[0.25em] text-primary/80 text-left">Today's Moon</p>
                <h2 className="font-display text-3xl text-primary leading-tight text-left">{lunar.sign.name}</h2>
                <p className="font-serif text-base text-muted-foreground text-left">
                  {lunar.phase.name} • {lunar.phase.illumination}%
                </p>
                <p className="flex items-center gap-2 font-serif text-base text-cream-muted text-left">
                  <Clock className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>
                    Next sign in <span className="text-primary font-display">{timeUntilTransition || "—"}</span>
                  </span>
                </p>
              </div>
            </div>
            <button type="button" onClick={onOpenTodaysMoon} className={buttonClass}>
              <span>About Today's Moon Energy</span>
              <ChevronRight className="w-4 h-4 shrink-0 opacity-80" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <MoonCalculationFallback
            bare
            title="Today's Moon is unavailable"
            message={lunarError ?? undefined}
            onRetry={onRetry}
            retrying={retrying}
          />
        )}
      </GlassmorphismCard>

      {afterMoon}

      {/* How today's Moon meets yours */}
      {natalMoon && natalSun && lunar && (
        <TriadStateLine sunSign={natalSun} moonSign={natalMoon} transitSign={lunar.sign.name} />
      )}

      {natalMoon && moonData && (
        <CalculationBoundary scope="DailyForecast" title="Today's forecast is unavailable">
          <DailyForecast
            birthMoonSign={natalMoon}
            currentMoon={moonData}
            natalSunSign={natalSun}
            isPro={isPro}
            showGate={false}
            onUpgradeClick={onUpgradeClick}
            onSelectPlan={onSelectPlan}
            checkoutLoading={checkoutLoading}
          />
        </CalculationBoundary>
      )}

      {/* The one upgrade card: after the last free content */}
      {showUpgrade && (
        <LuminaryGate
          currentMoonSign={lunar?.sign.name || "Current"}
          birthMoonSign={natalMoon || "Birth"}
          onPrimaryClick={onPrimaryUpgrade}
          onSelectPlan={onSelectPlan}
          onUnlockClick={onUpgradeClick}
          loading={checkoutLoading}
        />
      )}

      {/* Luminary: the Lunar Signal while the Moon is void, then the deeper readings on request */}
      {isPro && lunar && (
        <CalculationBoundary scope="LunarSignal" title="Your lunar signal is unavailable">
          {lunar.voidOfCourse && <VoidIntervalSection lunar={lunar} isPro onUpgradeClick={onUpgradeClick} />}
          <div className={lunar.voidOfCourse ? "mt-6" : ""}>
            <MoreForToday lunar={lunar} natalMoon={natalMoon} onUpgradeClick={onUpgradeClick} />
          </div>
        </CalculationBoundary>
      )}

      <p className="font-serif text-base text-cream-muted text-left leading-relaxed pb-2">{comeBack}</p>
    </div>
  );
};

export default TodayTab;
