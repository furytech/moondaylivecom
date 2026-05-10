import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  computeTriadMoon,
  computeKineticAspects,
  shadowLoops,
  dailyInternalAudit,
  bodyLabel,
  type TriadMoon,
  type KineticAspect,
  type ChandraLagnaHouse,
  type ZodiacSign,
} from "@/lib/sovereignEngine";

/* ────────────────────────────────────────────────────────────
   Sovereign Dashboard — Midnight Luxe
   Obsidian background · Champagne hairlines · Ivory typography
   "Breath" of the aspects: Heat (Applying) ↔ Cold (Separating)
   ──────────────────────────────────────────────────────────── */

const PHASE_TONE: Record<KineticAspect["phase"], { label: string; cls: string; glyph: string }> = {
  Applying:   { label: "Applying · Inhale",   cls: "aspect-heat", glyph: "▲" },
  Exact:      { label: "Exact · Apex",        cls: "aspect-apex", glyph: "◆" },
  Separating: { label: "Separating · Exhale", cls: "aspect-cold", glyph: "▽" },
};

// Plain-language meaning of each aspect geometry
// What to expect during each kinetic phase
const PHASE_MEANING: Record<KineticAspect["phase"], string> = {
  Applying:   "Pressure is building. Observe the pattern now, before it expresses outwardly.",
  Exact:      "Peak charge. The lesson is live — meet it with full presence.",
  Separating: "The wave is releasing. Integrate what surfaced and let the residue clear.",
};

// Archetypal voice of each tracked body — the "noun" of the sentence
const BODY_VOICE: Record<string, { domain: string; verb: string }> = {
  Sun:       { domain: "core identity and vitality",        verb: "illuminating" },
  Moon:      { domain: "emotional tide and instinct",        verb: "feeling into" },
  Mercury:   { domain: "thought, language, and exchange",    verb: "translating" },
  Venus:     { domain: "values, attraction, and harmony",    verb: "drawing toward" },
  Mars:      { domain: "drive, courage, and assertion",      verb: "igniting" },
  Jupiter:   { domain: "expansion, meaning, and faith",      verb: "amplifying" },
  Saturn:    { domain: "structure, mastery, and limit",      verb: "consolidating" },
  "True Node": { domain: "soul direction and karmic axis",   verb: "orienting" },
};

// How each aspect colors the meeting between the two bodies
const ASPECT_DYNAMIC: Record<KineticAspect["aspect"], (a: string, b: string) => string> = {
  Conjunction: (a, b) => `${a} fuses with ${b}; the two themes braid into a single, amplified signal.`,
  Opposition:  (a, b) => `${a} faces ${b} across an axis, asking you to hold both truths without collapsing one into the other.`,
  Trine:       (a, b) => `${a} flows easily into ${b}; gifts arrive with little friction, but require conscious use to matter.`,
  Square:      (a, b) => `${a} grinds against ${b}; the friction is the lesson — pressure that reshapes structure when met directly.`,
  Sextile:     (a, b) => `${a} extends an open hand to ${b}; a small, deliberate move now opens disproportionate movement later.`,
};

function describeAspect(a: KineticAspect): string {
  const A = bodyLabel(a.bodyA);
  const B = bodyLabel(a.bodyB);
  const va = BODY_VOICE[A]?.domain ?? A;
  const vb = BODY_VOICE[B]?.domain ?? B;
  return ASPECT_DYNAMIC[a.aspect](`your ${va}`, `your ${vb}`);
}

function useTick(intervalMs: number) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

