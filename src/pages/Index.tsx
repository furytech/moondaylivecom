import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentMoon } from "@/lib/currentMoon";
import { Moon, Sparkles, Compass } from "lucide-react";
import MoonLoader from "@/components/MoonLoader";
import Footer from "@/components/Footer";

const pillars = [
  {
    title: "The Moon Sign Connection",
    body: "Your sun sign is your identity; your moon sign is your soul's reaction. It governs your subconscious, instinctive, emotional self.",
  },
  {
    title: "Rapid, Subtle Shifts",
    body: "The moon moves ten times faster than the sun, changing signs every 2.5 days. This explains the quiet emotional weather you can't quite name.",
  },
  {
    title: "Your Unique Reactivity",
    body: "Each moon sign creates a distinct emotional default. Moonday Live helps you read yours — and the sky overhead — with clarity.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const moonData = getCurrentMoon();

  useEffect(() => {
    if (user && !loading) {
      navigate("/blueprint", { replace: true });
    }
  }, [user, loading, navigate]);

  // Stable starfield
  const stars = useMemo(
    () =>
      [...Array(40)].map((_, i) => ({
        id: i,
        top: `${(i * 13 + 7) % 100}%`,
        left: `${(i * 29 + 11) % 100}%`,
        delay: `${(i * 0.11) % 4}s`,
        size: i % 7 === 0 ? 2 : 1,
        opacity: 0.25 + ((i * 0.09) % 0.5),
      })),
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MoonLoader size="lg" text="Aligning the stars..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden">
      {/* Starfield */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-gold-pale animate-twinkle"
            style={{
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>

      {/* Ambient lilac nebula */}
      <div
        className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--lilac) / 0.18) 0%, hsl(var(--lilac) / 0.06) 35%, transparent 70%)",
        }}
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 md:px-12 border-b border-lilac/10 bg-background/78 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="font-display text-xl tracking-[0.25em] text-foreground/90 uppercase"
          >
            Moonday<span className="text-lilac">.</span>Live
          </button>
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => navigate("/portal")}
              className="text-xs md:text-sm tracking-[0.2em] uppercase text-foreground/60 hover:text-lilac transition-colors duration-300"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-5 py-2 md:px-6 md:py-2.5 bg-lilac hover:bg-lilac-light text-primary-foreground text-xs md:text-sm tracking-[0.2em] uppercase rounded-full transition-all duration-300 shadow-[0_0_30px_-8px_hsl(var(--lilac)/0.6)]"
            >
              Find My Moon Sign
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-14 md:pt-16">
        {/* Hero */}
        <header className="pt-0 pb-16 md:pt-0 md:pb-24 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Moon orb */}
            <div className="relative inline-block mb-6 animate-fade-up">
              <div
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-lilac/30"
                style={{
                  background:
                    "radial-gradient(circle at 35% 30%, hsl(var(--cream) / 0.85), hsl(var(--lilac) / 0.4) 45%, hsl(var(--navy-dark)) 80%)",
                  boxShadow:
                    "0 0 60px -10px hsl(var(--lilac) / 0.6), inset -10px -15px 40px hsl(var(--navy-deep) / 0.8)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Moon className="w-12 h-12 md:w-14 md:h-14 text-cream/80" strokeWidth={1.2} />
              </div>
            </div>

            <p className="text-lilac text-base md:text-lg tracking-[0.3em] uppercase mb-6 animate-fade-up stagger-1">
              {moonData.symbol} Moon in {moonData.sign} · Tonight
            </p>

            <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6 animate-fade-up stagger-2">
              Stop wondering why
              <br />
              today feels different.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12 animate-fade-up stagger-3">
              The moon's 2.5-day cycle directly shapes your emotional climate.
              Your birth moon sign is the quiet key to how — and why — you react
              the way you do.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-4">
              <button
                onClick={() => navigate("/signup")}
                className="px-10 py-4 bg-lilac hover:bg-lilac-light text-primary-foreground text-sm tracking-[0.2em] uppercase rounded-full transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)]"
              >
                Begin Your Lunar Journey
              </button>
              <button
                onClick={() => navigate("/portal")}
                className="px-10 py-4 border border-lilac/30 hover:border-lilac/60 text-foreground/80 hover:text-foreground text-sm tracking-[0.2em] uppercase rounded-full transition-all duration-300"
              >
                Sign In
              </button>
            </div>
          </div>
        </header>

        {/* Three pillars */}
        <section className="py-20 md:py-28 px-6 border-t border-lilac/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-fade-up">
              <p className="text-lilac text-xs tracking-[0.3em] uppercase mb-4">
                Why Moonday
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                The Lunar Signature
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {pillars.map((p, i) => (
                <div
                  key={p.title}
                  className={`group relative p-8 md:p-10 rounded-3xl border border-lilac/15 bg-card/40 backdrop-blur-xl transition-all duration-500 hover:border-lilac/35 hover:bg-card/60 hover:shadow-[0_0_60px_-15px_hsl(var(--lilac)/0.35)] animate-fade-up stagger-${i + 1}`}
                >
                  <div className="text-lilac text-3xl mb-6 font-display">✦</div>
                  <h3 className="font-display text-xl md:text-2xl font-medium text-foreground mb-4 tracking-wide">
                    {p.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 md:py-28 px-6 border-t border-lilac/10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 animate-fade-up">
              <p className="text-lilac text-xs tracking-[0.3em] uppercase mb-4">
                How It Works
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                Three Steps to Clarity
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { n: "01", t: "Enter your birth date", d: "We calculate your natal moon sign using precise astronomical data." },
                { n: "02", t: "Receive your blueprint", d: "Your emotional architecture — strengths, shadows, and rituals — revealed." },
                { n: "03", t: "Tune in daily", d: "A personalized forecast as the moon shifts through the zodiac every 2.5 days." },
              ].map((step, i) => (
                <div
                  key={step.n}
                  className={`text-center animate-fade-up stagger-${i + 1}`}
                >
                  <div className="font-display text-5xl text-lilac/40 mb-4">{step.n}</div>
                  <h3 className="font-display text-lg text-foreground mb-3 tracking-wide">{step.t}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — free moon sign */}
        <section
          id="cta"
          className="py-20 md:py-28 px-6 text-center border-t border-lilac/10"
        >
          <div className="max-w-3xl mx-auto">
            <Sparkles className="w-6 h-6 text-lilac mx-auto mb-6" strokeWidth={1.5} />
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-6">
              Unlock your birth moon sign —
              <br />
              <span className="text-lilac">for free.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto leading-relaxed">
              Enter your birth details to find your starting point. No credit
              card, no commitment. If Moonday speaks to you, the journey
              continues from there.
            </p>

            <div
              className="inline-block p-10 md:p-12 rounded-3xl border border-lilac/20 bg-card/50 backdrop-blur-xl max-w-lg w-full shadow-[0_0_80px_-20px_hsl(var(--lilac)/0.4)]"
            >
              <p className="font-display text-sm text-lilac/80 tracking-[0.25em] uppercase mb-6">
                Begin in Moments
              </p>
              <button
                onClick={() => navigate("/signup")}
                className="w-full bg-lilac hover:bg-lilac-light text-primary-foreground font-medium py-4 rounded-2xl text-sm tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)]"
              >
                Find My Moon Sign
              </button>
            </div>
          </div>
        </section>

        {/* Sovereign Tier teaser */}
        <section className="py-20 md:py-28 px-6 text-center border-t border-lilac/10">
          <div className="max-w-4xl mx-auto">
            <Compass className="w-6 h-6 text-lilac mx-auto mb-6" strokeWidth={1.5} />
            <p className="text-lilac text-xs tracking-[0.3em] uppercase mb-4">
              Go Deeper
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-6">
              The Sovereign Tier
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Personalized daily analysis, long-term trend forecasting, and the
              Sovereign Reflection — a deep reading of why you react the way you
              do during specific transits.
            </p>

            <div className="relative inline-block max-w-3xl w-full rounded-3xl overflow-hidden border border-lilac/20 bg-card/40 backdrop-blur-xl">
              <div className="aspect-[16/9] relative">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 40%, hsl(var(--lilac) / 0.25), transparent 60%), radial-gradient(circle at 70% 60%, hsl(var(--navy-medium) / 0.6), transparent 70%)",
                  }}
                />
                <div className="absolute inset-0 backdrop-blur-md bg-navy-deep/40 z-10" />
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-8">
                  <h3 className="font-display text-2xl md:text-3xl text-foreground mb-4 tracking-wide">
                    Unlock Sovereign Insight
                  </h3>
                  <p className="text-muted-foreground mb-8 max-w-sm text-sm md:text-base">
                    Your personalized Emotional Climate report and predictive lunar tools.
                  </p>
                  <button
                    onClick={() => navigate("/pricing")}
                    className="px-8 py-3 bg-lilac hover:bg-lilac-light text-primary-foreground text-sm tracking-[0.2em] uppercase rounded-full transition-all duration-300 shadow-[0_0_30px_-8px_hsl(var(--lilac)/0.6)]"
                  >
                    Enter the Sovereign Tier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA band */}
        <section className="py-16 md:py-20 px-6 text-center border-t border-lilac/10 bg-card/30">
          <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            The sky is already moving.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Step into rhythm with it.
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="px-10 py-4 bg-lilac hover:bg-lilac-light text-primary-foreground text-sm tracking-[0.2em] uppercase rounded-full transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)]"
          >
            Begin Your Lunar Journey
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
