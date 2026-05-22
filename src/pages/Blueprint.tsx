import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

import { getLunarIntelligence, getTimeUntilNextSign } from "@/lib/lunarEngine";
import { getSignSymbol } from "@/lib/forecastEngine";
import { Lock, Sparkles, Crown, Clock, ExternalLink, Moon, Star, Info } from "lucide-react";
import { useEffect, useState } from "react";
import MoonLoader from "@/components/MoonLoader";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import SEO from "@/components/SEO";
import PricingModal from "@/components/PricingModal";
import MoonSignModal from "@/components/MoonSignModal";
import EducationModal from "@/components/EducationModal";
import { INNER_CIRCLE, PHASE_GUIDANCE } from "@/lib/innerCircleDictionary";

import DailyForecast from "@/components/DailyForecast";
import DailyRitual from "@/components/DailyRitual";
import GreatCycleSection from "@/components/GreatCycleSection";
import LunarSignatureSection from "@/components/LunarSignatureSection";
import VoidIntervalSection from "@/components/VoidIntervalSection";
import ClimateGauge from "@/components/ClimateGauge";
import { Skeleton } from "@/components/ui/skeleton";
import { MoonSignResult } from "@/lib/moonSign";

interface UserProfile {
  moon_sign: string | null;
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
  
  // Unified lunar intelligence
  const [lunar, setLunar] = useState(() => getLunarIntelligence());
  
  // Temporary moon sign for users who use the lookup form but don't have a saved profile
  const [tempMoonSign, setTempMoonSign] = useState<string | null>(null);
  
  const isPro =
    userProfile?.subscription_status === 'sovereign' ||
    userProfile?.is_subscriber === true ||
    subscription.subscribed;
  const success = searchParams.get("success") === "true";

  // The displayed moon sign - either from profile or temp lookup
  const displayedMoonSign = userProfile?.moon_sign || tempMoonSign;

  // Extract name from email
  const userName = user?.email?.split("@")[0] || "Cosmic Traveler";

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
          .select("moon_sign, birthday, subscription_status, is_subscriber")
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

  // Update lunar data periodically
  useEffect(() => {
    const update = () => setLunar(getLunarIntelligence());
    const interval = setInterval(update, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  // Update transition timer
  useEffect(() => {
    const updateTimer = () => {
      const { hours, minutes } = getTimeUntilNextSign();
      setTimeUntilTransition(`${hours}h ${minutes}m`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const handleMoonSignCalculated = async (result: MoonSignResult & { birthDate: Date; birthTime?: string; birthCity?: string }) => {
    setTempMoonSign(result.sign);

    if (!user) return;

    // Save birthday + moon sign for EVERY logged-in user (free or Sovereign).
    // Birth time and city stay Sovereign-only since they require precision calc.
    const updatePayload: Record<string, string> = {
      moon_sign: result.sign,
      birthday: result.birthDate.toISOString().split("T")[0],
    };
    if (isPro && result.birthTime) updatePayload.birth_time = result.birthTime;
    if (isPro && result.birthCity) updatePayload.birth_city = result.birthCity;

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update(updatePayload)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error saving profile:", error);
      } else {
        setUserProfile((prev) => ({
          ...prev,
          moon_sign: result.sign,
          birthday: updatePayload.birthday,
          subscription_status: prev?.subscription_status ?? "free",
          is_subscriber: prev?.is_subscriber ?? false,
        }));
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  // Map lunar engine data to CurrentMoonData format for DailyForecast compatibility
  const moonDataCompat = {
    sign: lunar.sign.name,
    symbol: lunar.sign.symbol,
    element: lunar.sign.element,
    phase: lunar.phase.name,
    illumination: lunar.phase.illumination,
    phaseEmoji: lunar.phase.emoji as string,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <SEO
        title="Your Lunar Blueprint — Moonday Live"
        description="Your personalized lunar blueprint: today's phase, sign, and the rituals tuned to your unique signature."
        noindex
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
                <span className="font-display text-xl text-primary tracking-wider">Welcome, Sovereign!</span>
              </div>
              <p className="font-serif text-lg text-cream-muted">
                Your lunar journey has begun. All premium features are now unlocked.
              </p>
            </GlassmorphismCard>
          )}

          {/* Welcome Header */}
          <div className="text-center mb-4 animate-fade-up stagger-1">
            <div className="flex items-center justify-center gap-3 mb-3">
              {isPro && (
                <span className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="font-display text-sm text-primary uppercase tracking-widest">Sovereign Member</span>
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-gold-gradient tracking-wider mb-2">
              Your Blueprint
            </h1>
            <p className="font-serif text-lg md:text-xl text-cream-muted">
              Welcome back, {userName}
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
                    className="w-full group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[hsl(245_100%_88%/0.45)] bg-[hsl(245_100%_88%/0.06)] hover:bg-[hsl(245_100%_88%/0.12)] hover:border-[hsl(245_100%_88%/0.75)] hover:shadow-[0_0_24px_hsl(var(--primary)/0.35)] text-[hsl(245_100%_90%)] hover:text-primary-foreground font-display text-sm uppercase tracking-widest transition-all duration-300 min-h-[64px] text-center leading-tight"
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
                    Next sign in <span className="text-primary font-display">{timeUntilTransition}</span>
                  </span>
                </div>
              </div>

              <div className="border-t border-primary/10 pt-6 mt-auto">
                <button
                  onClick={() => setTodaysMoonModalOpen(true)}
                  className="w-full group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[hsl(245_100%_88%/0.45)] bg-[hsl(245_100%_88%/0.06)] hover:bg-[hsl(245_100%_88%/0.12)] hover:border-[hsl(245_100%_88%/0.75)] hover:shadow-[0_0_24px_hsl(var(--primary)/0.35)] text-[hsl(245_100%_90%)] hover:text-primary-foreground font-display text-sm uppercase tracking-widest transition-all duration-300 min-h-[64px] text-center leading-tight"
                >
                  <span>About Today's Moon Energy</span>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
                </button>
              </div>
            </GlassmorphismCard>
          </div>

          {/* Daily Forecast */}
          {displayedMoonSign && (
            <div className="mt-12 animate-fade-up stagger-3">
              <DailyForecast
                birthMoonSign={displayedMoonSign}
                currentMoon={moonDataCompat}
              />
            </div>
          )}

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

          {/* Emotional Climate Gauge */}
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

          {/* 3. Between Phases (VoC) */}
          <div className="mt-12">
            <VoidIntervalSection
              lunar={lunar}
              isPro={userProfile?.is_subscriber ?? false}
              onUpgradeClick={handleOpenPricing}
            />
          </div>

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

      {(() => {
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
            subtitle={`${lunar.phase.name} • ${lunar.phase.illumination}% illuminated • Next sign in ${timeUntilTransition}`}
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
