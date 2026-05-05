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

const PHASE_TONE: Record<KineticAspect["phase"], { label: string; cls: string }> = {
  Applying:   { label: "Applying · Inhale",   cls: "aspect-heat" },
  Exact:      { label: "Exact · Apex",        cls: "aspect-apex" },
  Separating: { label: "Separating · Exhale", cls: "aspect-cold" },
};

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
  // Heat: increase glow w/ intensity; Cold: reduce opacity & spread letters.
  const style: React.CSSProperties =
    a.phase === "Separating"
      ? { opacity: 0.35 + 0.25 * a.intensity, letterSpacing: `${0.04 + 0.06 * (1 - a.intensity)}em` }
      : a.phase === "Applying"
      ? { filter: `drop-shadow(0 0 ${4 + 14 * a.intensity}px hsl(var(--sov-heat) / ${0.35 + 0.5 * a.intensity}))` }
      : { filter: `drop-shadow(0 0 22px hsl(var(--sov-apex) / 0.85))` };

  return (
    <div className={`sov-aspect-row ${tone.cls}`} style={style}>
      <div className="flex items-baseline justify-between gap-4">
        <div className="font-display text-base tracking-wide">
          {bodyLabel(a.bodyA)} <span className="opacity-60">·</span> {a.aspect}{" "}
          <span className="opacity-60">·</span> {bodyLabel(a.bodyB)}
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--sov-champagne))]">
          {tone.label}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-[hsl(var(--sov-ivory)/0.6)]">
        <span>Orb {orbStr}</span>
        <span>Separation {a.separation.toFixed(2)}°</span>
      </div>
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
            <p className="mt-2 text-[11px] leading-relaxed text-[hsl(var(--sov-ivory)/0.7)] italic" style={{ textAlign: "justify", hyphens: "auto" }}>
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

function ShaktiCard({ triad }: { triad: TriadMoon }) {
  const n = triad.sidereal.nakshatra;
  return (
    <div className="sov-card">
      <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--sov-champagne))] mb-4">
        The Shakti Key
      </div>
      <div className="font-display text-3xl tracking-wide mb-2">{n.name}</div>
      <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--sov-ivory)/0.55)] mb-5">
        Ruler · {n.ruler}
      </div>
      <div className="text-sm text-[hsl(var(--sov-ivory)/0.85)] italic" style={{ textAlign: "justify", hyphens: "auto" }}>
        {n.shakti}
      </div>
      <div className="sov-statement">
        <strong>The Wiring</strong>
        The Primal Impulse. Inquiry: Are your actions aligned with your root power, or are you forcing a pace?
      </div>
    </div>
  );
}

function AuditCard({ audit }: { audit: ChandraLagnaHouse }) {
  return (
    <div className="sov-card">
      <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--sov-champagne))] mb-4">
        Internal Audit · Chandra Lagna
      </div>
      <div className="font-display text-3xl tracking-wide mb-2">House {audit.house}</div>
      <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--sov-ivory)/0.55)] mb-5">
        Transit through {audit.sign}
      </div>
      <div className="text-sm text-[hsl(var(--sov-ivory)/0.9)] leading-relaxed" style={{ textAlign: "justify", hyphens: "auto" }}>
        {audit.inquiry}
      </div>
      <div className="sov-statement">
        <strong>The Persona</strong>
        Navigating the Collective Weather. Action: Notice how social interactions are flavored by this sign today.
      </div>
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
        <div className="text-sm text-[hsl(var(--sov-ivory)/0.55)] italic flex-1 flex items-center justify-center">
          No tight applying patterns. Field is in observation.
        </div>
      ) : (
        <ul className="space-y-3 flex-1">
          {loops.slice(0, 4).map((a, i) => (
            <li key={i} className="text-sm" style={{ textAlign: "justify", hyphens: "auto" }}>
              <span className="text-[hsl(var(--sov-ivory))] font-medium">
                {bodyLabel(a.bodyA)} {a.aspect.toLowerCase()} {bodyLabel(a.bodyB)}
              </span>
              <span className="text-[hsl(var(--sov-ivory)/0.55)]"> — orb {Math.abs(a.orb).toFixed(2)}°. Bring the pattern into observation before it discharges.</span>
            </li>
          ))}
        </ul>
      )}
      <div className="sov-statement">
        <strong>The Loop</strong>
        Breaking Habits. Locate the 3° gap between trigger and reaction to choose a new path.
      </div>
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
      <main className={`pt-[68px] pb-20 px-6 ${isVoid ? "sov-void" : ""}`}>
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
              <TriadCard triad={triad} />
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