function AspectRow({ a }: { a: KineticAspect }) {
  const tone = PHASE_TONE[a.phase];
  const orbStr = `${Math.abs(a.orb).toFixed(2)}°`;
  // Heat: build glow with intensity. Apex: bright bloom. Cold: keep readable, signal via dashed rail + glyph.
  const style: React.CSSProperties =
    a.phase === "Applying"
      ? { filter: `drop-shadow(0 0 ${4 + 14 * a.intensity}px hsl(var(--sov-heat) / ${0.35 + 0.5 * a.intensity}))` }
      : a.phase === "Exact"
      ? { filter: `drop-shadow(0 0 22px hsl(var(--sov-apex) / 0.85))` }
      : {};

  return (
    <div className={`sov-aspect-row ${tone.cls} phase-${a.phase.toLowerCase()}`} style={style}>
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4">
        <div className="font-display text-base tracking-wide flex items-center gap-2 flex-wrap">
          <span className="aspect-glyph" aria-hidden>{tone.glyph}</span>
          {bodyLabel(a.bodyA)} <span className="opacity-60">·</span> {a.aspect}{" "}
          <span className="opacity-60">·</span> {bodyLabel(a.bodyB)}
        </div>
        <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[hsl(var(--sov-champagne))] whitespace-nowrap">
          {tone.label}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-[hsl(var(--sov-ivory)/0.6)]">
        <span>Orb {orbStr}</span>
        <span>Separation {a.separation.toFixed(2)}°</span>
      </div>
      <p className="mt-2 text-[16px] leading-relaxed italic text-[hsl(var(--sov-ivory)/0.7)] text-left">
        <span className="not-italic font-semibold tracking-wider text-[hsl(var(--sov-champagne))]">
          {bodyLabel(a.bodyA)} {a.aspect.toLowerCase()} {bodyLabel(a.bodyB)}.
        </span>{" "}
        {describeAspect(a)} {PHASE_MEANING[a.phase]}
      </p>
    </div>
  );
}

function TriadCard({ triad }: { triad: TriadMoon }) {
  const rows = [
    {
      label: "Tropical",
      sub: "Daily climate",
      pos: triad.tropical.formatted,
      statement: { title: "The Persona", body: "Navigating the Collective Weather. Action: Notice how social interactions are flavored by this sign today." },
    },
    {
      label: "Sidereal",
      sub: `Nakshatra · ${triad.sidereal.nakshatra.name} · Pada ${triad.sidereal.nakshatra.pada}`,
      pos: triad.sidereal.formatted,
      statement: { title: "The Wiring", body: "The Primal Impulse. Inquiry: Are your actions aligned with your root power, or are you forcing a pace?" },
    },
    {
      label: "Draconic",
      sub: "Soul vector (Moon − True Node)",
      pos: triad.draconic.formatted,
      statement: { title: "The Soul", body: "The Hidden Blueprint. Insight: Listen for the deep pull of your soul through the daily noise." },
    },
  ];
  return (
    <div className="sov-card">
      <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--sov-champagne))] mb-4">
        Triad Lunar Position
      </div>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.label} className="border-b border-[hsl(var(--sov-champagne)/0.15)] pb-3 last:border-0">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-left min-w-0">
                <div className="font-display text-sm tracking-[0.15em] uppercase">{r.label}</div>
                <div className="text-xs text-[hsl(var(--sov-ivory)/0.55)]">{r.sub}</div>
              </div>
              <div className="font-display text-sm sm:text-base text-[hsl(var(--sov-ivory))] tabular-nums whitespace-nowrap shrink-0">{r.pos}</div>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-[hsl(var(--sov-ivory)/0.7)] italic" style={{ textAlign: "justify", hyphens: "auto" }}>
              <span className="not-italic font-semibold tracking-wider text-[hsl(var(--sov-champagne))]">{r.statement.title}.</span> {r.statement.body}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--sov-ivory)/0.4)] text-right">
        Lahiri Ayanamsha · {triad.ayanamsha.toFixed(4)}°
      </div>
    </div>
  );
}

// ─── Shakti Key composition ───────────────────────────────
const RULER_BEHAVIOR: Record<string, string> = {
  Sun:     "lead from sovereign center; act on what only you can author",
  Moon:    "tend the inner climate first; let feeling inform pace",
  Mercury: "gather data, then articulate — speak with precision, not volume",
  Venus:   "choose by resonance; favor what feels harmonized over what feels urgent",
  Mars:    "channel the heat into one decisive movement; refuse scattershot effort",
  Jupiter: "expand where meaning is real; do not inflate where it is performative",
  Saturn:  "honor the long form; constrain now to compound later",
  Rahu:    "engage the unfamiliar edge; the discomfort is the curriculum",
  Ketu:    "release what is already complete; let mastery exit gracefully",
};

