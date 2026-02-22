import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";
import MoonLoader from "@/components/MoonLoader";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import moonLogo from "@/assets/moon-logo-new.png";

// Stripe Price IDs
const PRICES = {
  monthly: {
    id: "price_1Sv1zyBzaednmcCFe8sl5ad9",
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
  "Mind, Soul & Body Lunar Pillars",
  "Personalized Birth Moon × Current Moon Forecast",
  "Daily Sovereign Insight",
  "Crystal & Element Guidance",
  "Moon Transition Alerts",
  "Sacred Practice Library",
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
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      setError("Unable to start checkout. Please try again.");
    } finally {
      setLoading(false);
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

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="font-serif text-sm text-cream-muted/60 hover:text-primary transition-colors"
          >
            ← Back
          </button>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center pt-20 pb-6 px-6 relative z-10">
        {/* Moon Logo */}
        <div className="animate-float mb-6">
          <div 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden cursor-pointer hover-scale-subtle bg-background logo-halo"
            onClick={() => navigate("/")}
          >
            <img
              src={moonLogo}
              alt="Moonday"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Canceled Message */}
        {canceled && (
          <GlassmorphismCard className="mb-8 text-center max-w-md animate-fade-up" size="sm">
            <p className="font-serif text-base text-cream-muted/80">
              No worries — take your time. Your lunar journey awaits when you're ready.
            </p>
          </GlassmorphismCard>
        )}

        {/* Pricing Card */}
        <GlassmorphismCard className="max-w-lg w-full animate-fade-up stagger-1">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="font-serif text-sm text-primary/60 uppercase tracking-[0.2em] mb-4">
              The Sovereign Tier
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-gold-gradient tracking-[0.06em] mb-3">
              Unlock Your Moon
            </h1>
            <p className="font-serif text-lg text-cream-muted/70">
              Full access to your personalized lunar sanctuary
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center p-1 border border-primary/20 rounded-full">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`px-6 py-2.5 font-display text-xs tracking-[0.15em] uppercase transition-all duration-400 rounded-full ${
                  billingInterval === "monthly"
                    ? "bg-primary/20 text-primary"
                    : "text-cream-muted/60 hover:text-primary"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`px-6 py-2.5 font-display text-xs tracking-[0.15em] uppercase transition-all duration-400 rounded-full relative ${
                  billingInterval === "yearly"
                    ? "bg-primary/20 text-primary"
                    : "text-cream-muted/60 hover:text-primary"
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-display rounded-full tracking-wider">
                  Best
                </span>
              </button>
            </div>
          </div>

          {/* Price Display */}
          <div className="text-center mb-10">
            <div className="flex items-baseline justify-center gap-2">
              <span className="font-display text-5xl md:text-6xl text-gold-gradient">
                {PRICES[billingInterval].amount}
              </span>
              <span className="font-serif text-xl text-cream-muted/60">
                /{PRICES[billingInterval].interval}
              </span>
            </div>
            {billingInterval === "yearly" && (
              <p className="font-serif text-base text-primary/80 mt-3">
                {PRICES.yearly.savings} compared to monthly
              </p>
            )}
          </div>

          {/* Features */}
          <ul className="space-y-4 mb-10">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-4">
                <div className="w-5 h-5 rounded-full border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary/70" strokeWidth={2} />
                </div>
                <span className="font-serif text-base text-cream-muted/80">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Error Message */}
          {error && (
            <p className="text-destructive text-base font-serif text-center mb-6">
              {error}
            </p>
          )}

          {/* CTA Button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full h-14 font-display text-sm tracking-[0.15em] uppercase border border-primary/40 rounded-full text-primary hover:bg-primary/10 transition-all duration-500 flex items-center justify-center gap-3"
          >
            {loading ? (
              <MoonLoader size="sm" />
            ) : (
              "Start Your Path"
            )}
          </button>

          {/* Security Note */}
          <p className="font-serif text-sm text-cream-muted/40 text-center mt-8">
            Secure payment powered by Stripe. Cancel anytime.
          </p>
        </GlassmorphismCard>

        {/* Decorative element */}
        <div className="mt-12 flex items-center gap-4">
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/30" />
        </div>
      </main>
    </div>
  );
};

export default Pricing;
