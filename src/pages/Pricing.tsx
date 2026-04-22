import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Crown, Moon } from "lucide-react";
import MoonLoader from "@/components/MoonLoader";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import PageLayout from "@/components/PageLayout";

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

// Side-by-side comparison: each row indicates whether the tier includes the feature.
const COMPARISON: { label: string; free: boolean; sovereign: boolean }[] = [
  { label: "Current Moon sign & phase", free: true, sovereign: true },
  { label: "General earthwide moon meaning", free: true, sovereign: true },
  { label: "Daily lunar climate gauge", free: true, sovereign: true },
  { label: "Lunar Library (zodiac archives)", free: true, sovereign: true },
  { label: "Personalized Birth Moon × Current Moon Forecast", free: false, sovereign: true },
  { label: "Mind, Soul & Body Lunar Pillars", free: false, sovereign: true },
  { label: "Daily Sovereign Insight & ritual", free: false, sovereign: true },
  { label: "Crystal & element guidance", free: false, sovereign: true },
  { label: "Moon transition alerts", free: false, sovereign: true },
  { label: "Sacred practice library", free: false, sovereign: true },
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
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.url) window.location.href = data.url;
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      setError("Unable to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout showLogo={false}>
      <div className="w-full max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate("/")}
            className="font-serif text-sm text-cream-muted/60 hover:text-primary transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <p className="font-serif text-sm text-primary/60 uppercase tracking-[0.2em] mb-3">
            Choose Your Path
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-gold-gradient tracking-[0.06em] mb-3">
            Pick a plan to unlock your moon
          </h1>
          <p className="font-serif text-lg text-cream-muted/70 max-w-2xl mx-auto">
            Start free with the universal lunar climate, or step into your fully personalized sanctuary.
          </p>
        </div>

        {canceled && (
          <GlassmorphismCard className="mb-8 text-center max-w-xl mx-auto animate-fade-up" size="sm">
            <p className="font-serif text-base text-cream-muted/80">
              No worries — take your time. Your lunar journey awaits when you're ready.
            </p>
          </GlassmorphismCard>
        )}

        {/* Billing toggle */}
        <div className="flex justify-center mb-10 animate-fade-up stagger-1">
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

        {/* Side-by-side plan cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-10 pt-8">
          {/* FREE */}
          <GlassmorphismCard className="animate-fade-up stagger-1 flex flex-col">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Moon className="w-5 h-5 text-cream-muted/60" />
                <h2 className="font-display text-2xl text-cream-muted tracking-[0.06em]">Free</h2>
              </div>
              <div className="flex items-baseline justify-center gap-1 mt-3">
                <span className="font-display text-4xl text-cream-muted">$0</span>
                <span className="font-serif text-base text-cream-muted/60">/forever</span>
              </div>
              {/* Spacer to match Sovereign's "Save X%" line so checklists align */}
              <p className="font-serif text-sm mt-2 invisible" aria-hidden="true">placeholder</p>
              <p className="font-serif text-sm text-cream-muted/60 mt-3">
                For curious souls beginning their lunar journey
              </p>
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {COMPARISON.map((row) => (
                <li key={row.label} className="flex items-start gap-3">
                  {row.free ? (
                    <Check className="w-4 h-4 text-primary/70 mt-1 flex-shrink-0" strokeWidth={2} />
                  ) : (
                    <X className="w-4 h-4 text-cream-muted/30 mt-1 flex-shrink-0" strokeWidth={2} />
                  )}
                  <span
                    className={`font-serif text-sm ${
                      row.free ? "text-cream-muted/80" : "text-cream-muted/40 line-through"
                    }`}
                  >
                    {row.label}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate(user ? "/blueprint" : "/portal")}
              className="w-full h-12 font-display text-xs tracking-[0.15em] uppercase border border-primary/20 rounded-full text-cream-muted/80 hover:bg-primary/5 hover:text-primary hover:border-primary/40 transition-all duration-500"
            >
              {user ? "Continue Free" : "Start Free"}
            </button>
          </GlassmorphismCard>

          {/* SOVEREIGN */}
          <GlassmorphismCard className="animate-fade-up stagger-2 flex flex-col relative border-primary/40">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full px-4 py-1.5 bg-primary text-primary-foreground font-display text-[10px] tracking-[0.15em] uppercase rounded-full whitespace-nowrap z-20 shadow-lg">
              Most Popular
            </span>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <h2 className="font-display text-2xl text-gold-gradient tracking-[0.06em]">Sovereign</h2>
              </div>
              <div className="flex items-baseline justify-center gap-1 mt-3">
                <span className="font-display text-4xl text-gold-gradient">
                  {PRICES[billingInterval].amount}
                </span>
                <span className="font-serif text-base text-cream-muted/60">
                  /{PRICES[billingInterval].interval}
                </span>
              </div>
              {billingInterval === "yearly" && (
                <p className="font-serif text-sm text-primary/80 mt-2">{PRICES.yearly.savings}</p>
              )}
              <p className="font-serif text-sm text-cream-muted/70 mt-3">
                Your fully personalized lunar sanctuary
              </p>
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {COMPARISON.map((row) => (
                <li key={row.label} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" strokeWidth={2} />
                  <span className="font-serif text-sm text-cream-muted/90">{row.label}</span>
                </li>
              ))}
            </ul>

            {error && (
              <p className="text-destructive text-sm font-serif text-center mb-4">{error}</p>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full h-12 font-display text-xs tracking-[0.15em] uppercase border border-primary/60 bg-primary/10 rounded-full text-primary hover:bg-primary/20 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <MoonLoader size="sm" /> : "Become Sovereign"}
            </button>
          </GlassmorphismCard>
        </div>

        <p className="font-serif text-sm text-cream-muted/40 text-center mb-6">
          Secure payment powered by Stripe. Cancel anytime.
        </p>
      </div>
    </PageLayout>
  );
};

export default Pricing;
