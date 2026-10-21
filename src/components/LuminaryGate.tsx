import React from "react";
import { useNavigate } from "react-router-dom";
import { MONTHLY_PRICE_ID, YEARLY_PRICE_ID } from "@/lib/prices";

interface LuminaryGateProps {
  currentMoonSign: string;
  birthMoonSign: string;
  onSelectPlan?: (priceId: string) => Promise<void> | void;
  onUnlockClick?: () => void;
  onPrimaryClick?: () => void;
  loading?: boolean;
  className?: string;
}

/**
 * The upgrade card: one short headline, one line of value, the price, one button.
 * It sits directly after the faded preview of the first locked section, once per page.
 */
export const LuminaryGate: React.FC<LuminaryGateProps> = ({
  currentMoonSign,
  birthMoonSign,
  onSelectPlan,
  onUnlockClick,
  onPrimaryClick,
  loading = false,
  className = "",
}) => {
  let navigate: ReturnType<typeof import("react-router-dom").useNavigate> | null = null;
  try {
    navigate = useNavigate();
  } catch {
    // outside router context (e.g. unit tests)
  }

  const transitingSign = currentMoonSign?.replace(/\s*Moon$/i, "").trim() || "Current";
  const natalSign = birthMoonSign?.replace(/\s*Moon$/i, "").trim() || "Birth";

  const handleMonthlyClick = () => {
    if (onPrimaryClick) {
      onPrimaryClick();
    } else if (navigate) {
      navigate("/pricing");
    } else if (onSelectPlan) {
      onSelectPlan(MONTHLY_PRICE_ID);
    } else if (onUnlockClick) {
      onUnlockClick();
    }
  };

  const handleYearlyClick = () => {
    if (navigate) {
      navigate("/pricing?plan=yearly");
    } else if (onSelectPlan) {
      onSelectPlan(YEARLY_PRICE_ID);
    } else if (onUnlockClick) {
      onUnlockClick();
    }
  };

  return (
    <div
      className={`w-full rounded-2xl p-4 sm:p-6 bg-navy-medium/40 border border-primary/25 backdrop-blur-md space-y-3 ${className}`}
    >
      <h3 className="font-display text-xl md:text-2xl text-gold-gradient tracking-wide leading-tight text-center">
        Now you know who you are.
      </h3>

      <p className="font-serif text-base text-cream-muted leading-relaxed text-left">
        Luminary shows how the {transitingSign} Moon meets your {natalSign} Moon, every day.
      </p>

      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={handleMonthlyClick}
          disabled={loading}
          className="btn-lime w-full min-h-12 px-5 py-3 font-sans text-[15px] font-medium normal-case tracking-normal rounded-xl transition-all duration-300 cursor-pointer inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <span>Preparing Checkout...</span> : <span>Unlock Luminary — $6.88/month</span>}
        </button>

        <button
          type="button"
          onClick={handleYearlyClick}
          className="inline-flex items-center justify-center min-h-11 px-3 text-sm text-cream-muted/80 font-serif hover:text-primary transition-colors cursor-pointer underline-offset-4 hover:underline"
        >
          or $58.88/year · cancel anytime
        </button>
      </div>
    </div>
  );
};

export default LuminaryGate;
