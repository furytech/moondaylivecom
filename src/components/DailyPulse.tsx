import { useEffect, useMemo, useState } from "react";
import {
  computeTriadMoon,
  SIGN_ELEMENT,
  SIGN_MODALITY,
  type TriadMoon,
  type ZodiacSign,
} from "@/lib/sovereignEngine";
import {
  generateSynthesis,
  getLensAttribute,
  type LensRegister,
} from "@/lib/pulseSynthesis";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown } from "lucide-react";
import { getTestDate, subscribeTestDate, utcNoon } from "@/lib/testMode";

/* ────────────────────────────────────────────────────────────
   Daily Pulse — Nouveau-Deco lens panel
   Three lenses · alignment verdict · Sovereign Synthesis
   Tone: artisan-tech. Never fate-based, never fear-based.
   Sign attributes + synthesis live in @/lib/pulseSynthesis.
   ──────────────────────────────────────────────────────────── */

type LensKey = "social" | "internal" | "soul";

interface LensSpec {
  key: LensKey;
  register: LensRegister;
  numeral: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  pickSign: (t: TriadMoon) => ZodiacSign;
  position: (t: TriadMoon) => string;
}

const LENSES: LensSpec[] = [
  {
    key: "social",
    register: "tropical",
    numeral: "I",
    eyebrow: "Lens One · Tropical",
    title: "The Social Atmosphere",
    subtitle: "The shared weather of the room.",
    pickSign: (t) => t.tropical.sign,
    position: (t) => t.tropical.formatted,
  },
  {
    key: "internal",
    register: "sidereal",
    numeral: "II",
    eyebrow: "Lens Two · Sidereal",
    title: "The Internal Nervous System",
    subtitle: "The wiring beneath the surface.",
    pickSign: (t) => t.sidereal.sign,
    position: (t) => t.sidereal.formatted,
  },
  {
    key: "soul",
    register: "draconic",
    numeral: "III",
    eyebrow: "Lens Three · Draconic",
    title: "The Soul's Intent",
    subtitle: "The quiet vector of becoming.",
    pickSign: (t) => t.draconic.sign,
    position: (t) => t.draconic.formatted,
  },
];

function alignmentVerdict(signs: ZodiacSign[]): {
  label: "Divergent Alignment" | "Unified Intensity";
  tone: "divergent" | "unified";
  tooltip: string;
} {
  const unique = new Set(signs);
  if (unique.size === 3) {
    return {
      label: "Divergent Alignment",
      tone: "divergent",
      tooltip:
        "Three lenses, three signs — a day for Layered Navigation. Move between registers rather than forcing a single voice.",
    };
  }
  return {
    label: "Unified Intensity",
    tone: "unified",
    tooltip:
      "Two or more lenses share a sign. Signal concentrates — fewer registers, more amplitude. Move with deliberate weight.",
  };
}

/* ── Triad cache: one hour bucket per UTC hour, keyed by ISO hour. ── */
const triadCache = new Map<string, TriadMoon>();
function cachedTriad(at: Date): TriadMoon {
  const key = `${at.getUTCFullYear()}-${at.getUTCMonth()}-${at.getUTCDate()}-${at.getUTCHours()}`;
  let v = triadCache.get(key);
  if (!v) {
    v = computeTriadMoon(at);
    triadCache.set(key, v);
    if (triadCache.size > 64) {
      const firstKey = triadCache.keys().next().value;
      if (firstKey) triadCache.delete(firstKey);
    }
  }
  return v;
}

interface DailyPulseProps {
  /** Hard date override (test mode bypass). */
  at?: Date;
  /** Anchor to UTC noon (used for the public global teaser). */
  useUtcNoon?: boolean;
  className?: string;
}

