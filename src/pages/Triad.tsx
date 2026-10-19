import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import DailyPulse from "@/components/DailyPulse";
import { getDevTierOverride } from "@/lib/devTier";
import { calculateSunSign } from "@/lib/moonSign";
import { cachedTriad, usePulseNow } from "@/lib/pulseClock";
import {
  buildForYou,
  isLuminaryMember,
  natalSiderealMoon,
  normalizeSign,
  personalHero,
  resolveTriadPanel,
  safeTimeZone,
  withTimeout,
  type TriadPanelContent,
} from "@/lib/lensesPersonal";
import type { ZodiacSign } from "@/lib/sovereignEngine";

/* ────────────────────────────────────────────────────────────
   Triad Lunar Position — dedicated breakdown page
   Explains the three lunar coordinate systems in plain language:
   Tropical · Sidereal · Draconic
   Luminary members also see "For you" lines and today's Triad.
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

const LOAD_TIMEOUT_MS = 12_000;
const TRIAD_TIMEOUT_MS = 8_000;
/** Stripe-only members have no profile flag; give the subscription check a moment. */
const SUBSCRIPTION_GRACE_MS = 3_000;

interface Member {
  sun: ZodiacSign;
  moon: ZodiacSign;
  siderealMoon: ZodiacSign | null;
  timeZone: string | undefined;
  combinationTitle: string | null;
  profilePaid: boolean;
}

type MemberState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; member: Member };

type TriadRowState =
  | { status: "loading" }
  | { status: "done"; panel: TriadPanelContent };

async function loadMember(userId: string): Promise<Member> {
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select(
      "natal_sun_sign, natal_moon_sign, moon_sign, birthday, timezone, is_subscriber, subscription_status",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile) throw new Error("no profile");

  const moon = normalizeSign(profile.natal_moon_sign ?? profile.moon_sign);
  const sun =
    normalizeSign(profile.natal_sun_sign) ??
    (profile.birthday
      ? normalizeSign(calculateSunSign(new Date(`${profile.birthday.split("T")[0]}T12:00:00`)))
      : null);
  if (!sun || !moon) throw new Error("no natal signs");

  // The title is a nicety: a failed lookup never blocks the page.
  let combinationTitle: string | null = null;
  try {
    const { data } = await withTimeout(
      supabase
        .from("combination_profiles")
        .select("combination_title")
        .eq("sun_sign", sun)
        .eq("moon_sign", moon)
        .maybeSingle(),
      TRIAD_TIMEOUT_MS,
    );
    combinationTitle = data?.combination_title ?? null;
  } catch {
    combinationTitle = null;
  }

  const timeZone = safeTimeZone(profile.timezone);
  return {
    sun,
    moon,
    siderealMoon: natalSiderealMoon(profile.birthday, timeZone),
    timeZone,
    combinationTitle,
    profilePaid: isLuminaryMember(profile, false),
  };
}

function CalibratingScreen() {
  return (
    <div className="sov-shell min-h-screen flex items-center justify-center">
      <div className="text-[hsl(var(--sov-ivory)/0.5)] text-xs uppercase tracking-[0.4em]">
        Calibrating
      </div>
    </div>
  );
}

function PersonalTriadCard({ panel }: { panel: Extract<TriadPanelContent, { kind: "personal" }> }) {
  return (
    <div className="mx-auto max-w-2xl rounded-sm border border-[hsl(var(--gold-medium)/0.45)] bg-[hsl(var(--navy-dark)/0.4)] p-5 sm:p-6 text-center">
      <h3
        className="font-display text-base sm:text-lg tracking-wide text-[#d4af37] tabular-nums"
        style={{ textWrap: "balance" }}
      >
        {panel.heading}
      </h3>
      {panel.subheading && (
        <p className="mt-1 text-sm normal-case tracking-normal leading-snug text-violet-200">
          {panel.subheading}
        </p>
      )}
      <div className="mt-4 space-y-4 text-left">
        {panel.integrationInvitation && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--gold-medium))] mb-1">
              Integration invitation
            </div>
            <p className="text-left text-[14px] sm:text-[15px] normal-case tracking-normal leading-relaxed text-[hsl(var(--cream)/0.85)]">
              {panel.integrationInvitation}
            </p>
          </div>
        )}
        {panel.dailyRitual && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--gold-medium))] mb-1">
              Daily ritual
            </div>
            <p className="text-left text-[14px] sm:text-[15px] normal-case tracking-normal leading-relaxed text-[hsl(var(--cream)/0.85)]">
              {panel.dailyRitual}
            </p>
          </div>
        )}
      </div>
      <Link
        to="/blueprint"
        className="mt-5 inline-block text-sm normal-case tracking-normal text-[#d4af37] underline-offset-4 hover:underline"
      >
        Read your full Triad on Blueprint →
      </Link>
    </div>
  );
}

