import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { computeTriadMoon, type TriadMoon } from "@/lib/sovereignEngine";
import DailyPulse from "@/components/DailyPulse";

/* ────────────────────────────────────────────────────────────
   Triad Lunar Position — dedicated breakdown page
   Explains the three lunar coordinate systems in plain language:
   Tropical · Sidereal · Draconic
   ──────────────────────────────────────────────────────────── */

function PositionBlock({
  eyebrow,
  title,
  meta,
  position,
  intro,
  what,
  how,
  use,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  position: string;
  intro: string;
  what: string;
  how: string;
  use: string;
}) {
  return (
    <article className="sov-card">
      <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--sov-champagne))] mb-3">
        {eyebrow}
      </div>
      <div className="flex flex-col gap-1 mb-5">
        <h2 className="font-display text-2xl sm:text-3xl tracking-wide text-[hsl(var(--sov-ivory))]">
          {title}
        </h2>
        {meta && (
          <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--sov-ivory)/0.55)]">
            {meta}
          </div>
        )}
        <div className="mt-4 rounded-md border border-[hsl(var(--sov-champagne)/0.25)] bg-[hsl(var(--sov-ivory)/0.03)] px-4 py-3 text-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--sov-ivory)/0.55)] mb-1">
            Current Moon position · {title}
          </div>
          <div className="font-display text-base sm:text-lg text-[hsl(var(--sov-champagne))] tabular-nums break-words">
            {position}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--sov-ivory)/0.4)]">
            Sign · Degrees · Minutes (live)
          </div>
        </div>
      </div>

      <p className="text-[15px] leading-relaxed italic text-[hsl(var(--sov-ivory)/0.78)] mb-4">
        {intro}
      </p>

      <div className="space-y-4">
        <div>
          <h3 className="font-display text-[11px] tracking-[0.25em] uppercase text-[hsl(var(--sov-champagne))] mb-1.5">
            What it is
          </h3>
          <p className="text-[15px] leading-relaxed text-[hsl(var(--sov-ivory)/0.75)]">{what}</p>
        </div>
        <div>
          <h3 className="font-display text-[11px] tracking-[0.25em] uppercase text-[hsl(var(--sov-champagne))] mb-1.5">
            How it's measured
          </h3>
          <p className="text-[15px] leading-relaxed text-[hsl(var(--sov-ivory)/0.75)]">{how}</p>
        </div>
        <div>
          <h3 className="font-display text-[11px] tracking-[0.25em] uppercase text-[hsl(var(--sov-champagne))] mb-1.5">
            How to use it
          </h3>
          <p className="text-[15px] leading-relaxed text-[hsl(var(--sov-ivory)/0.75)]">{use}</p>
        </div>
      </div>
    </article>
  );
}

