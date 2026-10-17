import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

/* ────────────────────────────────────────────────────────────
   Triad Preview — public conversion page
   Linked from the Blueprint email's "Not yet" CTA.
   Shows the natal forces (Sun / Moon) with
   blurred synthesis text and a gate CTA to /pricing.
   ──────────────────────────────────────────────────────────── */

const FORCES = [
  {
    ordinal: "The First Force",
    glyph: "☀",
    name: "The Luminary",
    role: "Your will · the light you generate",
    synthesis:
      "Your Sun sign is the engine of your identity — the quality of attention you bring to " +
      "everything you choose. It describes not just who you are, but what you are compelled to " +
      "master. Where your Luminary falls reveals the arena where your vitality finds fullest " +
      "expression, and where its absence leaves you dimmed. This is the force that wants to be " +
      "seen. It tolerates no long-term suppression.",
  },
  {
    ordinal: "The Second Force",
    glyph: "☽",
    name: "The Tide",
    role: "Your instinct · the current beneath you",
    synthesis:
      "Your Moon sign is the architecture of your inner life — the emotional logic running beneath " +
      "every decision. It holds what you need when no one is watching, what you reach for under " +
      "pressure, and what conditions allow you to truly rest. The Tide flows regardless of whether " +
      "you acknowledge it. Understanding it changes what you ask of the people closest to you — " +
      "and of yourself.",
  },
];

export default function TriadPreview() {
  const navigate = useNavigate();

  return (
    <div className="sov-shell min-h-screen">
      <SEO
        title="Your Triad — Forces Shaping Your Path"
        description="Preview the cosmic forces that structure your nature: The Luminary and The Tide. Unlock the full Triad with Luminary."
        canonical="https://moondaylive.com/triad-preview"
      />
      <Navigation />

      <main className="pt-[68px] pb-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">

          {/* ── Hero ─────────────────────────────────────────── */}
          <header className="text-center mb-12 pt-10">
            <div className="text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--sov-champagne))] mb-3">
              Your cosmic architecture
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-tight text-[hsl(var(--sov-ivory))] mb-5">
              The Triad
            </h1>
            <p className="text-base font-sans not-italic text-[hsl(var(--sov-ivory)/0.7)] max-w-md mx-auto leading-relaxed">
              Where your Blueprint revealed the tone of your nature,
              the Triad reveals its structure — the forces that govern
              everything you pursue, protect, and present.
            </p>
          </header>

          {/* Hairline divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[hsl(var(--sov-champagne)/0.28)] to-transparent mb-12" />

          {/* ── Force cards ───────────────────────────────────── */}
          <div className="flex flex-col gap-5 mb-12">
            {FORCES.map((force) => (
              <article key={force.name} className="sov-card overflow-hidden">

                {/* Card header */}
                <div className="flex items-start gap-5 pb-4 mb-4 border-b border-[hsl(var(--sov-champagne)/0.12)]">
                  <div className="text-3xl leading-none mt-1 select-none">{force.glyph}</div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--sov-ivory)/0.42)] mb-1">
                      {force.ordinal}
                    </div>
                    <h2 className="font-display text-2xl text-[hsl(var(--sov-ivory))] leading-tight mb-1">
                      {force.name}
                    </h2>
                    <p className="text-[13px] italic text-[hsl(var(--sov-champagne)/0.72)]">
                      {force.role}
                    </p>
                  </div>
                </div>

                {/* Blurred synthesis + lock overlay */}
                <div className="relative">
                  <p className="text-[15px] leading-relaxed text-[hsl(var(--sov-ivory)/0.72)]
                                blur-sm select-none pointer-events-none">
                    {force.synthesis}
                  </p>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2
                                  bg-gradient-to-b from-transparent via-black/50 to-black/80">
                    <svg
                      className="w-5 h-5 text-[hsl(var(--sov-champagne)/0.65)]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--sov-ivory)/0.42)]">
                      Unlock with Luminary
                    </span>
                  </div>
                </div>

              </article>
            ))}
          </div>

          {/* ── Gate / CTA ────────────────────────────────────── */}
          <div className="sov-card text-center py-10 px-6 mb-6">
            <div className="text-[hsl(var(--sov-champagne)/0.6)] tracking-widest mb-5 select-none">
              ✦ &thinsp; ✦ &thinsp; ✦
            </div>
            <h2 className="font-display text-2xl md:text-3xl italic text-[hsl(var(--sov-ivory))] mb-4 leading-snug">
              Two forces. One coherent signature.
            </h2>
            <p className="text-[15px] text-[hsl(var(--sov-ivory)/0.62)] max-w-sm mx-auto leading-relaxed mb-5">
              Your Luminary and Tide are already assembled from your Blueprint.
              Luminary completes your Triad, and shows you where they converge —
              and where they pull against each other.
            </p>
            <blockquote className="text-[13px] italic text-[hsl(var(--sov-champagne)/0.62)]
                                   border border-[hsl(var(--sov-champagne)/0.2)] rounded-md
                                   px-5 py-3 max-w-xs mx-auto mb-8 leading-relaxed">
              Most people mistake Triad friction for character flaws.
              It isn't. It's architecture — and it responds to understanding.
            </blockquote>
            <button
              onClick={() => navigate("/pricing")}
              className="bg-[hsl(var(--sov-champagne))] text-black font-bold text-sm
                         tracking-[0.08em] px-10 py-4 rounded-md hover:opacity-88
                         transition-opacity cursor-pointer"
            >
              ✦&nbsp; Unlock Luminary
            </button>
            <p className="mt-3 text-[11px] text-[hsl(var(--sov-ivory)/0.32)] tracking-wide">
              Complete your Triad &amp; activate your daily practice
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
