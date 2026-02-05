import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import moonLogo from "@/assets/moon-logo-new.png";
import { getCurrentMoon, CurrentMoonData } from "@/lib/currentMoon";
import { getDailyRitual, getNextTransitionTime } from "@/lib/dailyRitual";
import { getSignSymbol } from "@/lib/forecastEngine";
import { Lock, Sparkles, Crown, Clock, ExternalLink, Moon, Star, Info } from "lucide-react";
import { useEffect, useState } from "react";
import MoonLoader from "@/components/MoonLoader";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import PricingModal from "@/components/PricingModal";
import MoonSignModal from "@/components/MoonSignModal";
import MoonSignLookup from "@/components/MoonSignLookup";
import DailyForecast from "@/components/DailyForecast";
import { Skeleton } from "@/components/ui/skeleton";
import { MoonSignResult } from "@/lib/moonSign";

interface UserProfile {
  moon_sign: string | null;
  birthday: string | null;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [moonData, setMoonData] = useState<CurrentMoonData>(getCurrentMoon());
  
  // Temporary moon sign for users who use the lookup form but don't have a saved profile
  const [tempMoonSign, setTempMoonSign] = useState<string | null>(null);
  
  const dailyRitual = getDailyRitual(moonData.sign);
  const isPro = subscription.subscribed;
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
          .select("moon_sign, birthday")
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

