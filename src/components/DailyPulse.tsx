import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
import {
  SIGN_TRANSIT_GUIDANCE,
  calculateTriadProfileNumber,
  getNextTransitShift,
} from "@/lib/lensEnrichment";
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
  /** Archetype label: The Persona / The Wiring / The Soul */
  archetype: string;
  /** Educational explainer pulled from former PositionBlock "what" */
  whatItIs: string;
  /** Educational explainer pulled from former PositionBlock "how" */
  howMeasured: string;
  /** Actionable guidance pulled from former PositionBlock "use" */
  howToUse: string;
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
    archetype: "The Persona",
    whatItIs:
        "The Tropical chart is the system most Western horoscopes use. It maps the sky relative to Earth's seasons, anchored to the moment of the spring equinox. It tells you what flavor the collective day is wearing.",
    howMeasured:
        "The zodiac is divided into twelve equal 30° slices, starting at 0° Aries — the precise point where the Sun crosses the celestial equator each spring. Where the Moon falls in this seasonal grid is its Tropical position.",
    howToUse:
        "Notice how conversations, moods, and social interactions are colored by this sign today. It is the surface tone of the room — not who you are underneath, but the climate everyone is breathing.",
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
    archetype: "The Wiring",
    whatItIs:
        "The Sidereal chart is the foundation of Vedic (Indian) astrology. Instead of seasons, it locks the zodiac to the actual fixed stars. Over centuries the two systems have drifted apart by about 24° — that gap is the Ayanamsha displayed at the top of this page.",
    howMeasured:
        "We start from the true position of the constellations and divide the sky into 27 lunar mansions called Nakshatras, each ruled by a planet and carrying a specific power (a Shakti). Where the Moon sits in this stellar grid reveals the wiring that is actually running underneath you.",
    howToUse:
        "Ask: am I acting from my root power today, or am I forcing a pace that does not match my wiring? The Nakshatra ruler tells you the kind of action that will feel native — and the kind that will cost you energy.",
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
    archetype: "The Soul",
    whatItIs:
        "The Draconic chart is the most esoteric of the three. It rebuilds the entire zodiac with 0° Aries placed not at the equinox or the stars, but at the Moon's North Node — the karmic axis your soul is moving along.",
    howMeasured:
        "We take today's Moon position and subtract the position of the True North Node. What remains is the Moon read in 'soul coordinates' — a chart that ignores both season and constellation and shows only directional pull.",
    howToUse:
        "Listen for the deep, quiet pull beneath the noise. When a choice feels disproportionately important for no logical reason, that is usually the Draconic Moon speaking. Follow it gently; do not argue with it.",
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

  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{
    natal_sun_sign?: string | null;
    natal_moon_sign?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    (async () => {
      try {
        const { data } = await supabase
            .from("user_profiles")
            .select("natal_sun_sign, natal_moon_sign")
            .eq("user_id", user.id)
            .maybeSingle();
        if (isMounted && data) {
          setUserProfile(data);
        }
      } catch (err) {
        console.warn("Could not load user profile for lens enrichment:", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [user]);

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

          {/* ── Three lens cards ── */}
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
                      className={`group relative h-full flex flex-col rounded-sm border p-5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--lime-accent))] ${
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
                    <p className={`mt-1 text-[12px] leading-snug min-h-[2.5rem] ${isOpen ? "text-[hsl(var(--cream)/0.85)]" : "text-[hsl(var(--cream)/0.6)] italic"}`}>
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
                      <div className={`mt-3 inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.3em] ${isOpen ? "text-[hsl(var(--lime-accent))]" : "text-[hsl(var(--gold-medium)/0.8)]"}`}>
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

          {/* ── Expanded lens detail panel ── */}
          {openLens && (
              <div
                  id={`lens-detail-${openLens}`}
                  role="region"
                  aria-label="Alignment details"
                  className="mx-auto max-w-2xl mb-8 rounded-sm border border-[hsl(var(--lime-accent)/0.4)] bg-[hsl(var(--navy-dark)/0.55)] p-5 sm:p-6 text-left animate-fade-in"
              >
                {(() => {
                  const lens = LENSES.find((l) => l.key === openLens)!;
                  const sign = lens.pickSign(triad);
                  const attr = getLensAttribute(lens.register, sign);
                  const transitGuidance = SIGN_TRANSIT_GUIDANCE[sign];
                  const profileNumber =
                      userProfile?.natal_sun_sign && userProfile?.natal_moon_sign
                          ? calculateTriadProfileNumber(
                              userProfile.natal_sun_sign,
                              userProfile.natal_moon_sign,
                              sign
                          )
                          : null;
                  const nextTransit = getNextTransitShift(lens.register);

                  return (
                      <>
                        {/* ── Header ── */}
                        <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--lime-accent)/0.75)] mb-0.5 text-center">
                          {lens.archetype}
                        </div>
                        <div className="text-[11px] uppercase tracking-[0.3em] text-[hsl(var(--lime-accent))] mb-2 text-center font-display">
                          {lens.eyebrow} · {sign}
                        </div>
                        <DecoDivider />

                        {/* ── Headline + Detail (sign-level attribute) ── */}
                        <p className="font-display text-[15px] leading-snug text-[hsl(var(--lime-accent-light))] text-center mb-3">
                          {attr.headline}
                        </p>
                        <p className="text-[14px] leading-relaxed text-[hsl(var(--cream)/0.85)] text-center">
                          {attr.detail}
                        </p>

                        {/* ── Practice ── */}
                        <div className="mt-4 mx-auto max-w-md text-center text-[12px] italic text-[hsl(var(--cream)/0.7)] border-t border-[hsl(var(--lime-accent)/0.25)] pt-3">
                    <span className="not-italic uppercase tracking-[0.3em] text-[10px] text-[hsl(var(--lime-accent))] block mb-1">
                      Practice
                    </span>
                          {attr.practice}
                        </div>

                        {/* ── Behavioural Guidance for this sign ── */}
                        {transitGuidance && (
                            <div className="mt-6 border-t border-[hsl(var(--lime-accent)/0.15)] pt-5">
                              <h3 className="font-display text-[10px] tracking-[0.3em] uppercase text-[hsl(var(--lime-accent))] mb-3 text-center">
                                Behavioural Guidance · {sign}
                              </h3>
                              {"guidance" in transitGuidance && (
                                  <p className="text-[13px] leading-relaxed text-[hsl(var(--cream)/0.8)] text-center mb-4">
                                    {(transitGuidance as { guidance: string }).guidance}
                                  </p>
                              )}
                              {"challenge" in transitGuidance || "epiphany" in transitGuidance ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {"challenge" in transitGuidance && (transitGuidance as { challenge?: string }).challenge && (
                                        <div className="rounded-sm border border-[hsl(var(--gold-medium)/0.3)] bg-[hsl(var(--navy-deep)/0.5)] p-3">
                                          <div className="text-[9px] uppercase tracking-[0.3em] text-[hsl(var(--gold-medium))] mb-1.5 text-center">
                                            Challenge
                                          </div>
                                          <p className="text-[12px] text-[hsl(var(--cream)/0.75)] leading-snug text-center">
                                            {(transitGuidance as { challenge?: string }).challenge}
                                          </p>
                                        </div>
                                    )}
                                    {"epiphany" in transitGuidance && (transitGuidance as { epiphany?: string }).epiphany && (
                                        <div className="rounded-sm border border-[hsl(var(--lime-accent)/0.3)] bg-[hsl(var(--navy-deep)/0.5)] p-3">
                                          <div className="text-[9px] uppercase tracking-[0.3em] text-[hsl(var(--lime-accent))] mb-1.5 text-center">
                                            Epiphany
                                          </div>
                                          <p className="text-[12px] text-[hsl(var(--cream)/0.75)] leading-snug text-center">
                                            {(transitGuidance as { epiphany?: string }).epiphany}
                                          </p>
                                        </div>
                                    )}
                                  </div>
                              ) : null}
                            </div>
                        )}

                        {/* ── Lens definition: What · How · Use ── */}
                        <div className="mt-6 space-y-4 border-t border-[hsl(var(--lime-accent)/0.15)] pt-5">
                          {(
                              [
                                { label: "What it is", text: lens.whatItIs },
                                { label: "How it’s measured", text: lens.howMeasured },
                                { label: "How to use it", text: lens.howToUse },
                              ] as const
                          ).map(({ label, text }) => (
                              <div key={label}>
                                <h3 className="font-display text-[10px] tracking-[0.3em] uppercase text-[hsl(var(--lime-accent))] mb-1.5">
                                  {label}
                                </h3>
                                <p className="text-[13px] leading-relaxed text-[hsl(var(--cream)/0.75)]">
                                  {text}
                                </p>
                              </div>
                          ))}
                        </div>

                        {/* ── Position / Element / Modality grid ── */}
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

                        {/* ── Triad Profile Number ── */}
                        {profileNumber != null && (
                            <div className="mt-5 border-t border-[hsl(var(--lime-accent)/0.15)] pt-4 text-center">
                              <div className="text-[9px] uppercase tracking-[0.35em] text-[hsl(var(--lime-accent)/0.7)] mb-1">
                                Triad Profile Number
                              </div>
                              <div className="font-display text-3xl text-[hsl(var(--lime-accent-light))] tabular-nums">
                                {profileNumber}
                              </div>
                              <p className="mt-1 text-[11px] text-[hsl(var(--cream)/0.5)] italic">
                                Your unique alignment signature today
                              </p>
                            </div>
                        )}

                        {/* ── Next Transit Preview ── */}
                        {nextTransit && (
                            <div className="mt-4 border-t border-[hsl(var(--lime-accent)/0.15)] pt-4 text-center">
                              <div className="text-[9px] uppercase tracking-[0.35em] text-[hsl(var(--lime-accent)/0.7)] mb-1">
                                Next Shift · {lens.title}
                              </div>
                              <p className="text-[12px] text-[hsl(var(--cream)/0.7)] leading-snug">
                                {"description" in (nextTransit as object)
                                    ? (nextTransit as { description: string }).description
                                    : "sign" in (nextTransit as object)
                                        ? `Entering ${(nextTransit as { sign: string }).sign}`
                                        : null}
                                {"hoursUntil" in (nextTransit as object) &&
                                    (nextTransit as { hoursUntil?: number }).hoursUntil != null && (
                                        <span className="ml-2 text-[hsl(var(--lime-accent)/0.8)]">
                              · ~{Math.round((nextTransit as { hoursUntil: number }).hoursUntil)}h
                            </span>
                                    )}
                              </p>
                            </div>
                        )}

                        {/* ── Disclaimer ── */}
                        <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--cream)/0.35)] text-center">
                          For self-reflection and learning ·{" "}
                          <a href="/disclaimer" className="underline hover:text-[hsl(var(--lime-accent)/0.7)]">
                            Disclaimer
                          </a>
                        </p>
                      </>
                  );
                })()}
              </div>
          )}

          {/* ── Luminary Synthesis ── */}
          <div className="mx-auto max-w-2xl rounded-sm border border-[hsl(var(--gold-medium)/0.35)] bg-[hsl(var(--navy-dark)/0.4)] p-5 sm:p-6 text-center">
            <div className="text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--gold-medium))] mb-1">
              Luminary Synthesis
            </div>
            <div className="text-[11px] italic text-[hsl(var(--cream)/0.55)] mb-3">
              {synthesis.subtitle}
            </div>
            <p className="text-[14px] sm:text-[15px] leading-relaxed text-[hsl(var(--cream)/0.85)]">
              {synthesis.body}
            </p>
            {synthesis.frictionCue && (
                <div className="mt-4 mx-auto max-w-lg text-[11px] uppercase tracking-[0.25em] text-[hsl(var(--gold-medium)/0.85)] border-t border-[hsl(var(--gold-medium)/0.3)] pt-3">
                  {synthesis.frictionCue}
                </div>
            )}
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
        <span className="text-[hsl(var(--gold-medium))] text-xs">✦</span>
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
