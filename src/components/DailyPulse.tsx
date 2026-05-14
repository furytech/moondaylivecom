import { useEffect, useMemo, useState } from "react";
import {
  computeTriadMoon,
  SIGN_ELEMENT,
  SIGN_MODALITY,
  type TriadMoon,
  type ZodiacSign,
} from "@/lib/sovereignEngine";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown } from "lucide-react";
import { getTestDate, subscribeTestDate, utcNoon } from "@/lib/testMode";

/* ────────────────────────────────────────────────────────────
   Daily Pulse — Nouveau-Deco lens panel
   Three lenses · alignment verdict · Sovereign Synthesis
   Tone: artisan-tech. Never fate-based, never fear-based.
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
  why: (sign: ZodiacSign) => string;
}

const SOCIAL_WHY: Record<ZodiacSign, string> = {
  Aries: "The room favors initiation — short, decisive openings outperform careful preambles.",
  Taurus: "The room rewards stability — measured pace, tactile work, durable commitments.",
  Gemini: "The room moves through exchange — multiple short loops outperform one long monologue.",
  Cancer: "The room is sensitive to belonging — soft framing carries more weight than logic.",
  Leo: "The room invites visible authorship — own the work in your name, not in passive voice.",
  Virgo: "The room rewards refinement — small calibrations compound into large clarity.",
  Libra: "The room asks for proportion — balance opposing inputs before naming the verdict.",
  Scorpio: "The room runs deeper than its surface — what is unsaid is doing most of the work.",
  Sagittarius: "The room widens — long-range framing lands better than tactical detail today.",
  Capricorn: "The room rewards structure — show the architecture, not just the intention.",
  Aquarius: "The room thinks in systems — propose the principle, then the example.",
  Pisces: "The room dissolves edges — meaning travels through tone, image, and pause.",
};

const INTERNAL_WHY: Record<ZodiacSign, string> = {
  Aries: "Your nervous system is primed to initiate. Discharge through one clean action, not many half-starts.",
  Taurus: "Your wiring wants traction. Choose fewer inputs and let your senses calibrate the work.",
  Gemini: "Your wiring is in scan mode. Capture quickly; sort later. Resist premature synthesis.",
  Cancer: "Your inner barometer is reading the room. Honor the data; don't argue with the feeling.",
  Leo: "Your wiring wants expression. Performance is regulation today, not vanity.",
  Virgo: "Your nervous system is in audit mode. Useful for editing; punishing for first drafts.",
  Libra: "Your wiring is relational. Decisions made in solitude will need a second pass.",
  Scorpio: "Your wiring is concentrating. Depth is available; small talk will cost disproportionately.",
  Sagittarius: "Your wiring is expansive. Movement (literal or conceptual) restores signal.",
  Capricorn: "Your wiring is load-bearing. You can carry weight today — choose what is worth carrying.",
  Aquarius: "Your wiring is pattern-seeking. Step back two paces before any close-up decision.",
  Pisces: "Your wiring is permeable. Curate your inputs; you'll absorb whichever room you sit in.",
};

const SOUL_WHY: Record<ZodiacSign, string> = {
  Aries: "The underlying pull is toward beginning — a quiet authorization to start something only you can.",
  Taurus: "The underlying pull is toward worth — re-anchoring in what is already, slowly, yours.",
  Gemini: "The underlying pull is toward connection — a thread between two ideas wants to be named.",
  Cancer: "The underlying pull is toward home — interior, not real-estate. Tend the inner room.",
  Leo: "The underlying pull is toward authorship — claim the line that has been waiting.",
  Virgo: "The underlying pull is toward service — useful work as a private devotion.",
  Libra: "The underlying pull is toward fairness — a quiet rebalancing of an old asymmetry.",
  Scorpio: "The underlying pull is toward truth — a willingness to look at what was tactfully averted.",
  Sagittarius: "The underlying pull is toward meaning — a wider story is reorganizing the small ones.",
  Capricorn: "The underlying pull is toward mastery — long arcs are rewarded over visible bursts.",
  Aquarius: "The underlying pull is toward the collective — your private work is in service of a larger weave.",
  Pisces: "The underlying pull is toward dissolution — letting an old definition soften into the next one.",
};

const LENSES: LensSpec[] = [
  {
    key: "social",
    numeral: "I",
    eyebrow: "Lens One · Tropical",
    title: "The Social Atmosphere",
    subtitle: "The shared weather of the room.",
    pickSign: (t) => t.tropical.sign,
    position: (t) => t.tropical.formatted,
    why: (s) => SOCIAL_WHY[s],
  },
  {
    key: "internal",
    numeral: "II",
    eyebrow: "Lens Two · Sidereal",
    title: "The Internal Nervous System",
    subtitle: "The wiring beneath the surface.",
    pickSign: (t) => t.sidereal.sign,
    position: (t) => t.sidereal.formatted,
    why: (s) => INTERNAL_WHY[s],
  },
  {
    key: "soul",
    numeral: "III",
    eyebrow: "Lens Three · Draconic",
    title: "The Soul's Intent",
    subtitle: "The quiet vector of becoming.",
    pickSign: (t) => t.draconic.sign,
    position: (t) => t.draconic.formatted,
    why: (s) => SOUL_WHY[s],
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

/** Curated synthesis overrides for specific dates (UTC). */
const SYNTHESIS_OVERRIDES: Record<string, string> = {
  "2026-05-14":
    "The day moves from the internal initiation of Sidereal Aries — a private spark that wants to begin something only you can name — into the external stability of Tropical Taurus, where the room rewards tactile, durable work. Underneath, a Draconic Aquarius soul-focus is quietly orienting the day toward collective cooperation: the small craft you complete today contributes to a larger weave you may not yet see. Begin alone, build in form, offer outward.",
};

