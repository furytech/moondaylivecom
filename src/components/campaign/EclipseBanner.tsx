import { useEffect, useState } from "react";
import { Moon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ECLIPSE_PEAK_UTC } from "@/content/campaigns/eclipseAug2026";

const pad = (n: number) => String(n).padStart(2, "0");

function useCountdown(targetIso: string) {
  const [ms, setMs] = useState(() => new Date(targetIso).getTime() - Date.now());
  useEffect(() => {
    const id = window.setInterval(
      () => setMs(new Date(targetIso).getTime() - Date.now()),
      1000
    );
    return () => window.clearInterval(id);
  }, [targetIso]);

  const past = ms <= 0;
  const abs = Math.abs(ms);
  return {
    past,
    days: Math.floor(abs / 86400000),
    hours: Math.floor((abs % 86400000) / 3600000),
    minutes: Math.floor((abs % 3600000) / 60000),
    seconds: Math.floor((abs % 60000) / 1000),
  };
}

interface Props {
  onCta?: () => void;
}

const EclipseBanner = ({ onCta }: Props) => {
  const { past, days, hours, minutes, seconds } = useCountdown(ECLIPSE_PEAK_UTC);

  const units = [
    { label: "Days", value: pad(days) },
    { label: "Hrs", value: pad(hours) },
    { label: "Min", value: pad(minutes) },
    { label: "Sec", value: pad(seconds) },
  ];

  return (
    <div className="sov-card sov-card--wide relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "hsl(var(--lilac) / 0.18)" }}
      />
      <div className="relative z-10 flex flex-col items-center gap-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          <Moon className="h-3.5 w-3.5" strokeWidth={1.5} />
          Live eclipse window
        </span>

        <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground">
          Deep Partial Lunar Eclipse in Pisces (96.2%)
        </h2>
        <p className="text-sm text-muted-foreground">
          Maximum umbral immersion 04:12 UTC, August 28, 2026
        </p>

        <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full max-w-md">
          {units.map((u) => (
            <div
              key={u.label}
              className="rounded-xl border border-primary/20 bg-background/40 px-2 py-3"
            >
              <div className="font-mono text-xl sm:text-3xl text-foreground tabular-nums">
                {u.value}
              </div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {u.label}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {past ? "Time since peak" : "Time to peak"}
        </p>

        <Button size="lg" className="group w-full sm:w-auto" onClick={onCta}>
          Calculate My Eclipse Impact
          <ArrowRight
            className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5"
            strokeWidth={1.5}
          />
        </Button>
      </div>
    </div>
  );
};

export default EclipseBanner;