  // Update moon data at midnight or on mount
  useEffect(() => {
    const updateMoonData = () => {
      setMoonData(getCurrentMoon());
    };

    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Update at midnight
    const midnightTimer = setTimeout(() => {
      updateMoonData();
      // Then update every 24 hours
      const dailyInterval = setInterval(updateMoonData, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, []);

  // Refresh subscription on success
  useEffect(() => {
    if (success) {
      checkSubscription();
    }
  }, [success, checkSubscription]);

  // Calculate time until next moon transition
  useEffect(() => {
    const updateTimer = () => {
      const nextTransition = getNextTransitionTime();
      const now = new Date();
      const diff = nextTransition.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilTransition(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

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
      navigate("/portal");
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
        window.open(data.url, "_blank");
        setPricingModalOpen(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleMoonSignCalculated = async (result: MoonSignResult & { birthDate: Date; birthTime?: string; birthCity?: string }) => {
    // For all users, show the moon sign immediately
    setTempMoonSign(result.sign);

    // For Pro users with full data, also save to profile
    if (isPro && result.birthTime && result.birthCity && user) {
      try {
        const { error } = await supabase
          .from("user_profiles")
          .update({
            moon_sign: result.sign,
            birthday: result.birthDate.toISOString().split('T')[0],
            birth_time: result.birthTime,
            birth_city: result.birthCity,
          })
          .eq("user_id", user.id);

        if (error) {
          console.error("Error saving profile:", error);
        } else {
          // Refresh the profile
          setUserProfile({
            moon_sign: result.sign,
            birthday: result.birthDate.toISOString().split('T')[0],
          });
        }
      } catch (err) {
        console.error("Failed to save profile:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Decorative stars background - lowest z-index */}
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
      
      {/* Main content - above stars */}
      <main className="flex-1 flex flex-col items-center pt-20 pb-6 px-6 relative z-20">
        <div className="max-w-5xl mx-auto w-full">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="animate-float">
              <div 
                onClick={() => navigate("/")} 
                className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden cursor-pointer hover-scale-subtle bg-background logo-halo"
              >
                <img 
                  src={moonLogo} 
                  alt="Moonday" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <GlassmorphismCard className="mb-10 text-center animate-fade-up" size="sm">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Crown className="w-6 h-6 text-primary" />
                <span className="font-display text-xl text-primary tracking-wider">Welcome to Pro!</span>
              </div>
              <p className="font-serif text-lg text-cream-muted">
                Your lunar journey has begun. All premium features are now unlocked.
              </p>
            </GlassmorphismCard>
          )}

          {/* Welcome Header */}
          <div className="text-center mb-16 animate-fade-up stagger-1">
            <div className="flex items-center justify-center gap-3 mb-6">
              {isPro && (
                <span className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="font-display text-sm text-primary uppercase tracking-widest">Pro Member</span>
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-gold-gradient tracking-wider mb-4">
              Your Blueprint
            </h1>
            <p className="font-serif text-2xl text-cream-muted">
              Welcome back, {userName}
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
            {/* Birth Moon Sign - Left Card */}
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
              ) : (
                /* Moon Sign Lookup Form */
                <div className="py-4">
                  <p className="font-serif text-base text-cream-muted text-center mb-6">
                    Enter your birth details to discover your moon sign
                  </p>
                  <MoonSignLookup
                    onMoonSignCalculated={handleMoonSignCalculated}
                    isPro={isPro}
                    onUpgradeClick={handleOpenPricing}
                  />
                </div>
              )}

              {displayedMoonSign && (
                <div className="border-t border-primary/10 pt-6 mt-4">
                  <button
                    onClick={() => setMoonSignModalOpen(true)}
                    className="w-full group flex items-center justify-center gap-2 font-serif text-lg text-cream-muted hover:text-primary transition-colors"
                  >
                    <span>Your emotional blueprint, set at birth</span>
                    <Info className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              )}
            </GlassmorphismCard>

            {/* Current Moon Sign - Right Card */}
            <GlassmorphismCard className="animate-fade-up stagger-2">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Star className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg tracking-widest text-foreground uppercase">
                  Today's Moon
                </h2>
              </div>
              
              <div className="flex flex-col items-center py-8">
                <span className="text-6xl text-primary font-display mb-6">{moonData.symbol}</span>
                <p className="font-display text-3xl text-primary mb-3">
                  {moonData.sign}
                </p>
                <p className="font-serif text-lg text-muted-foreground">
                  {moonData.phase} • {moonData.illumination}%
                </p>
              </div>

              <div className="border-t border-primary/10 pt-6 mt-4">
                <div className="flex items-center justify-center gap-3 text-cream-muted">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-serif text-lg">
                    Next sign in <span className="text-primary font-display">{timeUntilTransition}</span>
                  </span>
                </div>
              </div>
            </GlassmorphismCard>
          </div>

          {/* Daily Forecast Section - Show for everyone who has a moon sign */}
          {displayedMoonSign && (
            <div className="mt-12 animate-fade-up stagger-3">
              <DailyForecast
                birthMoonSign={displayedMoonSign}
                currentMoon={moonData}
                isPro={isPro}
                onUpgradeClick={handleOpenPricing}
              />
            </div>
          )}

          {/* Daily Ritual Section - Premium Content */}
          <div className="mt-12 relative animate-fade-up stagger-3">
            {isPro ? (
              /* UNLOCKED - Full Daily Ritual */
              <GlassmorphismCard size="lg" className="shadow-glow">
                <div className="flex items-center justify-center gap-3 mb-10">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h2 className="font-display text-2xl tracking-widest text-foreground uppercase">
                    {dailyRitual.title}
                  </h2>
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>

                {/* Affirmation - Large Serif */}
                <div className="mb-12 text-center">
                  <p className="font-display text-sm text-primary/60 uppercase tracking-widest mb-4">
                    Today's Affirmation
                  </p>
                  <blockquote className="sanctuary-text text-gold-gradient italic leading-relaxed">
                    "{dailyRitual.affirmation}"
                  </blockquote>
                </div>

                {/* Practice - Large Serif */}
                <div className="mb-12">
                  <p className="font-display text-sm text-primary/60 uppercase tracking-widest mb-4 text-center">
                    Sacred Practice
                  </p>
                  <p className="sanctuary-text text-cream-muted leading-relaxed text-center max-w-3xl mx-auto">
                    {dailyRitual.practice}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-3 gap-8 pt-8 border-t border-primary/10">
                  <div className="text-center">
                    <p className="font-display text-sm text-primary/60 uppercase tracking-widest mb-3">
                      Element
                    </p>
                    <p className="font-display text-2xl text-primary">{dailyRitual.element}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-sm text-primary/60 uppercase tracking-widest mb-3">
                      Crystals
                    </p>
                    <p className="font-serif text-lg text-cream-muted">
                      {dailyRitual.crystals.join(", ")}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-sm text-primary/60 uppercase tracking-widest mb-3">
                      Best Timing
                    </p>
                    <p className="font-serif text-lg text-cream-muted">{dailyRitual.timing}</p>
                  </div>
                </div>
              </GlassmorphismCard>
            ) : (
              /* LOCKED - Upgrade Prompt */
              <div className="relative">
                <GlassmorphismCard className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full glass-card flex items-center justify-center mb-8 shadow-glow">
                    <Lock className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-display text-3xl text-gold-gradient mb-4">
                    Unlock Daily Rituals
                  </h3>
                  <p className="font-serif text-xl text-cream-muted mb-10 text-center max-w-md">
                    Get personalized lunar rituals, crystal guidance, and sacred practices with Pro
                  </p>
                  <button
                    onClick={handleOpenPricing}
                    className="inline-flex items-center gap-3 px-10 py-4 font-display text-base tracking-widest uppercase glass-card shadow-glow hover:shadow-gold text-primary transition-all duration-500 rounded-xl"
                  >
                    <Sparkles className="w-5 h-5" />
                    Upgrade to Pro
                  </button>
                </GlassmorphismCard>

                {/* Blurred background */}
                <div className="glass-card p-12 md:p-16 opacity-30 blur-md pointer-events-none rounded-2xl">
                  <h2 className="font-display text-xl tracking-wider text-foreground mb-6 text-center">
                    Today's Ritual: The {moonData.sign} Awakening
                  </h2>
                  <div className="space-y-4">
                    <p className="font-serif text-cream-muted">✨ Morning Affirmation...</p>
                    <p className="font-serif text-cream-muted">🌙 Sacred Practice...</p>
                    <p className="font-serif text-cream-muted">💎 Crystal Companion...</p>
                  </div>
                </div>
              </div>
            )}
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
    </div>
  );
};

export default Blueprint;
