import { useMemo, type ReactNode } from "react";
import { ChevronRight, ExternalLink, Moon, Sun } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import MoonLoader from "@/components/MoonLoader";
import BlueprintIdentity from "@/components/BlueprintIdentity";
import BlueprintPreviewCard from "@/components/BlueprintPreviewCard";
import LuminaryGate from "@/components/LuminaryGate";
import LunarReturnCard from "@/components/sovereign/LunarReturnCard";
import { LockedSectionPreview, getLockedPreview } from "@/components/DailyForecast";
import { Skeleton } from "@/components/ui/skeleton";
import { BackToTop, NATAL_TOP_ID, SectionIndex, type IndexEntry } from "@/components/blueprint/SectionIndex";
import { getSignSymbol } from "@/lib/forecastEngine";
import type { ZodiacSign } from "@/lib/sovereignEngine";
import type { CombinationProfile } from "@/types";

interface NatalTabProps {
  profileLoading: boolean;
  natalMoon: string | null;
  combinationProfile: CombinationProfile | null;
  currentMoonSign?: string | null;
  isPro: boolean;
  /** Free member whose profile has loaded: the single upgrade card goes after the free sections */
  showUpgrade: boolean;
  onOpenMoonSign: () => void;
  onShareMoonSign: () => void;
  onUpgradeClick: () => void;
  onPrimaryUpgrade: () => void;
  onSelectPlan: (priceId: string) => Promise<void> | void;
  checkoutLoading: boolean;
  onManageSubscription: () => void;
  portalLoading: boolean;
  /** Shown right under the Birth Moon section (the share nudge, when it is due) */
  afterBirthMoon?: ReactNode;
}

const buttonClass =
  "w-full group inline-flex items-center justify-between gap-2 px-5 py-3 rounded-xl btn-lime font-sans text-[15px] md:text-base font-medium normal-case tracking-normal transition-all duration-300 min-h-[56px] text-left leading-snug";

const hasChips = (v: CombinationProfile["luminous_expression"]) =>
  Array.isArray(v) ? v.some((t) => String(t).trim()) : typeof v === "string" && v.trim().length > 0;

/**
 * My Blueprint: permanent, natal. The combination title is the hero (shown once), then a "Jump to" index and the
 * sections in their current wording. Free sections first, then the one upgrade card with a faded preview.
 */
