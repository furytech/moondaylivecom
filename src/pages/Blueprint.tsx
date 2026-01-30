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

const Blueprint = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session, subscription, checkSubscription } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [timeUntilTransition, setTimeUntilTransition] = useState("");
  
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
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
              opacity: Math.random() * 0.4 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 pt-24 pb-12 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-12 animate-fade-up">
            <div 
              onClick={() => navigate("/")} 
              className="cursor-pointer hover-scale-subtle inline-block"
            >
              <img 
                src={moonLogo} 
                alt="Moonday" 
                className="w-48 h-auto"
              />
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-8 p-6 art-deco-border bg-primary/10 text-center animate-fade-up">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-display text-lg text-primary tracking-wider">Welcome to Pro!</span>
              </div>
              <p className="font-serif text-cream-muted">
                Your lunar journey has begun. All premium features are now unlocked.
              </p>
            </div>
          )}

          {/* Welcome Header */}
          <div className="text-center mb-16 animate-fade-up stagger-1">
            <div className="flex items-center justify-center gap-2 mb-4">
              {isPro && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full">
                  <Crown className="w-3 h-3 text-primary" />
                  <span className="font-serif text-xs text-primary uppercase tracking-wider">Pro Member</span>
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl md:text-5xl text-gold-gradient tracking-wider mb-4">
              Your Blueprint
            </h1>
            <p className="font-serif text-xl text-cream-muted">
              Welcome back, {userName}
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid md:grid-cols-2 gap-10">
            {/* Current Lunar Phase */}
            <div className="art-deco-border brass-glow card-lift bg-card/40 backdrop-blur-sm p-8 md:p-10 animate-fade-up stagger-1">
              <h2 className="font-display text-lg tracking-wider text-foreground mb-8">
                Current Lunar Phase
              </h2>
              
              <div className="flex flex-col items-center py-8">
                <span className="text-6xl mb-4">{moonData.phaseEmoji}</span>
                <p className="font-display text-2xl text-primary mb-2">
                  {moonData.phase}
                </p>
                <p className="font-serif text-base text-muted-foreground">
                  {moonData.illumination}% Illumination
                </p>
              </div>

              <div className="border-t border-border/30 pt-6 mt-4">
                <div className="flex items-center justify-center gap-2 text-cream-muted">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-serif text-base">
                    Next transition in {timeUntilTransition}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Moon Sign */}
            <div className="art-deco-border brass-glow card-lift bg-card/40 backdrop-blur-sm p-8 md:p-10 animate-fade-up stagger-2">
              <h2 className="font-display text-lg tracking-wider text-foreground mb-8">
                Moon in {moonData.sign}
              </h2>
              
              <div className="flex flex-col items-center py-8">
                <span className="text-5xl text-primary font-display mb-4">{moonData.symbol}</span>
                <p className="font-display text-2xl text-primary mb-2">
                  {moonData.sign}
                </p>
                <p className="font-serif text-base text-muted-foreground">
                  {moonData.element} Sign
                </p>
              </div>

              <div className="border-t border-border/30 pt-6 mt-4">
                <p className="font-serif text-base text-cream-muted text-center leading-relaxed">
                  {moonData.element === "Fire" && "Bold energy ignites your passions today."}
                  {moonData.element === "Earth" && "Ground yourself in practical matters."}
                  {moonData.element === "Air" && "Communication and ideas flow freely."}
                  {moonData.element === "Water" && "Emotions run deep — trust your intuition."}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Ritual Section - Premium Content */}
          <div className="mt-12 relative animate-fade-up stagger-3">
            {isPro ? (
              /* UNLOCKED - Full Daily Ritual */
              <div className="art-deco-border brass-glow card-lift bg-card/40 backdrop-blur-sm p-10 md:p-12">
                <div className="flex items-center justify-center gap-2 mb-8">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-xl tracking-wider text-foreground">
                    {dailyRitual.title}
                  </h2>
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>

                {/* Affirmation */}
                <div className="mb-8 text-center">
                  <p className="font-serif text-sm text-cream-muted/60 uppercase tracking-wider mb-2">
                    Today's Affirmation
                  </p>
                  <blockquote className="font-serif text-xl md:text-2xl text-gold-gradient italic">
                    "{dailyRitual.affirmation}"
                  </blockquote>
                </div>

                {/* Practice */}
                <div className="mb-8">
                  <p className="font-serif text-sm text-cream-muted/60 uppercase tracking-wider mb-3">
                    Sacred Practice
                  </p>
                  <p className="font-serif text-lg text-cream-muted leading-relaxed">
                    {dailyRitual.practice}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-border/30">
                  <div className="text-center">
                    <p className="font-serif text-sm text-cream-muted/60 uppercase tracking-wider mb-2">
                      Element
                    </p>
                    <p className="font-display text-lg text-primary">{dailyRitual.element}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-serif text-sm text-cream-muted/60 uppercase tracking-wider mb-2">
                      Crystals
                    </p>
                    <p className="font-serif text-base text-cream-muted">
                      {dailyRitual.crystals.join(", ")}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-serif text-sm text-cream-muted/60 uppercase tracking-wider mb-2">
                      Best Timing
                    </p>
                    <p className="font-serif text-base text-cream-muted">{dailyRitual.timing}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* LOCKED - Upgrade Prompt */
              <div className="relative">
                <div className="absolute inset-0 bg-card/60 backdrop-blur-md rounded-lg border border-primary/20 z-10 flex flex-col items-center justify-center p-10">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl text-gold-gradient mb-3">
                    Unlock Daily Rituals
                  </h3>
                  <p className="font-serif text-lg text-cream-muted mb-8 text-center max-w-md">
                    Get personalized lunar rituals, crystal guidance, and sacred practices with Pro
                  </p>
                  <button
                    onClick={() => navigate("/pricing")}
                    className="inline-flex items-center gap-2 px-8 py-4 font-display text-sm tracking-widest uppercase art-deco-border bg-primary/10 hover:bg-primary/20 text-primary brass-glow transition-all duration-300"
                  >
                    <Sparkles className="w-4 h-4" />
                    Upgrade to Pro
                  </button>
                </div>

                {/* Blurred background */}
                <div className="art-deco-border bg-card/40 p-10 md:p-12 opacity-40 blur-sm pointer-events-none">
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
            <div className="mt-10 text-center animate-fade-up stagger-4">
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="inline-flex items-center gap-2 font-serif text-base text-cream-muted elegant-hover"
              >
                {portalLoading ? (
                  <MoonLoader size="sm" />
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
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
