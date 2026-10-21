import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import {
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
import DisclosureButton from "@/components/DisclosureButton";
import { subscribeTestDate } from "@/lib/testMode";
import { cachedTriad, resolvePulseNow } from "@/lib/pulseClock";
import type { ForYouLine, LensKey } from "@/lib/lensesPersonal";

/* ────────────────────────────────────────────────────────────
   Daily Pulse — Nouveau-Deco lens panel
   Three lenses · alignment verdict · Sovereign Synthesis
   Tone: artisan-tech. Never fate-based, never fear-based.
   Sign attributes + synthesis live in @/lib/pulseSynthesis.
   ──────────────────────────────────────────────────────────── */


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

/** Explicit columns so the shared detail panel can span the row below the cards. */
const COLUMN_START = ["md:col-start-1", "md:col-start-2", "md:col-start-3"];

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
    eyebrow: "Sidereal",
    title: "The Inner Weather",
    subtitle: "How the day moves through you.",
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

/** Alignment details for one lens. Always in the HTML (hidden until opened) so
 *  crawlers can read it. On phones it sits directly under its card; from md up
 *  it spans the full width below the three cards. */
function LensDetail({
  lens,
  triad,
  id,
  open,
  className = "",
}: {
  lens: LensSpec;
  triad: TriadMoon;
  id: string;
  open: boolean;
  className?: string;
}) {
  const sign = lens.pickSign(triad);
  const attr = getLensAttribute(lens.register, sign);
  return (
    <div
      id={id}
      role="region"
      aria-label={`${lens.title} details`}
      hidden={!open}
      className={`mx-auto w-full max-w-2xl rounded-sm border border-[hsl(var(--lime-accent)/0.4)] bg-[hsl(var(--navy-dark)/0.55)] p-4 sm:p-6 text-left animate-fade-in ${className}`}
    >
      <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--lime-accent))] mb-2 text-center">
        {lens.title} in {sign}
      </div>
      <DecoDivider />
      <p className="font-sans font-normal normal-case text-base leading-relaxed text-[hsl(var(--lime-accent-light))] text-left mb-3">
        {attr.headline}
      </p>
      <p className="text-[14px] leading-relaxed text-[hsl(var(--cream)/0.85)] text-left">
        {attr.detail}
      </p>
      <div className="mt-4 mx-auto max-w-md text-left text-[12px] italic text-[hsl(var(--cream)/0.7)] border-t border-[hsl(var(--lime-accent)/0.25)] pt-3">
        <span className="not-italic uppercase tracking-[0.3em] text-[10px] text-[hsl(var(--lime-accent))] block mb-1">
          Practice
        </span>
        {attr.practice}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--cream)/0.55)]">
        <div>
          <div className="text-[hsl(var(--lime-accent))]">Position</div>
          <div className="mt-1 tabular-nums">{lens.position(triad)}</div>
        </div>
        <div>
          <div className="text-[hsl(var(--lime-accent))]">Element</div>
          <div className="mt-1">{SIGN_ELEMENT[sign]}</div>
        </div>
        <div>
          <div className="text-[hsl(var(--lime-accent))]">Modality</div>
          <div className="mt-1">{SIGN_MODALITY[sign]}</div>
        </div>
      </div>
    </div>
  );
}

interface DailyPulseProps {
  /** Hard date override (test mode bypass). */
  at?: Date;
  /** Anchor to UTC noon (used for the public global teaser). */
  useUtcNoon?: boolean;
  className?: string;
  /** Member-only "For you" line per lens card (Lenses page). */
  forYou?: Partial<Record<LensKey, ForYouLine>>;
  /** Replaces the generic Luminary Synthesis box (Lenses page). */
  synthesisSlot?: ReactNode;
  /** IANA zone for the date label (the member's timezone). */
  timeZone?: string;
}

