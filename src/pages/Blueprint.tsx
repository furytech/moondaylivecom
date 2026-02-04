import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import moonLogo from "@/assets/moon-logo-new.png";
import { getCurrentMoon } from "@/lib/currentMoon";
import { getDailyRitual, getNextTransitionTime } from "@/lib/dailyRitual";
import { Lock, Sparkles, Crown, Clock, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import MoonLoader from "@/components/MoonLoader";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import PricingModal from "@/components/PricingModal";

const Blueprint = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session, subscription, checkSubscription } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [timeUntilTransition, setTimeUntilTransition] = useState("");
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  
  const moonData = getCurrentMoon();
  const dailyRitual = getDailyRitual(moonData.sign);
  const isPro = subscription.subscribed;
  const success = searchParams.get("success") === "true";

  // Extract name from email
  const userName = user?.email?.split("@")[0] || "Cosmic Traveler";

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

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Decorative stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
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
      
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center pt-20 pb-6 px-6 relative z-10">
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
            {/* Current Lunar Phase */}
            <GlassmorphismCard className="animate-fade-up stagger-1">
              <h2 className="font-display text-lg tracking-widest text-foreground mb-8 uppercase">
                Current Lunar Phase
              </h2>
              
              <div className="flex flex-col items-center py-8">
                <span className="text-7xl mb-6">{moonData.phaseEmoji}</span>
                <p className="font-display text-3xl text-primary mb-3">
                  {moonData.phase}
                </p>
                <p className="font-serif text-lg text-muted-foreground">
                  {moonData.illumination}% Illumination
                </p>
              </div>

              <div className="border-t border-primary/10 pt-6 mt-4">
                <div className="flex items-center justify-center gap-3 text-cream-muted">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-serif text-lg">
                    Next transition in <span className="text-primary font-display">{timeUntilTransition}</span>
                  </span>
                </div>
              </div>
            </GlassmorphismCard>

            {/* Current Moon Sign */}
            <GlassmorphismCard className="animate-fade-up stagger-2">
              <h2 className="font-display text-lg tracking-widest text-foreground mb-8 uppercase">
                Moon in {moonData.sign}
              </h2>
              
              <div className="flex flex-col items-center py-8">
                <span className="text-6xl text-primary font-display mb-6">{moonData.symbol}</span>
                <p className="font-display text-3xl text-primary mb-3">
                  {moonData.sign}
                </p>
                <p className="font-serif text-lg text-muted-foreground">
                  {moonData.element} Sign
                </p>
              </div>

              <div className="border-t border-primary/10 pt-6 mt-4">
                <p className="font-serif text-lg text-cream-muted text-center leading-relaxed">
                  {moonData.element === "Fire" && "Bold energy ignites your passions today."}
                  {moonData.element === "Earth" && "Ground yourself in practical matters."}
                  {moonData.element === "Air" && "Communication and ideas flow freely."}
                  {moonData.element === "Water" && "Emotions run deep — trust your intuition."}
                </p>
              </div>
            </GlassmorphismCard>
          </div>

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
    </div>
  );
};

export default Blueprint;
