import { useMemo } from "react";
import { computeLunarReturns } from "@/lib/lunarReturn";
import type { ZodiacSign } from "@/lib/sovereignEngine";

interface Props {
  natalMoon: ZodiacSign;
}

const fmt = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function LunarReturnCard({ natalMoon }: Props) {
  const returns = useMemo(() => computeLunarReturns(natalMoon, 3), [natalMoon]);

  return (
    <div className="sov-card">
      <div className="text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--sov-champagne))] mb-2 text-center">
        Lunar Return Tracker
      </div>
      <h3 className="font-display text-2xl tracking-wide text-[hsl(var(--sov-ivory))] text-center mb-1">
        Your Next Resets
      </h3>
      <p className="text-sm text-[hsl(var(--sov-ivory)/0.55)] text-center max-w-xl mx-auto mb-6">
        Every ~27 days the Moon returns to your natal sign of{" "}
        <span className="text-[hsl(var(--sov-champagne))]">{natalMoon}</span>. These are your next three reset windows.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {returns.map((r, i) => (
          <div
            key={i}
            className="border border-[hsl(var(--sov-champagne)/0.18)] rounded-lg p-4 bg-[hsl(var(--sov-ivory)/0.02)]"
          >
            <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--sov-champagne))] mb-2 text-center">
              Return {i + 1}
            </div>
            <div className="text-sm text-[hsl(var(--sov-ivory))] text-center font-display mb-1">
              {fmt(r.ingress)}
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--sov-ivory)/0.45)] text-center mb-3">
              through {fmt(r.egress)}
            </div>
            <p className="text-xs text-[hsl(var(--sov-ivory)/0.75)] italic text-center mb-3 leading-relaxed">
              {r.reading}
            </p>
            <div className="border-t border-[hsl(var(--sov-champagne)/0.15)] pt-3">
              <div className="text-[9px] uppercase tracking-[0.3em] text-[hsl(var(--sov-champagne))] mb-1 text-center">
                Journal Prompt
              </div>
              <p className="text-xs text-[hsl(var(--sov-ivory)/0.7)] text-center leading-relaxed">
                {r.prompt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