function TriadLoadingCard() {
  return (
    <div className="mx-auto max-w-2xl rounded-sm border border-[hsl(var(--gold-medium)/0.3)] bg-[hsl(var(--navy-dark)/0.4)] p-5 sm:p-6 text-center">
      <div className="text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--gold-medium))]">
        Today's Triad
      </div>
      <p className="mt-2 text-sm normal-case tracking-normal text-[hsl(var(--cream)/0.55)]">
        Reading your Triad…
      </p>
    </div>
  );
}

export default function Triad() {
  // ProtectedRoute guarantees a verified, signed-in user. The one membership
  // check is below: useAuth subscription + profile flags + dev tier override.
  const { user, subscription } = useAuth();
  const userId = user?.id;
  const now = usePulseNow();
  const [attempt, setAttempt] = useState(0);
  const [memberState, setMemberState] = useState<MemberState>({ status: "loading" });
  const [graceOver, setGraceOver] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setMemberState({ status: "loading" });
    setGraceOver(false);
    withTimeout(loadMember(userId), LOAD_TIMEOUT_MS)
      .then((member) => {
        if (!cancelled) setMemberState({ status: "ready", member });
      })
      .catch((err) => {
        console.error("Lenses: could not load member", err);
        if (!cancelled) setMemberState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  const member = memberState.status === "ready" ? memberState.member : null;
  const isLuminary = isLuminaryMember(
    member ? { is_subscriber: member.profilePaid } : null,
    subscription.subscribed,
    getDevTierOverride(),
  );

  useEffect(() => {
    if (!member || isLuminary) return;
    const id = setTimeout(() => setGraceOver(true), SUBSCRIPTION_GRACE_MS);
    return () => clearTimeout(id);
  }, [member, isLuminary]);

  const triad = useMemo(() => cachedTriad(now), [now]);
  const transitSign = triad.tropical.sign;

  const forYou = useMemo(
    () =>
      member && isLuminary
        ? buildForYou({
            natalSun: member.sun,
            natalMoon: member.moon,
            natalSiderealMoon: member.siderealMoon,
            tropical: triad.tropical.sign,
            draconic: triad.draconic.sign,
            at: now,
          })
        : undefined,
    [member, isLuminary, triad, now],
  );

  // Today's triad_states row (natal Sun × natal Moon × transiting Moon).
  const [triadRow, setTriadRow] = useState<TriadRowState>({ status: "loading" });
  const sunKey = member?.sun;
  const moonKey = member?.moon;
  const blueprintTitle = member?.combinationTitle;
  useEffect(() => {
    if (!sunKey || !moonKey || !isLuminary) return;
    let cancelled = false;
    setTriadRow({ status: "loading" });
    withTimeout(
      supabase
        .from("triad_states")
        .select("combination_title, triad_number, integration_invitation, daily_ritual")
        .eq("natal_sun_sign", sunKey)
        .eq("natal_moon_sign", moonKey)
        .eq("transiting_moon_sign", transitSign)
        .maybeSingle(),
      TRIAD_TIMEOUT_MS,
    )
      .then(({ data }) => {
        if (!cancelled) setTriadRow({ status: "done", panel: resolveTriadPanel(data, blueprintTitle) });
      })
      .catch((err) => {
        console.error("Lenses: could not load today's Triad", err);
        if (!cancelled) setTriadRow({ status: "done", panel: { kind: "generic" } });
      });
    return () => {
      cancelled = true;
    };
  }, [sunKey, moonKey, transitSign, isLuminary, blueprintTitle]);

  if (memberState.status === "error") {
    return (
      <div className="sov-shell min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--sov-champagne))] mb-3">
            Lenses unavailable
          </div>
          <p className="text-sm normal-case tracking-normal leading-relaxed text-[hsl(var(--sov-ivory)/0.7)] mb-5">
            We couldn't load your Lenses just now. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="font-display text-[11px] tracking-[0.3em] uppercase text-[hsl(var(--sov-champagne))] border border-[hsl(var(--sov-champagne)/0.5)] px-5 py-2 rounded-sm hover:bg-[hsl(var(--sov-champagne)/0.08)] transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!member || (!isLuminary && !graceOver)) return <CalibratingScreen />;

  if (!isLuminary) {
    return (
      <div className="sov-shell min-h-screen">
        <SEO title="The Three Lenses — Luminary" description="The Lenses are part of Luminary." noindex />
        <Navigation />
        <main className="pt-[68px] pb-24 px-4 sm:px-6">
          <div className="max-w-md mx-auto text-center pt-16">
            <div className="text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--sov-champagne))] mb-2">
              The Lenses
            </div>
            <h1 className="font-display text-3xl tracking-tight text-[hsl(var(--sov-ivory))]">
              Part of Luminary
            </h1>
            <p className="mt-3 text-sm sm:text-base normal-case tracking-normal leading-relaxed text-[hsl(var(--sov-ivory)/0.65)]">
              Luminary reads today's Moon through your own Sun and Moon.
            </p>
            <Link
              to="/pricing"
              className="mt-6 inline-block font-display text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--gold-light))] border border-[hsl(var(--gold-medium)/0.55)] px-5 py-2 rounded-sm hover:bg-[hsl(var(--gold-medium)/0.08)] transition-colors"
            >
              Unlock Luminary
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hero = personalHero(member.sun, member.moon, member.combinationTitle);

  const synthesisSlot =
    triadRow.status === "loading" ? (
      <TriadLoadingCard />
    ) : triadRow.panel.kind === "personal" ? (
      <PersonalTriadCard panel={triadRow.panel} />
    ) : undefined;

  return (
    <div className="sov-shell min-h-screen">
      <SEO
        title="The Three Lenses — Tropical, Sidereal & Draconic Moon"
        description="One Luminary View of today's Moon through Tropical (persona), Sidereal (wiring), and Draconic (soul) lenses."
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
              Three Lenses, One Luminary View
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[hsl(var(--sov-ivory)/0.65)] max-w-xl mx-auto leading-relaxed">
              The same Moon, read through three lenses — Persona, Wiring, Soul.
            </p>
            <div className="mt-6 mx-auto max-w-xl">
              {hero.kicker && (
                <p className="text-sm normal-case tracking-normal text-violet-200">{hero.kicker}</p>
              )}
              <h2
                className="mt-2 font-display text-[1.75rem] sm:text-4xl md:text-5xl leading-[1.15] tracking-wide text-[#d4af37] break-words"
                style={{ textWrap: "balance", textShadow: "0 0 22px rgba(212, 175, 55, 0.35)" }}
              >
                {hero.headline}
              </h2>
            </div>
            <div className="mt-4 text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--sov-ivory)/0.4)]">
              Lahiri Ayanamsha · {triad.ayanamsha.toFixed(4)}°
            </div>
          </header>

          <div className="mb-8">
            <DailyPulse
              at={now}
              forYou={forYou}
              synthesisSlot={synthesisSlot}
              timeZone={member.timeZone}
            />
          </div>

          <div className="grid gap-6 grid-cols-1 items-start">
            <article className="sov-card">
              <div className="text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--sov-champagne))] mb-3">
                Three Lenses, One Luminary View
              </div>
              <p className="text-[15px] leading-relaxed text-[hsl(var(--sov-ivory)/0.78)] mb-3">
                The three positions rarely agree — and that is the point. When today's Tropical,
                Sidereal, and Draconic Moon positions all land in the same sign, the day is
                unusually unified: outer weather, inner wiring, and soul direction are pulling in
                one line. On these days, move boldly.
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
              <p className="mt-5 text-sm normal-case tracking-normal leading-relaxed text-[hsl(var(--sov-ivory)/0.6)]">
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