function synthesize(triad: TriadMoon, when: Date): string {
  const key = `${when.getUTCFullYear()}-${String(when.getUTCMonth() + 1).padStart(2, "0")}-${String(when.getUTCDate()).padStart(2, "0")}`;
  if (SYNTHESIS_OVERRIDES[key]) return SYNTHESIS_OVERRIDES[key];

  const social = triad.tropical.sign;
  const internal = triad.sidereal.sign;
  const soul = triad.draconic.sign;
  const sameSI = social === internal;
  const sameID = internal === soul;
  const sameSD = social === soul;
  const allSame = sameSI && sameID;

  if (allSame) {
    return `All three lenses converge in ${social}. Room, wiring, and underlying vector are speaking one language — a rare clean channel. Move with measured confidence; refinement matters more than novelty.`;
  }
  if (sameID && !sameSI) {
    return `The internal system (${internal}) and the soul's intent (${soul}) move as one, while the social atmosphere wears ${social}. Expect a quiet certainty underneath that does not need to perform itself outwardly. Let the room have its weather; keep your craft.`;
  }
  if (sameSI && !sameID) {
    return `Outside and inside both wear ${social}, but the soul is reaching toward ${soul}. The day will feel coherent and productive, with a low, persistent pull toward something the schedule does not name. Honor it after the work is done.`;
  }
  if (sameSD && !sameSI) {
    return `Room and soul share ${social}, framing an internal system tuned to ${internal}. Public action and deeper direction agree; the friction is technical, not directional. Adjust the instrument, not the song.`;
  }

  const elInternal = SIGN_ELEMENT[internal];
  const elSocial = SIGN_ELEMENT[social];
  const flow = elInternal === elSocial;
  return `An internal ${internal} spark meets an external ${social} climate, with the soul angling toward ${soul}. ${
    flow
      ? `Both registers share an elemental key (${elInternal}), so the friction is tempo rather than translation — match cadence and the day opens.`
      : `Two distinct elements are at play (${elInternal} inside, ${elSocial} outside), so the work is translation: render internal motion in a vocabulary the room can receive.`
  } Treat divergence as instrumentation, not obstacle.`;
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
                className={`group relative rounded-sm border p-5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold-medium))] ${
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