export default function Triad() {
  // SEO injected in render below

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login?from=/lenses");
        return;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("is_subscriber, subscription_status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!profile?.is_subscriber && profile?.subscription_status !== "sovereign") {
        navigate("/pricing");
        return;
      }
      setAuthorized(true);
      setLoading(false);
    })();
  }, [navigate]);

  const triad: TriadMoon = useMemo(() => computeTriadMoon(new Date()), []);

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
      <SEO
        title="The Three Lenses — Tropical, Sidereal & Draconic Moon"
        description="One Sovereign View of today's Moon through Tropical (persona), Sidereal (wiring), and Draconic (soul) lenses."
        canonical="https://moondaylive.com/lenses"
      />
      <Navigation />
      <main className="pt-[68px] pb-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <header className="text-center mb-8">
            <div className="text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--sov-champagne))] mb-2">
              The Lenses
            </div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight text-[hsl(var(--sov-ivory))]">
              Three Lenses, One Sovereign View
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[hsl(var(--sov-ivory)/0.65)] max-w-xl mx-auto leading-relaxed">
              The same Moon, read through three lenses — Persona, Wiring, Soul.
            </p>
            <div className="mt-4 text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--sov-ivory)/0.4)]">
              Lahiri Ayanamsha · {triad.ayanamsha.toFixed(4)}°
            </div>
          </header>

          <div className="mb-8">
            <DailyPulse />
          </div>

          <div className="grid gap-6 grid-cols-1 items-start">
            <article className="sov-card">
              <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--sov-champagne))] mb-3">
                Three Lenses, One Sovereign View
              </div>
              <p className="text-[15px] leading-relaxed text-[hsl(var(--sov-ivory)/0.78)] mb-3">
                The three positions rarely agree — and that is the point. When your Tropical,
                Sidereal, and Draconic positions all land in the same sign, your day is unusually
                unified: outer weather, inner wiring, and soul direction are pulling in one line.
                On these days, move boldly.
              </p>
              <p className="text-[15px] leading-relaxed text-[hsl(var(--sov-ivory)/0.78)] mb-4">
                Most days, however, these perspectives diverge. Read them as a sequence to
                understand the layers of your experience:
              </p>
              <ul className="space-y-3 text-[15px] leading-relaxed text-[hsl(var(--sov-ivory)/0.78)]">
                <li>
                  <span className="text-[hsl(var(--sov-champagne))] font-medium">
                    The Tropical Lens (The Persona):
                  </span>{" "}
                  the public, social texture of the day — what the "room" feels like, the shared
                  atmospheric weather you and the world are walking through together.
                </li>
                <li>
                  <span className="text-[hsl(var(--sov-champagne))] font-medium">
                    The Sidereal Lens (The Wiring):
                  </span>{" "}
                  your actual astronomical alignment — how your nervous system is truly responding
                  to the cosmic environment, regardless of the social weather.
                </li>
                <li>
                  <span className="text-[hsl(var(--sov-champagne))] font-medium">
                    The Draconic Lens (The Soul):
                  </span>{" "}
                  your spiritual compass — the underlying direction your soul wants this specific
                  experience to deliver you toward.
                </li>
              </ul>
              <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--sov-ivory)/0.45)]">
                For self-reflection and entertainment ·{" "}
                <a href="/disclaimer" className="underline hover:text-[hsl(var(--sov-champagne))]">
                  Read the disclaimer
                </a>
              </p>
            </article>

            <PositionBlock
              eyebrow="Lens One · The Persona"
              title="Tropical"
              meta="Daily climate · Western astrology"
              position={triad.tropical.formatted}
              intro="The weather you and the world are walking through together — the public, social texture of the day."
              what="The Tropical chart is the system most Western horoscopes use. It maps the sky relative to Earth's seasons, anchored to the moment of the spring equinox. It tells you what flavor the collective day is wearing."
              how="The zodiac is divided into twelve equal 30° slices, starting at 0° Aries — the precise point where the Sun crosses the celestial equator each spring. Where the Moon falls in this seasonal grid is its Tropical position."
              use="Notice how conversations, moods, and social interactions are colored by this sign today. It is the surface tone of the room — not who you are underneath, but the climate everyone is breathing."
            />

            <PositionBlock
              eyebrow="Lens Two · The Wiring"
              title="Sidereal"
              meta={`Vedic astrology · Nakshatra ${triad.sidereal.nakshatra.name} · Pada ${triad.sidereal.nakshatra.pada}`}
              position={triad.sidereal.formatted}
              intro="Your primal operating system — the deeper, unchanging current beneath the day's weather."
              what="The Sidereal chart is the foundation of Vedic (Indian) astrology. Instead of seasons, it locks the zodiac to the actual fixed stars. Over centuries the two systems have drifted apart by about 24° — that gap is the Ayanamsha you see above."
              how="We start from the true position of the constellations and divide the sky into 27 lunar mansions called Nakshatras, each ruled by a planet and carrying a specific power (a Shakti). Where the Moon sits in this stellar grid reveals the wiring that is actually running underneath you."
              use="Ask: am I acting from my root power today, or am I forcing a pace that does not match my wiring? The Nakshatra ruler tells you the kind of action that will feel native — and the kind that will cost you energy."
            />

            <PositionBlock
              eyebrow="Lens Three · The Soul"
              title="Draconic"
              meta="Soul vector · Moon measured from the True Node"
              position={triad.draconic.formatted}
              intro="The hidden blueprint — what your soul is reaching toward beneath every choice you make."
              what="The Draconic chart is the most esoteric of the three. It rebuilds the entire zodiac with 0° Aries placed not at the equinox or the stars, but at the Moon's North Node — the karmic axis your soul is moving along."
              how="We take today's Moon position and subtract the position of the True North Node. What remains is the Moon read in 'soul coordinates' — a chart that ignores both season and constellation and shows only directional pull."
              use="Listen for the deep, quiet pull beneath the noise. When a choice feels disproportionately important for no logical reason, that is usually the Draconic Moon speaking. Follow it gently; do not argue with it."
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
