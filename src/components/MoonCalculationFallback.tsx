import { AlertTriangle, RefreshCw } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { CALCULATION_ERROR_MESSAGE } from "@/lib/safeLunar";

interface MoonCalculationFallbackProps {
  /** Short label for what could not be calculated. */
  title?: string;
  /** Override the default explanatory copy. */
  message?: string;
  /** When provided, a Try again control is shown. */
  onRetry?: () => void;
  retrying?: boolean;
  /** Render without the glass card shell (for use inside an existing card). */
  bare?: boolean;
  className?: string;
}

const MoonCalculationFallback = ({
  title = "This reading is unavailable",
  message = CALCULATION_ERROR_MESSAGE,
  onRetry,
  retrying = false,
  bare = false,
  className = "",
}: MoonCalculationFallbackProps) => {
  const body = (
    <div className="flex flex-col items-center text-center gap-3 py-6" role="status" aria-live="polite">
      <AlertTriangle className="w-5 h-5 text-[hsl(var(--gold-medium))]" aria-hidden="true" />
      <h3 className="font-display text-sm uppercase tracking-[0.3em] text-foreground">{title}</h3>
      <p className="font-serif text-sm text-cream-muted max-w-md leading-relaxed">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-1 inline-flex items-center gap-2 font-display text-[11px] tracking-[0.3em] uppercase text-primary border border-primary/40 rounded-full px-5 py-2 hover:bg-primary/10 hover:border-primary/70 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} aria-hidden="true" />
          {retrying ? "Recalculating" : "Try again"}
        </button>
      )}
      <p className="font-serif text-xs text-cream-muted/60 max-w-md">
        Everything else on this page still works — the rest of your blueprint is unaffected.
      </p>
    </div>
  );

  if (bare) return <div className={className}>{body}</div>;
  return <GlassmorphismCard className={className}>{body}</GlassmorphismCard>;
};

export default MoonCalculationFallback;