export default function DailyPulse({
  at,
  useUtcNoon = false,
  className = "",
  forYou,
  synthesisSlot,
  timeZone,
}: DailyPulseProps) {
  const resolveNow = (): Date => resolvePulseNow({ at, useUtcNoon });

  const [now, setNow] = useState<Date>(resolveNow);
  const [openLens, setOpenLens] = useState<LensKey | null>(null);

  // A parent-supplied clock (Lenses page) drives the Moon directly.
  useEffect(() => {
    if (at) setNow(at);
  }, [at]);

  // Subscribe to Test Mode changes from the footer toggle.
  useEffect(() => {
    if (at) return;
    const refresh = () => setNow(resolveNow());
    const unsub = subscribeTestDate(refresh);
    const id = setInterval(refresh, 5 * 60 * 1000);
    return () => {
      unsub();
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, useUtcNoon]);

  const triad = useMemo(() => cachedTriad(now), [now]);
  const signs = LENSES.map((l) => l.pickSign(triad));
  const verdict = alignmentVerdict(signs);
  const synthesis = useMemo(() => generateSynthesis(triad), [triad]);

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: useUtcNoon ? "UTC" : timeZone,
  });

  return (
    <TooltipProvider delayDuration={150}>
      <section
        aria-label="Daily Pulse"
        className={`relative sm:overflow-hidden sm:rounded-sm sm:border sm:border-[hsl(var(--gold-medium)/0.45)] sm:bg-[hsl(var(--navy-deep))] sm:p-8 text-center ${className}`}
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
                className={`group inline-flex items-center gap-2 rounded-sm border px-4 py-1.5 text-[11px] uppercase tracking-[0.35em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--lime-accent))] ${
                  verdict.tone === "divergent"
                    ? "border-[hsl(var(--lime-accent)/0.55)] text-[hsl(var(--lime-accent-light))] hover:bg-[hsl(var(--lime-accent)/0.08)]"
                    : "border-[hsl(var(--gold-medium)/0.6)] text-[hsl(var(--gold-light))] hover:bg-[hsl(var(--gold-medium)/0.08)]"
                }`}
                aria-label={`${verdict.label}. ${verdict.tooltip}`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    verdict.tone === "divergent"
                      ? "bg-[hsl(var(--lime-accent-light))]"
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
          {LENSES.map((lens, index) => {
            const sign = lens.pickSign(triad);
            const isOpen = openLens === lens.key;
            const detailId = `lens-detail-${lens.key}`;
            return (
              <Fragment key={lens.key}>
              {/* The whole card is tappable; the button inside is the accessible control. */}
              <div
                onClick={() => setOpenLens(isOpen ? null : lens.key)}
                className={`group relative h-full flex flex-col rounded-sm border p-4 sm:p-5 text-center transition-all cursor-pointer md:row-start-1 ${COLUMN_START[index]} ${
                  isOpen
                    ? "border-[hsl(var(--lime-accent)/0.7)] bg-[hsl(var(--navy-dark)/0.85)]"
                    : "border-[hsl(var(--gold-medium)/0.3)] bg-[hsl(var(--navy-dark)/0.6)] hover:border-[hsl(var(--gold-medium)/0.55)] hover:bg-[hsl(var(--navy-dark)/0.8)]"
                }`}
              >
                <div className={`font-display text-[11px] tracking-[0.4em] mb-1 ${isOpen ? "text-[hsl(var(--lime-accent))]" : "text-[hsl(var(--gold-medium))]"}`}>
                  {lens.numeral}
                </div>
                <div className={`text-[9px] uppercase tracking-[0.3em] mb-2 ${isOpen ? "text-[hsl(var(--lime-accent))]" : "text-[hsl(var(--cream)/0.5)]"}`}>
                  {lens.eyebrow}
                </div>
                <h3 className={`font-display text-base sm:text-lg tracking-wide min-h-[3.5rem] flex items-center justify-center ${isOpen ? "text-[hsl(var(--lime-accent-light))]" : "text-[hsl(var(--cream))]"}`}>
                  {lens.title}
                </h3>
                <p className={`mt-1 text-[12px] leading-snug min-h-[2.5rem] text-left ${isOpen ? "text-[hsl(var(--cream)/0.85)]" : "text-[hsl(var(--cream)/0.6)] italic"}`}>
                  {lens.subtitle}
                </p>
                <div className="mt-auto pt-4">
                  <div className={`mb-4 mx-auto h-px w-10 ${isOpen ? "bg-[hsl(var(--lime-accent)/0.5)]" : "bg-[hsl(var(--gold-medium)/0.5)]"}`} />
                  <div className={`font-display text-lg tabular-nums ${isOpen ? "text-[hsl(var(--lime-accent-light))]" : "text-[hsl(var(--gold-light))]"}`}>
                    {sign}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--cream)/0.45)] tabular-nums">
                    {lens.position(triad)}
                  </div>
                  <div className={`mt-1 text-[9px] uppercase tracking-[0.3em] ${isOpen ? "text-[hsl(var(--lime-accent))]" : "text-[hsl(var(--cream)/0.35)]"}`}>
                    {SIGN_ELEMENT[sign]} · {SIGN_MODALITY[sign]}
                  </div>
                  {forYou?.[lens.key] && (
                    <div className="mt-4 rounded-xl border border-violet-400/30 bg-violet-500/5 px-3 py-3 text-left">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-violet-300 mb-1.5">
                        For you
                      </div>
                      <p className="text-left text-[12px] font-medium normal-case tracking-normal leading-snug text-violet-200/90 mb-1">
                        {forYou[lens.key]!.label}
                      </p>
                      <p className="text-left text-[13px] normal-case tracking-normal leading-relaxed text-[hsl(var(--cream)/0.8)]">
                        {forYou[lens.key]!.text}
                      </p>
                    </div>
                  )}
                  <DisclosureButton open={isOpen} controls={detailId} className="mt-4 w-full sm:w-auto" />
                </div>
              </div>
              <LensDetail
                lens={lens}
                triad={triad}
                id={detailId}
                open={isOpen}
                className="md:col-span-3 md:col-start-1 md:row-start-2"
              />
              </Fragment>
            );
          })}
        </div>

        {synthesisSlot ?? (
          <div className="mx-auto max-w-2xl rounded-sm border border-[hsl(var(--gold-medium)/0.35)] bg-[hsl(var(--navy-dark)/0.4)] p-4 sm:p-6 text-center">
            <div className="text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--gold-medium))] mb-1">
              Luminary Synthesis
            </div>
            <div className="text-[11px] italic text-[hsl(var(--cream)/0.55)] mb-3 text-center">
              {synthesis.subtitle}
            </div>
            <p className="text-[14px] sm:text-[15px] leading-relaxed text-[hsl(var(--cream)/0.85)] text-left">
              {synthesis.body}
            </p>
            {synthesis.frictionCue && (
              <div className="mt-4 mx-auto max-w-lg text-left text-sm leading-relaxed normal-case tracking-normal text-[hsl(var(--gold-medium)/0.95)] border-t border-[hsl(var(--gold-medium)/0.3)] pt-3">
                {synthesis.frictionCue}
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-sm leading-relaxed text-[hsl(var(--cream)/0.55)] normal-case tracking-normal text-left">
          No predictions here. The simulation runs on probabilities — you're the one who collapses the wavefunction into your next reality.
        </p>
      </section>
    </TooltipProvider>
  );
}

function DecoDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-5" aria-hidden>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-[hsl(var(--gold-medium)/0.7)]" />
      <span className="text-[hsl(var(--gold-medium))] text-xs">✦</span>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-[hsl(var(--gold-medium)/0.7)]" />
    </div>
  );
}

function DecoCorners() {
  const cls = "pointer-events-none absolute hidden sm:block h-5 w-5 border-[hsl(var(--gold-medium)/0.7)]";
  return (
    <>
      <span className={`${cls} top-2 left-2 border-t border-l`} aria-hidden />
      <span className={`${cls} top-2 right-2 border-t border-r`} aria-hidden />
      <span className={`${cls} bottom-2 left-2 border-b border-l`} aria-hidden />
      <span className={`${cls} bottom-2 right-2 border-b border-r`} aria-hidden />
    </>
  );
}