export default function DailyPulse({ at, useUtcNoon = false, className = "" }: DailyPulseProps) {
  const resolveNow = (): Date => {
    if (at) return at;
    const test = getTestDate();
    if (test) return useUtcNoon ? utcNoon(test) : test;
    return useUtcNoon ? utcNoon(new Date()) : new Date();
  };

  const [now, setNow] = useState<Date>(resolveNow);
  const [openLens, setOpenLens] = useState<LensKey | null>(null);

  // Subscribe to Test Mode changes from the footer toggle.
  useEffect(() => {
    if (at) return;
    const refresh = () => setNow(resolveNow());
    const unsub = subscribeTestDate(refresh);
    const id = setInterval(refresh, 60 * 60 * 1000);
    return () => {
      unsub();
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, useUtcNoon]);

  const triad = useMemo(() => cachedTriad(now), [now]);
  const signs = LENSES.map((l) => l.pickSign(triad));
  const verdict = alignmentVerdict(signs);
  const synthesis = useMemo(() => synthesize(triad, now), [triad, now]);

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: useUtcNoon ? "UTC" : undefined,
  });

  return (
    <TooltipProvider delayDuration={150}>
      <section
        aria-label="Daily Pulse"
        className={`relative overflow-hidden rounded-sm border border-[hsl(var(--gold-medium)/0.45)] bg-[hsl(var(--navy-deep))] p-6 sm:p-8 text-center ${className}`}
      >
        <DecoCorners />

        <div className="text-[10px] uppercase tracking-[0.55em] text-[hsl(var(--gold-medium))] mb-2">
          Daily Pulse
        </div>
        <h2 className="font-display text-2xl sm:text-3xl tracking-[0.08em] text-[hsl(var(--cream))]">
          Three Lenses · One Moon
        </h2>
        <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-[hsl(var(--cream)/0.55)]">
          {dateLabel}
          {useUtcNoon && <span className="ml-2 text-[hsl(var(--gold-medium))]">· UTC Pulse</span>}
        </p>
        <DecoDivider />

        <div className="flex justify-center mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={`group inline-flex items-center gap-2 rounded-sm border px-4 py-1.5 text-[11px] uppercase tracking-[0.35em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold-medium))] ${
                  verdict.tone === "divergent"
                    ? "border-[hsl(var(--lilac)/0.55)] text-[hsl(var(--lilac-light))] hover:bg-[hsl(var(--lilac)/0.08)]"
                    : "border-[hsl(var(--gold-medium)/0.6)] text-[hsl(var(--gold-light))] hover:bg-[hsl(var(--gold-medium)/0.08)]"
                }`}
                aria-label={`${verdict.label}. ${verdict.tooltip}`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    verdict.tone === "divergent"
                      ? "bg-[hsl(var(--lilac-light))]"
                      : "bg-[hsl(var(--gold-light))]"
                  }`}
                />
                {verdict.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
              {verdict.tooltip}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-3 mb-6">
          {LENSES.map((lens) => {
            const sign = lens.pickSign(triad);
            const isOpen = openLens === lens.key;
            return (
              <button
                key={lens.key}
                type="button"
                onClick={() => setOpenLens(isOpen ? null : lens.key)}
                aria-expanded={isOpen}
                aria-controls={`lens-detail-${lens.key}`}
                className={`group relative h-full flex flex-col rounded-sm border p-5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold-medium))] ${
                  isOpen
                    ? "border-[hsl(var(--gold-medium)/0.7)] bg-[hsl(var(--navy-dark)/0.85)]"
                    : "border-[hsl(var(--gold-medium)/0.3)] bg-[hsl(var(--navy-dark)/0.6)] hover:border-[hsl(var(--gold-medium)/0.55)] hover:bg-[hsl(var(--navy-dark)/0.8)]"
                }`}
              >
                <div className="font-display text-[11px] tracking-[0.4em] text-[hsl(var(--gold-medium))] mb-1">
                  {lens.numeral}
                </div>
                <div className="text-[9px] uppercase tracking-[0.3em] text-[hsl(var(--cream)/0.5)] mb-2">
                  {lens.eyebrow}
                </div>
                <h3 className="font-display text-base sm:text-lg tracking-wide text-[hsl(var(--cream))] min-h-[3.5rem] flex items-center justify-center">
                  {lens.title}
                </h3>
                <p className="mt-1 text-[12px] italic text-[hsl(var(--cream)/0.6)] leading-snug min-h-[2.5rem]">
                  {lens.subtitle}
                </p>
                <div className="mt-auto pt-4">
                  <div className="mb-4 mx-auto h-px w-10 bg-[hsl(var(--gold-medium)/0.5)]" />
                  <div className="font-display text-lg text-[hsl(var(--gold-light))] tabular-nums">
                    {sign}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--cream)/0.45)] tabular-nums">
                    {lens.position(triad)}
                  </div>
                  <div className="mt-1 text-[9px] uppercase tracking-[0.3em] text-[hsl(var(--cream)/0.35)]">
                    {SIGN_ELEMENT[sign]} · {SIGN_MODALITY[sign]}
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.3em] text-[hsl(var(--gold-medium)/0.8)]">
                    {isOpen ? "Hide details" : "Expose alignment details"}
                    <ChevronDown
                      size={11}
                      className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {openLens && (
          <div
            id={`lens-detail-${openLens}`}
            role="region"
            aria-label="Alignment details"
            className="mx-auto max-w-2xl mb-8 rounded-sm border border-[hsl(var(--gold-medium)/0.4)] bg-[hsl(var(--navy-dark)/0.55)] p-5 sm:p-6 text-left animate-fade-in"
          >
            {(() => {
              const lens = LENSES.find((l) => l.key === openLens)!;
              const sign = lens.pickSign(triad);
              return (
                <>
                  <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--gold-medium))] mb-2 text-center">
                    Why · {lens.title} in {sign}
                  </div>
                  <DecoDivider />
                  <p className="text-[14px] leading-relaxed text-[hsl(var(--cream)/0.85)] text-center">
                    {lens.why(sign)}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--cream)/0.55)]">
                    <div>
                      <div className="text-[hsl(var(--gold-medium))]">Position</div>
                      <div className="mt-1 tabular-nums">{lens.position(triad)}</div>
                    </div>
                    <div>
                      <div className="text-[hsl(var(--gold-medium))]">Element</div>
                      <div className="mt-1">{SIGN_ELEMENT[sign]}</div>
                    </div>
                    <div>
                      <div className="text-[hsl(var(--gold-medium))]">Modality</div>
                      <div className="mt-1">{SIGN_MODALITY[sign]}</div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        <div className="mx-auto max-w-2xl rounded-sm border border-[hsl(var(--gold-medium)/0.35)] bg-[hsl(var(--navy-dark)/0.4)] p-5 sm:p-6 text-center">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--gold-medium))] mb-3">
            Sovereign Synthesis
          </div>
          <p className="text-[14px] sm:text-[15px] leading-relaxed text-[hsl(var(--cream)/0.85)]">
            {synthesis}
          </p>
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--cream)/0.4)]">
          For self-reflection and learning · Not predictive
        </p>
      </section>
    </TooltipProvider>
  );
}

function DecoDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-5" aria-hidden>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-[hsl(var(--gold-medium)/0.7)]" />
      <span className="inline-block h-2 w-2 rotate-45 border border-[hsl(var(--gold-medium))]" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-[hsl(var(--gold-medium)/0.7)]" />
    </div>
  );
}

function DecoCorners() {
  const cls = "pointer-events-none absolute h-5 w-5 border-[hsl(var(--gold-medium)/0.7)]";
  return (
    <>
      <span className={`${cls} top-2 left-2 border-t border-l`} aria-hidden />
      <span className={`${cls} top-2 right-2 border-t border-r`} aria-hidden />
      <span className={`${cls} bottom-2 left-2 border-b border-l`} aria-hidden />
      <span className={`${cls} bottom-2 right-2 border-b border-r`} aria-hidden />
    </>
  );
}
