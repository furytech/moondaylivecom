import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import moonLogo from "@/assets/moon-logo-new.png";
import { Check, Sparkles, Star } from "lucide-react";
import MoonLoader from "@/components/MoonLoader";
import CelestialBackground from "@/components/CelestialBackground";
import GlassmorphismCard from "@/components/GlassmorphismCard";

// Stripe Price IDs
const PRICES = {
  monthly: {
    id: "price_1Sv1zyBzaednmccFe8sl5ad9",
    amount: "$2.88",
    interval: "month",
  },
  yearly: {
    id: "price_1SvGpyBzaednmcCFzS90Mzht",
    amount: "$19.88",
    interval: "year",
    savings: "Save 42%",
  },
};

const features = [
  "Personalized Daily Rituals",
  "Crystal & Element Guidance",
  "Lunar Phase Tracking",
  "Sacred Practice Library",
  "Moon Transition Alerts",
  "Exclusive Cosmic Insights",
];

const Pricing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session } = useAuth();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canceled = searchParams.get("canceled") === "true";

  const handleCheckout = async () => {
    if (!user || !session) {
      navigate("/portal");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const priceId = PRICES[billingInterval].id;
      
      const { data, error: fnError } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      setError("Unable to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <CelestialBackground />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-xl">
          {/* Logo */}
          <div className="flex justify-center mb-12 animate-fade-up">
            <div
              className="cursor-pointer hover-scale-subtle"
              onClick={() => navigate("/")}
            >
              <img
                src={moonLogo}
                alt="Moonday Live"
                className="w-44 h-auto drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Canceled Message */}
          {canceled && (
            <GlassmorphismCard className="mb-8 text-center animate-fade-up" size="sm">
              <p className="font-serif text-lg text-cream-muted">
                No worries — take your time. Your lunar journey awaits when you're ready.
              </p>
            </GlassmorphismCard>
          )}

          {/* Pricing Card */}
          <GlassmorphismCard className="animate-fade-up stagger-1 shadow-glow">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-5 py-2 glass-card rounded-full mb-6">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="font-display text-sm text-primary uppercase tracking-widest">Pro Membership</span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl text-gold-gradient tracking-wider mb-4">
                Unlock Your Moon
              </h1>
              <p className="font-serif text-xl text-cream-muted">
                Full access to your personalized lunar sanctuary
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex items-center p-1.5 glass-card rounded-2xl">
                <button
                  onClick={() => setBillingInterval("monthly")}
                  className={`px-8 py-3 font-display text-sm tracking-widest transition-all duration-400 rounded-xl ${
                    billingInterval === "monthly"
                      ? "bg-primary/20 text-primary shadow-glow"
                      : "text-cream-muted hover:text-primary"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval("yearly")}
                  className={`px-8 py-3 font-display text-sm tracking-widest transition-all duration-400 rounded-xl relative ${
                    billingInterval === "yearly"
                      ? "bg-primary/20 text-primary shadow-glow"
                      : "text-cream-muted hover:text-primary"
                  }`}
                >
                  Yearly
                  <span className="absolute -top-3 -right-3 px-2.5 py-1 bg-primary text-primary-foreground text-xs font-display rounded-full tracking-wider">
                    Best Value
                  </span>
                </button>
              </div>
            </div>

            {/* Price Display */}
            <div className="text-center mb-10">
              <div className="flex items-baseline justify-center gap-2">
                <span className="font-display text-6xl md:text-7xl text-gold-gradient">
                  {PRICES[billingInterval].amount}
                </span>
                <span className="font-serif text-2xl text-cream-muted">
                  /{PRICES[billingInterval].interval}
                </span>
              </div>
              {billingInterval === "yearly" && (
                <p className="font-serif text-lg text-primary mt-3">
                  {PRICES.yearly.savings} compared to monthly
                </p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-5 mb-12">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full glass-card flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-serif text-lg text-cream-muted">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Error Message */}
            {error && (
              <p className="text-destructive text-lg font-serif text-center mb-6">
                {error}
              </p>
            )}

            {/* CTA Button */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full h-16 font-display text-base tracking-widest uppercase glass-card shadow-glow hover:shadow-gold transition-all duration-500 flex items-center justify-center gap-3 rounded-xl text-primary"
            >
              {loading ? (
                <MoonLoader size="sm" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Start Your Journey
                </>
              )}
            </button>

            {/* Security Note */}
            <p className="font-serif text-base text-cream-muted/50 text-center mt-8">
              Secure payment powered by Stripe. Cancel anytime.
            </p>
          </GlassmorphismCard>

          {/* Back to Home */}
          <div className="flex justify-center mt-10">
            <button
              onClick={() => navigate("/")}
              className="font-serif text-lg text-cream-muted elegant-hover"
            >
              ← Back to the cosmos
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
