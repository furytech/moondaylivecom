import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown, Sparkles, Check } from "lucide-react";
import MoonLoader from "@/components/MoonLoader";

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlan: (priceId: string) => Promise<void>;
  loading: boolean;
}

const PLANS = [
  {
    id: "yearly",
    priceId: "price_1TTqaxBzaednmcCFjbbknm0L",
    name: "Yearly",
    price: "$19.88",
    period: "/year",
    savings: "Save 42%",
    features: ["Mind, Soul & Body Lunar Pillars", "Personalized Birth Moon × Current Moon Forecast", "Daily Sovereign Insight", "Priority support"],
  },
  {
    id: "monthly",
    priceId: "price_1TTqaPBzaednmcCFmPSW7Vuj",
    name: "Monthly",
    price: "$2.88",
    period: "/month",
    savings: null,
    features: ["Mind, Soul & Body Lunar Pillars", "Personalized Birth Moon × Current Moon Forecast", "Daily Sovereign Insight"],
  },
];

const PricingModal = ({ open, onOpenChange, onSelectPlan, loading }: PricingModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = async (priceId: string) => {
    setSelectedPlan(priceId);
    await onSelectPlan(priceId);
    setSelectedPlan(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass-card border-primary/20 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-6 h-6 text-primary" />
            <DialogTitle className="font-display text-2xl text-gold-gradient tracking-wider">
              The Sovereign Tier
            </DialogTitle>
          </div>
          <p className="font-serif text-cream-muted">
            Choose your lunar journey
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => handleSelectPlan(plan.priceId)}
              disabled={loading}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                plan.id === "yearly"
                  ? "border-primary/50 bg-primary/5 hover:border-primary hover:shadow-glow"
                  : "border-primary/20 hover:border-primary/40"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {plan.savings && (
                <span className="absolute -top-3 right-4 px-3 py-1 bg-primary text-background font-display text-xs tracking-wider rounded-full">
                  {plan.savings}
                </span>
              )}

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg text-foreground tracking-wide">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl text-primary">{plan.price}</span>
                    <span className="font-serif text-cream-muted">{plan.period}</span>
                  </div>
                </div>
                {loading && selectedPlan === plan.priceId ? (
                  <MoonLoader size="sm" />
                ) : (
                  <Sparkles className="w-6 h-6 text-primary/60" />
                )}
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 font-serif text-sm text-cream-muted">
                    <Check className="w-4 h-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <p className="text-center font-serif text-xs text-muted-foreground pt-2">
          Cancel anytime • Secure payment via Stripe
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;
