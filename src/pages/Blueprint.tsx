import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

import { safeLunarIntelligence, safeTimeUntilNextSign } from "@/lib/safeLunar";
import MoonCalculationFallback from "@/components/MoonCalculationFallback";
import CalculationBoundary from "@/components/CalculationBoundary";
import { getSignSymbol } from "@/lib/forecastEngine";
import { Lock, Sparkles, Crown, Clock, ExternalLink, Moon, Star, Info, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import MoonLoader from "@/components/MoonLoader";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import SEO from "@/components/SEO";
import PricingModal from "@/components/PricingModal";
import MoonSignModal from "@/components/MoonSignModal";
import EducationModal from "@/components/EducationModal";
import { INNER_CIRCLE, PHASE_GUIDANCE } from "@/lib/innerCircleDictionary";

import DailyForecast from "@/components/DailyForecast";
import BlueprintIdentity from "@/components/BlueprintIdentity";
import BlueprintPreviewCard from "@/components/BlueprintPreviewCard";
import LuminaryGate from "@/components/LuminaryGate";
import SetPasswordStep, { needsPassword } from "@/components/SetPasswordStep";
import NamePrompt, { hasAskedForName } from "@/components/NamePrompt";
import { clearPendingMoonSign, loadPendingMoonSign } from "@/lib/pendingMoonSign";
import { requestBlueprintEmail } from "@/lib/blueprintEmail";
import { hasVisitedBlueprint, markBlueprintVisited } from "@/lib/blueprintVisit";
import ShareNudgeCard from "@/components/ShareNudgeCard";
import {
  parseShareNudge,
  recordNudgeDismissed,
  recordNudgeShown,
  recordShareClick,
  shouldShowShareNudge,
  type ShareNudgeState,
} from "@/lib/shareNudge";
import DailyRitual from "@/components/DailyRitual";
import GreatCycleSection from "@/components/GreatCycleSection";
import LunarSignatureSection from "@/components/LunarSignatureSection";
import VoidIntervalSection from "@/components/VoidIntervalSection";
import LunarReturnCard from "@/components/sovereign/LunarReturnCard";
import type { ZodiacSign } from "@/lib/sovereignEngine";
import ClimateGauge from "@/components/ClimateGauge";
import FirstRunOnboarding from "@/components/FirstRunOnboarding";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateSunSign } from "@/lib/moonSign";
import { fetchCombinationProfile } from "@/services/combinationService";
import type { CombinationProfile } from "@/types";

interface UserProfile {
  first_name?: string | null;
  moon_sign: string | null;
  natal_moon_sign?: string | null;
  natal_sun_sign?: string | null;
  birthday: string | null;
  subscription_status: string | null;
  is_subscriber: boolean;
}

