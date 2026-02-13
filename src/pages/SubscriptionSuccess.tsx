import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import moonLogo from "@/assets/moon-logo-new.png";
import { Crown, Sparkles, Brain, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import GlassmorphismCard from "@/components/GlassmorphismCard";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { user, checkSubscription } = useAuth();
  const [updating, setUpdating] = useState(true);

  // Update is_subscriber and refresh subscription state
  useEffect(() => {
    const activate = async () => {
      if (!user) {
        setUpdating(false);
        return;
      }

      try {
        await supabase
          .from("user_profiles")
          .update({ is_subscriber: true, subscription_status: "sovereign" })
          .eq("user_id", user.id);

        await checkSubscription();
      } catch (err) {
        console.error("Failed to activate subscription:", err);
      } finally {
        setUpdating(false);
      }
    };

    activate();
  }, [user, checkSubscription]);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold-pale rounded-full animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              opacity: Math.random() * 0.6 + 0.3,
            }}
          />
        ))}
      </div>

      <Navigation />

      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-20">
        <div className="max-w-2xl mx-auto w-full text-center">
          {/* Animated logo */}
          <div className="mb-10 animate-fade-up">
            <div className="relative inline-block">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden mx-auto logo-halo animate-float">
                <img
                  src={moonLogo}
                  alt="Moonday"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Radiating glow ring */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse scale-125" />
              <div className="absolute inset-0 rounded-full border border-primary/10 animate-pulse scale-150" style={{ animationDelay: "0.5s" }} />
            </div>
          </div>

          {/* Crown badge */}
          <div className="flex justify-center mb-6 animate-fade-up stagger-1">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full shadow-glow">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-display text-sm text-primary uppercase tracking-widest">
                Sovereign Member
              </span>
            </span>
          </div>

          {/* Main heading */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-gold-gradient tracking-wider mb-6 animate-fade-up stagger-2">
            Welcome, Sovereign.
          </h1>

          <p className="font-serif text-xl md:text-2xl text-cream-muted mb-4 animate-fade-up stagger-2">
            Your moon compass is now fully calibrated.
          </p>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-4 my-8 animate-fade-up stagger-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/40" />
            <div className="w-2 h-2 rotate-45 border border-primary/40" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/40" />
          </div>

          {/* Unlock message */}
          <GlassmorphismCard className="mb-10 animate-fade-up stagger-3" size="sm">
            <p className="font-serif text-lg text-cream-muted mb-6">
              You have unlocked the Mind, Body, and Soul insights.
              May this guidance serve your highest path.
            </p>

            <div className="flex items-center justify-center gap-8">
              {[
                { icon: Brain, label: "Mind" },
                { icon: Sparkles, label: "Soul" },
                { icon: Globe, label: "Body" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center shadow-glow">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-display text-xs text-primary/60 uppercase tracking-widest">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </GlassmorphismCard>

          {/* CTA */}
          <div className="animate-fade-up stagger-4">
            <button
              onClick={() => navigate("/blueprint")}
              disabled={updating}
              className="inline-flex items-center gap-3 px-10 py-4 font-display text-sm tracking-widest uppercase glass-card shadow-glow hover:shadow-gold text-primary transition-all duration-500 rounded-xl disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {updating ? "Calibrating..." : "Return to Dashboard"}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SubscriptionSuccess;
