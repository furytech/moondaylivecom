import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import moonLogo from "@/assets/moon-logo-new.png";
import { Check, Sparkles } from "lucide-react";
import MoonLoader from "@/components/MoonLoader";

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
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
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
    <div className="min-h-screen bg-background flex flex-col">
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
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="flex justify-center mb-10 animate-fade-up">
            <div
              className="cursor-pointer hover-scale-subtle"
              onClick={() => navigate("/")}
            >
              <img
                src={moonLogo}
                alt="Moonday Live"
                className="w-40 h-auto"
              />
            </div>
          </div>

          {/* Canceled Message */}
          {canceled && (
            <div className="mb-8 p-4 art-deco-border bg-card/40 text-center animate-fade-up">
              <p className="font-serif text-cream-muted">
                No worries — take your time. Your lunar journey awaits when you're ready.
              </p>
            </div>
          )}

          {/* Pricing Card */}
          <div className="art-deco-border brass-glow bg-card/40 backdrop-blur-sm p-10 md:p-12 animate-fade-up stagger-1">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 border border-primary/30 rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-serif text-sm text-primary">Pro Membership</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-3">
                Unlock Your Moon
              </h1>
              <p className="font-serif text-lg text-cream-muted">
                Full access to your personalized lunar journey
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center p-1 bg-card/60 border border-border/50 rounded-lg">
                <button
                  onClick={() => setBillingInterval("monthly")}
                  className={`px-6 py-2 font-display text-sm tracking-wider transition-all duration-300 rounded-md ${
                    billingInterval === "monthly"
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-cream-muted hover:text-primary"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval("yearly")}
                  className={`px-6 py-2 font-display text-sm tracking-wider transition-all duration-300 rounded-md relative ${
                    billingInterval === "yearly"
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-cream-muted hover:text-primary"
                  }`}
                >
                  Yearly
                  {billingInterval !== "yearly" && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-display rounded-full">
                      -42%
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Price Display */}
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-2">
                <span className="font-display text-5xl md:text-6xl text-gold-gradient">
                  {PRICES[billingInterval].amount}
                </span>
                <span className="font-serif text-xl text-cream-muted">
                  /{PRICES[billingInterval].interval}
                </span>
              </div>
              {billingInterval === "yearly" && (
                <p className="font-serif text-sm text-primary mt-2">
                  {PRICES.yearly.savings} compared to monthly
                </p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-10">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="font-serif text-base text-cream-muted">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Error Message */}
            {error && (
              <p className="text-destructive text-base font-serif text-center mb-4">
                {error}
              </p>
            )}

            {/* CTA Button */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full h-14 font-display text-sm tracking-widest uppercase bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 brass-glow transition-all duration-300 flex items-center justify-center gap-3"
            >
              {loading ? (
                <MoonLoader size="sm" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start Your Journey
                </>
              )}
            </button>

            {/* Security Note */}
            <p className="font-serif text-sm text-cream-muted/60 text-center mt-6">
              Secure payment powered by Stripe. Cancel anytime.
            </p>
          </div>

          {/* Back to Home */}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => navigate("/")}
              className="font-serif text-base text-cream-muted elegant-hover"
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
