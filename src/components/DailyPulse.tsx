import { useEffect, useMemo, useState } from "react";
import { computeTriadMoon, SIGN_ELEMENT, type TriadMoon, type ZodiacSign } from "@/lib/sovereignEngine";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/* ────────────────────────────────────────────────────────────
   Daily Pulse — Nouveau-Deco lens panel
   Three lenses (Tropical · Sidereal · Draconic), an alignment
   verdict, and a Sovereign Synthesis paragraph. Tone: artisan-tech.
   ──────────────────────────────────────────────────────────── */

type LensKey = "social" | "internal" | "soul";

interface LensSpec {
  key: LensKey;
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
    numeral: "I",
    eyebrow: "Lens One · Tropical",
    title: "The Social Atmosphere",
    subtitle: "The shared weather of the room.",
    pickSign: (t) => t.tropical.sign,
    position: (t) => t.tropical.formatted,
  },
  {
    key: "internal",
    numeral: "II",
    eyebrow: "Lens Two · Sidereal",
    title: "The Internal System",
    subtitle: "The wiring beneath the surface.",
    pickSign: (t) => t.sidereal.sign,
    position: (t) => t.sidereal.formatted,
  },
  {
    key: "soul",
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
        "Three lenses, three signs. A day for Layered Navigation — move between registers rather than forcing a single voice.",
    };
  }
  return {
    label: "Unified Intensity",
    tone: "unified",
    tooltip:
      "Two or more lenses share a sign. Signal concentrates — fewer registers, more amplitude. Move with deliberate weight.",
  };
}

function synthesize(triad: TriadMoon): string {
  const social = triad.tropical.sign;
  const internal = triad.sidereal.sign;
  const soul = triad.draconic.sign;
  const sameSI = social === internal;
  const sameID = internal === soul;
  const sameSD = social === soul;
  const allSame = sameSI && sameID;

  if (allSame) {
    return `All three lenses converge in ${social}. The room, the wiring, and the underlying vector are speaking one language — a rare clean channel. Move with measured confidence; refinement matters more than novelty.`;
  }

  const elInternal = SIGN_ELEMENT[internal];
  const elSocial = SIGN_ELEMENT[social];
  const flow = elInternal === elSocial;

  if (sameID && !sameSI) {
    return `The internal system (${internal}) and the soul's intent (${soul}) move as one, while the social atmosphere wears ${social}. Expect a quiet certainty underneath that does not need to perform itself outwardly. Let the room have its weather; keep your craft.`;
  }
  if (sameSI && !sameID) {
    return `Outside and inside both wear ${social}, but the soul is reaching toward ${soul}. The day will feel coherent and productive, with a low, persistent pull toward something the schedule does not name. Honor it after the work is done.`;
  }
  if (sameSD && !sameSI) {
    return `The room and the soul share ${social}, framing an internal system tuned to ${internal}. Public action and deeper direction agree; the friction is technical, not directional. Adjust the instrument, not the song.`;
  }

  return `An internal ${internal} spark meets an external ${social} climate, with the soul angling toward ${soul}. ${
    flow
      ? `Both registers share an elemental key (${elInternal}), so the friction is one of tempo rather than translation — match cadence and the day opens.`
      : `Two distinct elements are at play (${elInternal} inside, ${elSocial} outside), so the work is translation: render internal motion in a vocabulary the room can receive.`
  } Treat divergence as instrumentation, not obstacle.`;
}

interface DailyPulseProps {
  /** Optional override for testing; defaults to live "now" and refreshes hourly. */
  at?: Date;
  className?: string;
}

export default function DailyPulse({ at, className = "" }: DailyPulseProps) {
  const [now, setNow] = useState<Date>(at ?? new Date());

  useEffect(() => {
    if (at) return;
    const id = setInterval(() => setNow(new Date()), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [at]);

  const triad = useMemo(() => computeTriadMoon(now), [now]);
  const signs = LENSES.map((l) => l.pickSign(triad));
  const verdict = alignmentVerdict(signs);
  const synthesis = synthesize(triad);

  return (
    <TooltipProvider delayDuration={150}>
      <section
        aria-label="Daily Pulse"
        className={`relative overflow-hidden rounded-sm border border-[hsl(var(--gold-medium)/0.45)] bg-[hsl(var(--navy-deep))] p-6 sm:p-8 text-center ${className}`}
      >
        {/* Deco corner ornaments */}
        <DecoCorners />

        <div className="text-[10px] uppercase tracking-[0.55em] text-[hsl(var(--gold-medium))] mb-2">
          Daily Pulse
        </div>
        <h2 className="font-display text-2xl sm:text-3xl tracking-[0.08em] text-[hsl(var(--cream))]">
          Three Lenses · One Moon
        </h2>
        <DecoDivider />

        <div className="flex justify-center mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={`group inline-flex items-center gap-2 rounded-sm border px-4 py-1.5 text-[11px] uppercase tracking-[0.35em] transition-colors ${
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

        <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-3 mb-8">
          {LENSES.map((lens) => {
            const sign = lens.pickSign(triad);
            return (
              <article
                key={lens.key}
                className="relative rounded-sm border border-[hsl(var(--gold-medium)/0.3)] bg-[hsl(var(--navy-dark)/0.6)] p-5 text-center"
              >
                <div className="font-display text-[11px] tracking-[0.4em] text-[hsl(var(--gold-medium))] mb-1">
                  {lens.numeral}
                </div>
                <div className="text-[9px] uppercase tracking-[0.3em] text-[hsl(var(--cream)/0.5)] mb-2">
                  {lens.eyebrow}
                </div>
                <h3 className="font-display text-base sm:text-lg tracking-wide text-[hsl(var(--cream))]">
                  {lens.title}
                </h3>
                <p className="mt-1 text-[12px] italic text-[hsl(var(--cream)/0.6)] leading-snug">
                  {lens.subtitle}
                </p>
                <div className="my-4 mx-auto h-px w-10 bg-[hsl(var(--gold-medium)/0.5)]" />
                <div className="font-display text-lg text-[hsl(var(--gold-light))] tabular-nums">
                  {sign}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--cream)/0.45)] tabular-nums">
                  {lens.position(triad)}
                </div>
                <div className="mt-1 text-[9px] uppercase tracking-[0.3em] text-[hsl(var(--cream)/0.35)]">
                  {SIGN_ELEMENT[sign]}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mx-auto max-w-2xl rounded-sm border border-[hsl(var(--gold-medium)/0.35)] bg-[hsl(var(--navy-dark)/0.4)] p-5 sm:p-6 text-center">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--gold-medium))] mb-3">
            Sovereign Synthesis
          </div>
          <p className="text-[14px] sm:text-[15px] leading-relaxed text-[hsl(var(--cream)/0.85)]">
            {synthesis}
          </p>
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--cream)/0.4)]">
          For self-reflection · Not predictive
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
  const cls =
    "pointer-events-none absolute h-5 w-5 border-[hsl(var(--gold-medium)/0.7)]";
  return (
    <>
      <span className={`${cls} top-2 left-2 border-t border-l`} aria-hidden />
      <span className={`${cls} top-2 right-2 border-t border-r`} aria-hidden />
      <span className={`${cls} bottom-2 left-2 border-b border-l`} aria-hidden />
      <span className={`${cls} bottom-2 right-2 border-b border-r`} aria-hidden />
    </>
  );
}