const NatalTab = ({
  profileLoading,
  natalMoon,
  combinationProfile: profile,
  currentMoonSign,
  isPro,
  showUpgrade,
  onOpenMoonSign,
  onShareMoonSign,
  onUpgradeClick,
  onPrimaryUpgrade,
  onSelectPlan,
  checkoutLoading,
  onManageSubscription,
  portalLoading,
  afterBirthMoon,
}: NatalTabProps) => {
  const entries = useMemo<IndexEntry[]>(() => {
    const list: IndexEntry[] = [];
    if (profile && hasChips(profile.luminous_expression)) list.push({ id: "bp-strengths", label: "Strengths" });
    if (natalMoon) list.push({ id: "bp-birth-moon", label: "Birth Moon" });
    if (profile && isPro && profile.combination_synthesis) list.push({ id: "bp-synthesis", label: "Synthesis" });
    if (profile && isPro && (profile.solar_essence || profile.lunar_essence)) list.push({ id: "bp-essence", label: "Essence" });
    if (profile && !isPro && profile.combination_synthesis) list.push({ id: "bp-preview", label: "Preview" });
    if (isPro && natalMoon) list.push({ id: "bp-lunar-return", label: "Lunar Return" });
    return list;
  }, [profile, isPro, natalMoon]);

  const peekText = profile?.solar_essence || profile?.lunar_essence || null;
  const peekTitle = profile?.solar_essence ? "Natal Sun · Conscious Drive" : "Natal Moon · Instinctual Sanctuary";
  const PeekIcon = profile?.solar_essence ? Sun : Moon;

  return (
    <div role="tabpanel" id="blueprint-panel-blueprint" aria-labelledby="blueprint-tab-blueprint" className="space-y-6 pt-6">
      <div id={NATAL_TOP_ID} className="scroll-mt-32 space-y-6">
        {profile && <BlueprintIdentity profile={profile} section="hero" currentMoonSign={currentMoonSign} isPro={isPro} className="animate-fade-up" />}
        {entries.length > 1 && <SectionIndex entries={entries} />}
      </div>

      {profile && hasChips(profile.luminous_expression) && (
        <>
          <BlueprintIdentity profile={profile} section="strengths" sectionId="bp-strengths" isPro={isPro} />
          <BackToTop />
        </>
      )}

      {/* Birth Moon */}
      <GlassmorphismCard size="md" className="animate-fade-up">
        <div id="bp-birth-moon" className="scroll-mt-32 space-y-5">
          <div className="flex items-center justify-center gap-2">
            <Moon className="w-5 h-5 text-primary" aria-hidden="true" />
            <h2 className="font-display text-lg tracking-widest text-foreground uppercase text-center">Your Birth Moon</h2>
          </div>

          {profileLoading ? (
            <div className="flex flex-col items-center py-4">
              <Skeleton className="w-16 h-16 rounded-full mb-4" />
              <Skeleton className="h-8 w-32 mb-3" />
              <Skeleton className="h-5 w-24" />
            </div>
          ) : natalMoon ? (
            <div className="flex flex-col items-center py-2">
              <span className="text-6xl text-primary font-display mb-4" aria-hidden="true">
                {getSignSymbol(natalMoon)}
              </span>
              <p className="font-display text-3xl text-primary mb-2">{natalMoon}</p>
              <p className="font-serif text-lg text-muted-foreground">Your Natal Moon</p>
            </div>
          ) : null}

          {natalMoon && (
            <div className="border-t border-primary/10 pt-5 space-y-3">
              <button type="button" onClick={onOpenMoonSign} className={buttonClass}>
                <span>Your Emotional Blueprint, Set at Birth</span>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-80" aria-hidden="true" />
              </button>
              <button type="button" onClick={onShareMoonSign} className={buttonClass}>
                <span>Share Your Moon Sign</span>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-80" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </GlassmorphismCard>
      <BackToTop />

      {afterBirthMoon}

      {/* Free: the opening of the synthesis. Luminary: the full synthesis. */}
      {profile && !isPro && profile.combination_synthesis && (
        <>
          <div id="bp-preview" className="scroll-mt-32">
            <BlueprintPreviewCard combinationSynthesis={profile.combination_synthesis} />
          </div>
          <BackToTop />
        </>
      )}
      {profile && isPro && profile.combination_synthesis && (
        <>
          <BlueprintIdentity profile={profile} section="synthesis" sectionId="bp-synthesis" isPro />
          <BackToTop />
        </>
      )}
      {profile && isPro && (profile.solar_essence || profile.lunar_essence) && (
        <>
          <BlueprintIdentity profile={profile} section="essence" sectionId="bp-essence" isPro />
          <BackToTop />
        </>
      )}

      {/* The one upgrade card: after every free section, with a faded peek at the first locked one */}
      {showUpgrade && (
        <>
          {peekText && (
            <LockedSectionPreview icon={<PeekIcon className="w-4 h-4 text-primary" />} title={peekTitle}>
              <p className="font-serif text-base md:text-lg text-cream-muted leading-relaxed text-left">
                {getLockedPreview(peekText)}
              </p>
            </LockedSectionPreview>
          )}
          <LuminaryGate
            currentMoonSign={currentMoonSign || "Current"}
            birthMoonSign={natalMoon || "Birth"}
            onPrimaryClick={onPrimaryUpgrade}
            onSelectPlan={onSelectPlan}
            onUnlockClick={onUpgradeClick}
            loading={checkoutLoading}
          />
        </>
      )}

      {isPro && natalMoon && (
        <>
          <div id="bp-lunar-return" className="scroll-mt-32">
            <LunarReturnCard natalMoon={natalMoon as ZodiacSign} />
          </div>
          <BackToTop />
          <div className="text-center">
            <button
              type="button"
              onClick={onManageSubscription}
              disabled={portalLoading}
              className="inline-flex items-center justify-center gap-3 min-h-11 px-3 font-serif text-lg text-cream-muted elegant-hover"
            >
              {portalLoading ? (
                <MoonLoader size="sm" />
              ) : (
                <>
                  <ExternalLink className="w-5 h-5" aria-hidden="true" />
                  Manage Subscription
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default NatalTab;