const Blueprint = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session, subscription, checkSubscription } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [timeUntilTransition, setTimeUntilTransition] = useState("");
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [moonSignModalOpen, setMoonSignModalOpen] = useState(false);
  const [todaysMoonModalOpen, setTodaysMoonModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [combinationProfile, setCombinationProfile] = useState<CombinationProfile | null>(null);
  
  // Unified lunar intelligence. Never throws — a failed ephemeris read leaves
  // `lunar` null and surfaces an informative fallback instead of a blank page.
  const [lunarState, setLunarState] = useState(() => safeLunarIntelligence());
  const [retrying, setRetrying] = useState(false);
  const lunar = lunarState.data;
  
  // Dev tier override wins in DEV builds; tree-shaken in production.
  const devOverride = import.meta.env.DEV
    ? (typeof window !== "undefined" ? localStorage.getItem("moonday.devTierOverride") : null)
    : null;
  const isPro = devOverride === "free"
    ? false
    : devOverride === "sovereign"
      ? true
      : (userProfile?.subscription_status === 'sovereign' ||
         userProfile?.is_subscriber === true ||
         subscription.subscribed);
  const success = searchParams.get("success") === "true";

  // The displayed moon sign - either from profile or temp lookup
  const displayedMoonSign = userProfile?.natal_moon_sign || userProfile?.moon_sign;
  const displayedSunSign = userProfile?.natal_sun_sign || (userProfile?.birthday ? calculateSunSign(new Date(`${userProfile.birthday.split("T")[0]}T12:00:00`)) : null);

  // Display name: first_name from the profile or auth metadata. Never the email; with no name the greeting is just "Welcome".
  const userName =
    userProfile?.first_name?.trim() ||
    (user?.user_metadata?.first_name as string | undefined)?.trim() ||
    null;
  const [nameAnswered, setNameAnswered] = useState(false);
  const passwordPending = needsPassword(user);
  // First time this member opens their Blueprint on this device: "Welcome, <name>"; after that "Welcome back, <name>".
  const blueprintReady = !!user && !passwordPending && !profileLoading && !!userProfile && !!displayedMoonSign;
  const firstVisitRef = useRef<boolean | null>(null);
  if (firstVisitRef.current === null && blueprintReady && user) {
    firstVisitRef.current = !hasVisitedBlueprint(user.id);
  }
  useEffect(() => {
    if (blueprintReady && user) markBlueprintVisited(user.id);
  }, [blueprintReady, user]);
  // Share-your-Moon-sign nudge: kept per account, shown only once the name prompt has been saved or skipped.
  const [nudgeState, setNudgeState] = useState<ShareNudgeState>(() => parseShareNudge(user?.user_metadata?.share_nudge));
  const [nudgeVisit, setNudgeVisit] = useState<"idle" | "visible" | "closed">("idle");
  const nudgeDecided = useRef(false);
  const showNamePrompt =
    !!user && !passwordPending && !profileLoading && !!userProfile && !userName && !nameAnswered && !hasAskedForName(user.id);
  // Decided once per visit (the ref keeps a re-render with fresh nudge state from deciding again).
  useEffect(() => {
    if (nudgeDecided.current || !blueprintReady || showNamePrompt || !user) return;
    nudgeDecided.current = true;
    if (!shouldShowShareNudge(nudgeState, user.created_at)) {
      setNudgeVisit("closed");
      return;
    }
    setNudgeVisit("visible");
    void recordNudgeShown(nudgeState).then(setNudgeState);
  }, [blueprintReady, showNamePrompt, user, nudgeState]);

  // Fetch user profile with birth moon sign
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("first_name, moon_sign, birthday, subscription_status, is_subscriber, natal_sun_sign, natal_moon_sign")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching profile:", error);
        } else {
          setUserProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // A member whose Moon sign is still open (a Moon-change birthday) gets it settled here: the quiz result this
  // browser kept for their birthday is applied, otherwise they take the quiz on their own birthday.
  const settlingRef = useRef(false);
  useEffect(() => {
    if (!user || passwordPending || profileLoading || !userProfile || settlingRef.current) return;
    if (!userProfile.birthday || userProfile.natal_moon_sign || userProfile.moon_sign) return;
    settlingRef.current = true;
    const birthday = userProfile.birthday.split("T")[0];
    const pending = loadPendingMoonSign();
    if (!pending || pending.birthday !== birthday) {
      navigate("/transition-quiz", { replace: true });
      return;
    }
    (async () => {
      const sunSign = userProfile.natal_sun_sign || calculateSunSign(birthday);
      const { error } = await supabase
        .from("user_profiles")
        .update({ moon_sign: pending.sign, natal_moon_sign: pending.sign, natal_sun_sign: sunSign })
        .eq("user_id", user.id);
      if (error) {
        navigate("/transition-quiz", { replace: true });
        return;
      }
      clearPendingMoonSign();
      setUserProfile((p) => (p ? { ...p, moon_sign: pending.sign, natal_moon_sign: pending.sign, natal_sun_sign: sunSign } : p));
      void requestBlueprintEmail();
    })();
  }, [user, passwordPending, profileLoading, userProfile, navigate]);

  // Fetch combination profile for Layer 1 — Blueprint Identity
  useEffect(() => {
    const sunSign = userProfile?.natal_sun_sign || displayedSunSign;
    const moonSign = userProfile?.natal_moon_sign || displayedMoonSign;

    if (!sunSign || !moonSign) {
      setCombinationProfile(null);
      return;
    }

    let isMounted = true;

    const loadCombinationProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("combination_profiles")
          .select("combination_title, luminous_expression, combination_synthesis, solar_essence, lunar_essence, shadow_synthesis, default_behaviors")
          .eq("sun_sign", sunSign)
          .eq("moon_sign", moonSign)
          .maybeSingle();

        if (!isMounted) return;

        if (!error && data && data.combination_title) {
          setCombinationProfile({
            sun_sign: sunSign,
            moon_sign: moonSign,
            combination_title: data.combination_title,
            luminous_expression: data.luminous_expression as string[] | string | null,
            combination_synthesis: data.combination_synthesis,
            solar_essence: data.solar_essence,
            lunar_essence: data.lunar_essence,
            shadow_synthesis: data.shadow_synthesis,
            default_behaviors: Array.isArray(data.default_behaviors) ? data.default_behaviors : [],
          });
        } else {
          const fallback = await fetchCombinationProfile(sunSign, moonSign);
          if (isMounted) setCombinationProfile(fallback);
        }
      } catch (err) {
        console.error("Failed to load combination profile:", err);
        const fallback = await fetchCombinationProfile(sunSign, moonSign);
        if (isMounted) setCombinationProfile(fallback);
      }
    };

    loadCombinationProfile();

    return () => {
      isMounted = false;
    };
  }, [userProfile?.natal_sun_sign, userProfile?.natal_moon_sign, displayedSunSign, displayedMoonSign]);

  // Update lunar data periodically
  useEffect(() => {
    const update = () => setLunarState(safeLunarIntelligence());
    const interval = setInterval(update, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  // Update transition timer
  useEffect(() => {
    const updateTimer = () => {
      const result = safeTimeUntilNextSign();
      setTimeUntilTransition(result.ok ? result.data : "");
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  // Manual recalculation after a failed reading.
  const retryLunar = () => {
    setRetrying(true);
    const next = safeLunarIntelligence();
    setLunarState(next);
    const timer = safeTimeUntilNextSign();
    setTimeUntilTransition(timer.ok ? timer.data : "");
    setRetrying(false);
  };


  // Refresh subscription and profile on success
  useEffect(() => {
    if (success && user) {
      checkSubscription().then(async () => {
        // Re-fetch profile to get updated subscription_status
        const { data } = await supabase
          .from("user_profiles")
          .select("moon_sign, birthday, subscription_status, is_subscriber")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) setUserProfile(data);
      });
    }
  }, [success, checkSubscription, user]);

  const handleManageSubscription = async () => {
    if (!session) return;
    
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleOpenPricing = () => {
    if (!session) {
      navigate("/login");
      return;
    }
    setPricingModalOpen(true);
  };

  const handleSelectPlan = async (priceId: string) => {
    if (!session) return;
    
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Map lunar engine data to CurrentMoonData format for DailyForecast compatibility
  const moonDataCompat = lunar
    ? {
        sign: lunar.sign.name,
        symbol: lunar.sign.symbol,
        element: lunar.sign.element,
        phase: lunar.phase.name,
        illumination: lunar.phase.illumination,
        phaseEmoji: lunar.phase.emoji as string,
      }
    : null;

  // Dynamic SEO & Structured Data per current transiting moon sign
  const currentSign = lunar?.sign.name || "Aries";
  const natalSign = displayedMoonSign || "natal";
  const seoTitle = "Your Blueprint | Moonday Live";
  const seoDescription = `The Moon is in ${currentSign}. Discover what this transit means for your ${natalSign} energy today. Get your personalized lunar reading at Moonday Live.`;

  const todayIso = new Date().toISOString().split("T")[0];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://moondaylive.com/#app",
        name: "Moonday Live",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "All",
        url: "https://moondaylive.com/blueprint",
        description:
          "Conscious astrology web application tracking real-time lunar transits, circadian rhythms, and personalized natal lunar signatures.",
      },
      {
        "@type": "Article",
        "@id": `https://moondaylive.com/blueprint#moon-${currentSign.toLowerCase()}`,
        isPartOf: { "@id": "https://moondaylive.com/#app" },
        headline: `Moon in ${currentSign} Today — What It Means For You`,
        name: `Moon in ${currentSign} Today`,
        description: seoDescription,
        url: "https://moondaylive.com/blueprint",
        datePublished: todayIso,
        dateModified: new Date().toISOString(),
        inLanguage: "en-US",
        author: {
          "@type": "Organization",
          name: "Moonday Live",
          url: "https://moondaylive.com",
        },
        publisher: {
          "@type": "Organization",
          name: "Moonday Live",
          url: "https://moondaylive.com",
          logo: {
            "@type": "ImageObject",
            url: "https://moondaylive.com/moonday-logo.png",
          },
        },
        mainEntityOfPage: "https://moondaylive.com/blueprint",
        about: {
          "@type": "Thing",
          name: `Moon in ${currentSign}`,
          description: `Astrological transit of the Moon through the zodiac sign of ${currentSign}`,
        },
      },
    ],
  };

  // Accounts made from the birthday + email step choose their password first, right after confirming.
  if (passwordPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative">
        <SEO title={seoTitle} description={seoDescription} canonical="https://moondaylive.com/blueprint" noindex />
        <Navigation />
        <main className="flex-1 pt-[68px] pb-10 px-4 sm:px-6 relative z-20">
          <SetPasswordStep />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical="https://moondaylive.com/blueprint"
        schema={structuredData}
      />
      {/* Decorative stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold-pale rounded-full animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>
      <Navigation />
      
      <main className="flex-1 flex flex-col items-start pt-[68px] pb-6 px-6 relative z-20">
        <div className="max-w-5xl mx-auto w-full">
          {/* Success Message */}
          {success && (
            <GlassmorphismCard className="mb-6 text-center animate-fade-up" size="sm">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Crown className="w-6 h-6 text-primary" />
                <span className="font-display text-xl text-primary tracking-wider">Welcome, Luminary!</span>
              </div>
              <p className="font-serif text-lg text-cream-muted">
                Your lunar journey has begun. All premium features are now unlocked.
              </p>
            </GlassmorphismCard>
          )}

          {showNamePrompt && user && (
            <NamePrompt
              userId={user.id}
              onDone={(name) => {
                setNameAnswered(true);
                if (name) setUserProfile((p) => (p ? { ...p, first_name: name } : p));
              }}
            />
          )}

          <FirstRunOnboarding />

          {/* Welcome Header */}
          <div className="text-center mb-4 animate-fade-up stagger-1">
            <div className="flex items-center justify-center gap-3 mb-3">
              {isPro && (
                <span className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="font-display text-sm text-primary uppercase tracking-widest">Luminary Member</span>
                </span>
              )}
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-gold-gradient tracking-wider mb-2">
              Your Blueprint
            </h2>
            <p className="font-serif text-lg md:text-xl text-cream-muted">
              {userName ? (firstVisitRef.current === false ? `Welcome back, ${userName}` : `Welcome, ${userName}`) : "Welcome"}
            </p>
          </div>

          {/* Dashboard Grid - Birth Moon & Today's Moon */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
            {/* Birth Moon Sign */}
            <GlassmorphismCard className="animate-fade-up stagger-1">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Moon className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg tracking-widest text-foreground uppercase">
                  Your Birth Moon
                </h2>
              </div>
              
              {profileLoading ? (
                <div className="flex flex-col items-center py-8">
                  <Skeleton className="w-16 h-16 rounded-full mb-6" />
                  <Skeleton className="h-8 w-32 mb-3" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ) : displayedMoonSign ? (
                <div className="flex flex-col items-center py-8">
                  <span className="text-6xl text-primary font-display mb-6">
                    {getSignSymbol(displayedMoonSign)}
                  </span>
                  <p className="font-display text-3xl text-primary mb-3">
                    {displayedMoonSign}
                  </p>
                  <p className="font-serif text-lg text-muted-foreground">
                    Your Natal Moon
                  </p>
                </div>
              ) : null}

              {displayedMoonSign && (
                <div className="border-t border-primary/10 pt-6 mt-auto">
                  <button
                    onClick={() => setMoonSignModalOpen(true)}
                    className="w-full group inline-flex items-center justify-between gap-2 px-5 py-3 rounded-xl btn-lime font-sans text-[15px] md:text-base font-medium normal-case tracking-normal transition-all duration-300 min-h-[56px] text-left leading-snug"
                  >
                    <span>Your Emotional Blueprint, Set at Birth</span>
                    <ChevronRight className="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
                  </button>
                </div>
              )}
            </GlassmorphismCard>

            {/* Today's Moon */}
            <GlassmorphismCard className="animate-fade-up stagger-2">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Star className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg tracking-widest text-foreground uppercase">
                  Today's Moon
                </h2>
              </div>

              {lunar ? (
                <>
                  <div className="flex flex-col items-center py-8">
                    <span className="text-6xl text-primary font-display mb-6">{lunar.sign.symbol}</span>
                    <p className="font-display text-3xl text-primary mb-3">
                      {lunar.sign.name}
                    </p>
                    <p className="font-serif text-lg text-muted-foreground mb-4">
                      {lunar.phase.name} • {lunar.phase.illumination}%
                    </p>
                    <div className="flex items-center justify-center gap-3 text-cream-muted">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="font-serif text-lg">
                        Next sign in{" "}
                        <span className="text-primary font-display">
                          {timeUntilTransition || "—"}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-primary/10 pt-6 mt-auto">
                    <button
                      onClick={() => setTodaysMoonModalOpen(true)}
                      className="w-full group inline-flex items-center justify-between gap-2 px-5 py-3 rounded-xl btn-lime font-sans text-[15px] md:text-base font-medium normal-case tracking-normal transition-all duration-300 min-h-[56px] text-left leading-snug"
                    >
                      <span>About Today's Moon Energy</span>
                      <ChevronRight className="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
                    </button>
                  </div>
                </>
              ) : (
                <MoonCalculationFallback
                  bare
                  title="Today's Moon is unavailable"
                  message={lunarState.error ?? undefined}
                  onRetry={retryLunar}
                  retrying={retrying}
                />
              )}
            </GlassmorphismCard>

          </div>

          {nudgeVisit === "visible" && displayedMoonSign && (
            <ShareNudgeCard
              sign={displayedMoonSign}
              onShareClick={(method, completed) => void recordShareClick("nudge", method, completed).then(setNudgeState)}
              onDismiss={() => {
                setNudgeVisit("closed");
                void recordNudgeDismissed(nudgeState).then(setNudgeState);
              }}
            />
          )}

          {/* Share Your Moon CTA */}
          {displayedMoonSign && (
            <div className="mt-8 flex justify-center animate-fade-up stagger-2">
              <button
                onClick={() => navigate("/my-moon-card")}
                className="group inline-flex items-center justify-between gap-2 px-5 py-3 rounded-xl btn-lime font-sans text-[15px] md:text-base font-medium normal-case tracking-normal transition-all duration-300 min-h-[56px] text-left leading-snug"
              >
                <span>Share Your Moon Sign</span>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
              </button>
            </div>
          )}

          {/* Layer 1 — Blueprint Identity (Archetype Reveal) */}
          {combinationProfile && (
            <div className="mt-12 animate-fade-up stagger-2">
              <BlueprintIdentity
                profile={combinationProfile}
                currentMoonSign={lunar?.sign.name}
                isPro={isPro}
              />

              {/* Free tier: preview of the full Blueprint right after the archetype reveal. The upgrade card comes after all free content, below. */}
              {!isPro && (
                <div className="mt-8 animate-fade-up">
                  <BlueprintPreviewCard
                    combinationSynthesis={combinationProfile.combination_synthesis}
                  />
                </div>
              )}
            </div>
          )}

          {/* Layer 2 & 3 — Daily Forecast (Transit Bridge & Triad Activation) */}
          {displayedMoonSign && moonDataCompat && (
            <div className="mt-12 animate-fade-up stagger-3">
              <CalculationBoundary scope="DailyForecast" title="Today's forecast is unavailable">
                <DailyForecast
                  birthMoonSign={displayedMoonSign}
                  currentMoon={moonDataCompat}
                  natalSunSign={displayedSunSign}
                  isPro={isPro}
                  showGate={false}
                  onUpgradeClick={handleOpenPricing}
                  onSelectPlan={handleSelectPlan}
                  checkoutLoading={checkoutLoading}
                />
              </CalculationBoundary>
            </div>
          )}

          {/* The one upgrade card: directly after the last free section, once the profile has confirmed this is not a Luminary member */}
          {!isPro && userProfile && displayedMoonSign && (
            <div className="animate-fade-up">
              <LuminaryGate
                currentMoonSign={lunar?.sign.name || displayedMoonSign || "Current"}
                birthMoonSign={displayedMoonSign || "Birth"}
                onPrimaryClick={() => navigate("/pricing")}
                onSelectPlan={handleSelectPlan}
                onUnlockClick={handleOpenPricing}
                loading={checkoutLoading}
              />
            </div>
          )}

          {/* Lunar sections — Luminary only */}
          {isPro && lunar ? (
            <CalculationBoundary scope="LunarSections" title="Your lunar readings are unavailable">
              {/* Daily Ritual */}
              <div className="mt-12 animate-fade-up stagger-3">
                <DailyRitual
                  currentMoonSign={lunar.sign.name}
                  birthMoonSign={displayedMoonSign || null}
                  moonPhase={lunar.phase.name}
                  isPro={isPro}
                  onUpgradeClick={handleOpenPricing}
                />
              </div>

              {/* Emotional Climate Gauge (Today's Frequency) */}
              <div className="mt-12">
                <ClimateGauge illumination={lunar.phase.illumination} sign={lunar.sign.name} />
              </div>

              {/* === LUNAR INTELLIGENCE SECTIONS === */}

              {/* 1. The Great Cycle (Phases) */}
              <div className="mt-12">
                <GreatCycleSection lunar={lunar} isSubscriber={userProfile?.is_subscriber ?? false} onUpgradeClick={handleOpenPricing} />
              </div>

              {/* 2. The Lunar Signature (Signs) */}
              <div className="mt-12">
                <LunarSignatureSection
                  lunar={lunar}
                  isPro={userProfile?.is_subscriber ?? false}
                  onUpgradeClick={handleOpenPricing}
                />
              </div>

              {/* 3. Lunar Signal (VoC) */}
              <div className="mt-12">
                <VoidIntervalSection
                  lunar={lunar}
                  isPro={userProfile?.is_subscriber ?? false}
                  onUpgradeClick={handleOpenPricing}
                />
              </div>
            </CalculationBoundary>
          ) : isPro && !lunar ? (
            <div className="mt-12">
              <MoonCalculationFallback
                title="Your lunar readings are unavailable"
                message={lunarState.error ?? undefined}
                onRetry={retryLunar}
                retrying={retrying}
              />
            </div>
          ) : null}


          {/* Lunar Return Tracker — Sovereign only */}
          {isPro && displayedMoonSign && (
            <div className="mt-12 animate-fade-up">
              <LunarReturnCard natalMoon={displayedMoonSign as ZodiacSign} />
            </div>
          )}

          {/* Manage Subscription (Pro only) */}
          {isPro && (
            <div className="mt-12 text-center animate-fade-up stagger-4">
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="inline-flex items-center gap-3 font-serif text-lg text-cream-muted elegant-hover"
              >
                {portalLoading ? (
                  <MoonLoader size="sm" />
                ) : (
                  <>
                    <ExternalLink className="w-5 h-5" />
                    Manage Subscription
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <PricingModal
        open={pricingModalOpen}
        onOpenChange={setPricingModalOpen}
        onSelectPlan={handleSelectPlan}
        loading={checkoutLoading}
      />

      <MoonSignModal
        isOpen={moonSignModalOpen}
        onClose={() => setMoonSignModalOpen(false)}
        moonSign={displayedMoonSign || null}
      />

      {lunar && (() => {
        const phaseKey = Object.keys(PHASE_GUIDANCE).find((k) =>
          lunar.phase.name.toLowerCase().includes(k.toLowerCase())
        ) || "New";
        const phaseG = PHASE_GUIDANCE[phaseKey];
        const signG = INNER_CIRCLE[lunar.sign.name] || INNER_CIRCLE.Aries;
        return (
          <EducationModal
            isOpen={todaysMoonModalOpen}
            onClose={() => setTodaysMoonModalOpen(false)}
            eyebrow="Today's Moon"
            title={`Moon in ${lunar.sign.name}`}
            symbol={lunar.sign.symbol}
            subtitle={`${lunar.phase.name} • ${lunar.phase.illumination}% illuminated • Next sign in ${timeUntilTransition || "—"}`}
            intro={`Today's lunar weather blends the ${lunar.phase.name} phase with the ${lunar.sign.name} signature. Together they shape the emotional tone of your day across mind, soul, and body.`}
            sections={[
              { label: `Mind · ${lunar.sign.name}`, body: signG.psychological },
              { label: `Soul · ${lunar.phase.name} Phase`, body: phaseG.spiritual },
              { label: `Body · ${lunar.sign.name}`, body: signG.material },
            ]}
            closing="Read the sky. Move with intention."
          />
        );
      })()}
    </div>
  );
};

export default Blueprint;