function ShaktiCard({ triad }: { triad: TriadMoon }) {
  const n = triad.sidereal.nakshatra;
  const behavior = RULER_BEHAVIOR[n.ruler] ?? "move in alignment with the day's underlying current";
  return (
    <div className="sov-card">
      <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--sov-champagne))] mb-4">
        The Shakti Key
      </div>
      <div className="font-display text-3xl tracking-wide mb-2">{n.name}</div>
      <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--sov-ivory)/0.55)] mb-5">
        Ruler · {n.ruler}
      </div>
      <p className="text-[16px] leading-relaxed italic text-[hsl(var(--sov-ivory)/0.7)] text-left mb-3">
        <span className="not-italic font-semibold tracking-wider text-[hsl(var(--sov-champagne))]">The Wiring.</span>{" "}
        {n.shakti}. This is the primal current threaded through your day — the specific power your Moon is metabolizing right now.
      </p>
      <p className="text-[16px] leading-relaxed italic text-[hsl(var(--sov-ivory)/0.7)] text-left">
        <span className="not-italic font-semibold tracking-wider text-[hsl(var(--sov-champagne))]">The Practice.</span>{" "}
        Under {n.ruler}'s rulership, {behavior}. Choose the deliberate path; let the chaotic one pass.
      </p>
    </div>
  );
}

// ─── Internal Audit composition ───────────────────────────
const SIGN_ELEMENT_PRACTICE: Record<string, string> = {
  Fire:  "act first, refine in motion; courage clears the static",
  Earth: "ground the inquiry in something tangible — body, calendar, or craft",
  Water: "let feeling lead the data; honor what the tide is showing you",
  Air:   "name it precisely; the right sentence reorganizes the field",
};

const HOUSE_DOMAIN: Record<number, string> = {
  1:  "self-presentation",
  2:  "resources and worth",
  3:  "communication and immediate exchange",
  4:  "foundations and inner home",
  5:  "creative expression",
  6:  "daily systems and routine",
  7:  "partnership and mirrors",
  8:  "shared depth and intimacy",
  9:  "belief and worldview",
  10: "public structure and direction",
  11: "networks and alliances",
  12: "subconscious and integration",
};

const SIGN_ELEMENT_LOCAL: Record<string, "Fire" | "Earth" | "Air" | "Water"> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

function AuditCard({ audit }: { audit: ChandraLagnaHouse }) {
  const element = SIGN_ELEMENT_LOCAL[audit.sign];
  const practice = SIGN_ELEMENT_PRACTICE[element];
  const domain = HOUSE_DOMAIN[audit.house];
  return (
    <div className="sov-card">
      <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--sov-champagne))] mb-4">
        Internal Audit · Chandra Lagna
      </div>
      <div className="font-display text-3xl tracking-wide mb-2">House {audit.house}</div>
      <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--sov-ivory)/0.55)] mb-5">
        Transit through {audit.sign}
      </div>
      <p className="text-[16px] leading-relaxed italic text-[hsl(var(--sov-ivory)/0.7)] text-left mb-3">
        <span className="not-italic font-semibold tracking-wider text-[hsl(var(--sov-champagne))]">The Inquiry.</span>{" "}
        {audit.inquiry}
      </p>
      <p className="text-[16px] leading-relaxed italic text-[hsl(var(--sov-ivory)/0.7)] text-left">
        <span className="not-italic font-semibold tracking-wider text-[hsl(var(--sov-champagne))]">The Practice.</span>{" "}
        Today the audit lands in your domain of {domain}, colored by {audit.sign}'s {element.toLowerCase()} signature — {practice}. Sit with the inquiry before reacting; choose the response, do not perform it.
      </p>
    </div>
  );
}

