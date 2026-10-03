import React from "react";
import { Sparkles, Crown } from "lucide-react";

interface LuminaryGateProps {
  currentMoonSign: string;
  birthMoonSign: string;
  onSelectPlan?: (priceId: string) => Promise<void> | void;
  onUnlockClick?: () => void;
  loading?: boolean;
  className?: string;
}

const MONTHLY_PRICE_ID = "price_1ULN2GJowQfvwg0ZtYxb5Th5";
const YEARLY_PRICE_ID = "price_1ULN4MJowQfvwg0ZjOGNtzgY";

export const LuminaryGate: React.FC<LuminaryGateProps> = ({
  currentMoonSign,
  birthMoonSign,
  onSelectPlan,
  onUnlockClick,
  loading = false,
  className = "",
}) => {
  const transitingSign = currentMoonSign?.replace(/\s*Moon$/i, "").trim() || "Current";
  const natalSign = birthMoonSign?.replace(/\s*Moon$/i, "").trim() || "Birth";

  const handleMonthlyClick = () => {
    if (onSelectPlan) {
      onSelectPlan(MONTHLY_PRICE_ID);
    } else if (onUnlockClick) {
      onUnlockClick();
    }
  };

  const handleYearlyClick = () => {
    if (onSelectPlan) {
      onSelectPlan(YEARLY_PRICE_ID);
    } else if (onUnlockClick) {
      onUnlockClick();
    }
  };

  return (
    <div
      className={`w-full rounded-2xl p-8 md:p-12 text-center bg-navy-medium/40 border border-primary/20 backdrop-blur-md shadow-2xl relative overflow-hidden mt-6 ${className}`}
    >
      {/* Subtle lilac/gold radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/30 mb-4">
          <Crown className="w-3.5 h-3.5 text-primary" />
          <span className="font-display text-[11px] uppercase tracking-[0.25em] text-primary">
            Luminary Access
          </span>
        </div>

        <h3 className="font-display text-2xl md:text-3xl text-gold-gradient tracking-wide mb-4 leading-tight">
          Now you know who you are.
        </h3>

        <p className="font-serif text-lg md:text-xl text-cream-muted leading-relaxed mb-8">
          Today's {transitingSign} Moon is moving through your {natalSign}. Luminary
          shows you how that's shaping your emotions, your energy, and the way you're
          relating to everyone around you — right now, under this sky.
        </p>

        <button
          type="button"
          onClick={handleMonthlyClick}
          disabled={loading}
          className="btn-lime font-display text-sm md:text-base uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span>Preparing Checkout...</span>
          ) : (
            <span>UNLOCK LUMINARY — $6.88/month</span>
          )}
        </button>

        <button
          type="button"
          onClick={handleYearlyClick}
          className="text-xs md:text-sm text-cream-muted/70 font-serif mt-3 hover:text-primary transition-colors cursor-pointer underline-offset-4 hover:underline"
        >
          or $58.88/year · cancel anytime
        </button>
      </div>
    </div>
  );
};

export default LuminaryGate;
