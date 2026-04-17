import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { Activity, AlertTriangle, Loader2 } from "lucide-react";

interface ClimateBreakdown {
  illumination: number;
  phase_contribution: number;
  sign: string;
  element: string;
  sign_weight: number;
  volatility_offset: number;
  volatility_alert: boolean;
  hours_until_next_transition: number;
  next_transition_utc: string;
}

interface ClimateResponse {
  climate_score: number;
  breakdown: ClimateBreakdown;
  formula: string;
  computed_at: string;
}

interface Props {
  illumination: number; // 0-100 from lunar engine
  sign: string;
}

export default function ClimateGauge({ illumination, sign }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ClimateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchClimate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: err } = await supabase.functions.invoke<ClimateResponse>(
        "calculate-climate",
        { body: { illumination: illumination / 100, zodiac_sign: sign } },
      );
      if (err) throw err;
      if (res) setData(res);
    } catch (e) {
      setError((e as Error).message || "Could not compute climate");
    } finally {
      setLoading(false);
    }
  };

  const score = data?.climate_score ?? 0;
  // Calm dark-themed arc: 240° sweep
  const radius = 80;
  const circumference = Math.PI * radius * (240 / 180);
  const dash = (score / 100) * circumference;

  return (
    <GlassmorphismCard className="animate-fade-up">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg tracking-widest text-foreground uppercase">
          Today's Frequency
        </h2>
      </div>

      {!data && !loading && (
        <div className="flex flex-col items-center py-6">
          <p className="font-serif text-base text-cream-muted text-center mb-6 max-w-md">
            Compute your Emotional Climate score: a 0–100 reading derived from
            illumination, lunar sign element, and proximity to the next transition.
          </p>
          <button
            onClick={fetchClimate}
            className="px-6 py-3 rounded-full border border-primary/40 text-primary font-display text-sm tracking-widest uppercase hover:bg-primary/10 transition-colors"
          >
            View Today's Frequency
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-12 text-cream-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <span className="font-serif text-sm">Reading the sky…</span>
        </div>
      )}

      {error && (
        <p className="text-center font-serif text-sm text-destructive py-4">{error}</p>
      )}

      {data && !loading && (
        <div className="flex flex-col items-center py-4">
          {/* Calm dark gauge */}
          <svg
            viewBox="0 0 200 140"
            className={`w-64 h-44 rounded-full ${data.breakdown.volatility_alert ? "animate-amber-pulse" : ""}`}
          >
            <defs>
              <linearGradient id="climateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary) / 0.4)" />
                <stop offset="100%" stopColor="hsl(var(--primary))" />
              </linearGradient>
            </defs>
            {/* Track */}
            <path
              d="M 20 120 A 80 80 0 1 1 180 120"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.4"
            />
            {/* Value */}
            <path
              d="M 20 120 A 80 80 0 1 1 180 120"
              fill="none"
              stroke="url(#climateGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: "stroke-dasharray 1s ease-out" }}
            />
            <text
              x="100"
              y="100"
              textAnchor="middle"
              className="fill-primary font-display"
              style={{ fontSize: "36px" }}
            >
              {score}
            </text>
            <text
              x="100"
              y="122"
              textAnchor="middle"
              className="fill-muted-foreground font-serif"
              style={{ fontSize: "10px", letterSpacing: "0.2em" }}
            >
              CLIMATE
            </text>
          </svg>

          {/* Status indicator */}
          <div className="flex items-center gap-2 mt-3">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                data.breakdown.volatility_alert
                  ? "bg-amber-400 animate-pulse shadow-[0_0_8px_hsl(38_92%_60%/0.6)]"
                  : "bg-primary/70"
              }`}
            />
            <span className="font-display text-xs tracking-[0.25em] uppercase text-cream-muted">
              Status: {data.breakdown.volatility_alert ? (
                <span className="text-amber-300">Transitioning</span>
              ) : (
                <span className="text-foreground">Stable</span>
              )}
            </span>
          </div>

          {data.breakdown.volatility_alert && (
            <div className="flex items-center gap-2 px-4 py-2 mt-3 rounded-full border border-amber-400/30 bg-amber-400/5">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span className="font-serif text-sm text-cream-muted">
                Volatility window — sign transition within 2h (+15)
              </span>
            </div>
          )}

          <div className="border-t border-primary/10 pt-5 mt-5 w-full">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 font-serif text-sm text-cream-muted">
              <dt>Illumination</dt>
              <dd className="text-right text-foreground">
                {Math.round(data.breakdown.illumination * 100)}% (+{data.breakdown.phase_contribution})
              </dd>
              <dt>Sign · Element</dt>
              <dd className="text-right text-foreground">
                {data.breakdown.sign} · {data.breakdown.element} ({data.breakdown.sign_weight >= 0 ? "+" : ""}{data.breakdown.sign_weight})
              </dd>
              <dt>Next transition</dt>
              <dd className="text-right text-foreground">
                in {data.breakdown.hours_until_next_transition}h
              </dd>
              <dt>Volatility (V)</dt>
              <dd className="text-right text-foreground">+{data.breakdown.volatility_offset}</dd>
            </dl>
            <p className="mt-4 font-serif text-xs text-muted-foreground text-center italic">
              {data.formula}
            </p>
          </div>
        </div>
      )}
    </GlassmorphismCard>
  );
}