function ShadowCard({ loops }: { loops: KineticAspect[] }) {
  return (
    <div className="sov-card">
      <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--sov-champagne))] mb-4">
        Shadow-to-Light · Active Loops
      </div>
      {loops.length === 0 ? (
        <>
          <div className="text-sm text-[hsl(var(--sov-ivory)/0.75)] flex-1 flex items-center justify-center text-center px-2">
            No active loops within this Moon phase. The field is clear — a rare window of integrated flow. Move with confidence.
          </div>
          <p className="text-[16px] leading-relaxed text-[hsl(var(--sov-ivory)/0.7)] italic mt-4">
            <span className="not-italic font-semibold tracking-wider text-[hsl(var(--sov-champagne))]">
              All Clear.
            </span>{" "}
            No sub-3° applying tensions detected between tracked bodies. Use this opening to consolidate, not to expand.
          </p>
        </>
      ) : (
        <>
          <ul className="space-y-3 flex-1">
            {loops.slice(0, 4).map((a, i) => (
              <li key={i} className="text-[16px] leading-relaxed" style={{ textAlign: "justify", hyphens: "auto" }}>
                <span className="font-semibold tracking-wider text-[hsl(var(--sov-champagne))]">
                  {bodyLabel(a.bodyA)} {a.aspect.toLowerCase()} {bodyLabel(a.bodyB)}.
                </span>
                <span className="text-[hsl(var(--sov-ivory)/0.7)] italic"> Orb {Math.abs(a.orb).toFixed(2)}°. Bring the pattern into observation before it discharges.</span>
              </li>
            ))}
          </ul>
          <p className="text-[16px] leading-relaxed text-[hsl(var(--sov-ivory)/0.7)] italic mt-4">
            <span className="not-italic font-semibold tracking-wider text-[hsl(var(--sov-champagne))]">
              The Loop.
            </span>{" "}
            Breaking Habits. We found a less than 3° gap between these planets. Intercept the trigger before the reaction takes hold.
          </p>
        </>
      )}
    </div>
  );
}

function KineticCard({ aspects }: { aspects: KineticAspect[] }) {
  return (
    <div className="sov-card">
      <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--sov-champagne))] mb-4">
        Kinetic Aspect Field
      </div>
      <div className="space-y-1 flex-1">
        {aspects.slice(0, 4).map((a, i) => (
          <AspectRow key={i} a={a} />
        ))}
      </div>
      <div className="sov-statement">
        <strong>The Breath</strong>
        Inhale (Applying) is building pressure — observe. Exhale (Separating) is releasing — integrate.
      </div>
    </div>
  );
}

export default function Sovereign() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [natalMoon, setNatalMoon] = useState<ZodiacSign | null>(null);
  useTick(60_000); // refresh once per minute — Moon moves ~0.0085°/min

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login?from=/sovereign");
        return;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("moon_sign, is_subscriber, subscription_status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!profile?.is_subscriber && profile?.subscription_status !== "sovereign") {
        navigate("/pricing");
        return;
      }
      setNatalMoon((profile.moon_sign as ZodiacSign) ?? "Cancer");
      setAuthorized(true);
      setLoading(false);
    })();
  }, [navigate]);

  const triad = useMemo(() => computeTriadMoon(new Date()), []);
  const aspects = useMemo(() => computeKineticAspects(new Date()), []);
  const loops = useMemo(() => shadowLoops(aspects), [aspects]);
  const audit = useMemo(
    () => natalMoon ? dailyInternalAudit(natalMoon) : null,
    [natalMoon],
  );

  const isVoid = aspects.length === 0;

  if (loading || !authorized) {
    return (
      <div className="sov-shell min-h-screen flex items-center justify-center">
        <div className="text-[hsl(var(--sov-ivory)/0.5)] text-xs uppercase tracking-[0.4em]">
          Calibrating
        </div>
      </div>
    );
  }

  return (
    <div className="sov-shell min-h-screen">
      <Navigation />
      <main className={`pt-[68px] pb-20 px-4 sm:px-6 ${isVoid ? "sov-void" : ""}`}>
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-4">
            <div className="text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--sov-champagne))] mb-2">
              Sovereign · Awareness Dashboard
            </div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight text-[hsl(var(--sov-ivory))]">
              Present-Moment Geometry
            </h1>
            <p className="mt-2 text-sm text-[hsl(var(--sov-ivory)/0.55)] max-w-xl mx-auto">
              Live geocentric positions. Whole Sign houses anchored to your natal Moon (Chandra Lagna). Aspects classified by kinetic phase.
            </p>
          </header>

          {isVoid ? (
            <div className="sov-card text-center py-20">
              <div className="text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--sov-champagne))] mb-3">
                The Void
              </div>
              <div className="font-display text-2xl tracking-wide">No active aspects within orb.</div>
              <div className="mt-2 text-sm text-[hsl(var(--sov-ivory)/0.5)]">
                Stillness. Use the absence of pressure for unstructured observation.
              </div>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 items-start">
              <ShaktiCard triad={triad} />
              {audit && <AuditCard audit={audit} />}
              <KineticCard aspects={aspects} />
              <ShadowCard loops={loops} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
