import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentMoon } from "@/lib/currentMoon";
import { Moon, Users, BookOpen, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import MoonLoader from "@/components/MoonLoader";

const features = [
  {
    icon: Moon,
    title: "Lunar Awareness",
    description:
      "Track the Moon's transit through each zodiac sign and understand how it shapes your emotional landscape every 2.5 days.",
  },
  {
    icon: Users,
    title: "Cooperation & Community",
    description:
      "We believe self-knowledge is the first step toward meaningful connection. Know yourself, then show up for others.",
  },
  {
    icon: BookOpen,
    title: "Living Encyclopedia",
    description:
      "Twelve deep-dive portals into the soul's emotional architecture — myth, psychology, and practical ritual in one place.",
  },
  {
    icon: Sparkles,
    title: "Daily Alignment",
    description:
      "Receive a personalized emotional forecast each day so you can stabilize your own energy before navigating the world.",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <MoonLoader size="lg" text="Aligning the stars..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col relative overflow-x-hidden">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-5 md:px-12">
        <nav className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-[#e4e4e7]/80 font-medium tracking-widest text-sm uppercase">
            Moonday
          </span>
          <button
            onClick={() => navigate("/portal")}
            className="text-sm tracking-widest uppercase text-[#e4e4e7]/50 hover:text-[#6B4E71] transition-colors duration-300"
          >
            Login
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col relative z-10">
        <section className="min-h-[70vh] flex flex-col items-center justify-center px-6 md:px-8 relative">
          {/* Soft lilac glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(107,78,113,0.15) 0%, rgba(107,78,113,0.05) 40%, transparent 70%)",
            }}
          />

          <div className="text-center max-w-2xl mx-auto relative z-10">
            {/* Current moon sign — small accent */}
            <p className="text-[#6B4E71] text-sm tracking-[0.3em] uppercase mb-6 animate-fade-up">
              {moonData.symbol} Moon in {moonData.sign}
            </p>

            {/* Main headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#e4e4e7] tracking-tight leading-[1.15] mb-6 animate-fade-up stagger-1">
              Navigate Your
              <br />
              Internal Weather
            </h1>

            {/* Sub-headline */}
            <p className="text-lg md:text-xl text-[#e4e4e7]/50 max-w-lg mx-auto leading-relaxed mb-10 animate-fade-up stagger-2">
              A moon sign navigator for the changing world. Understand your emotional portrait as the moon shifts every 2.5 days.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-3">
              <button
                onClick={() => navigate("/blueprint")}
                className="px-8 py-3 bg-[#6B4E71] hover:bg-[#7d5c83] text-[#e4e4e7] text-sm tracking-widest uppercase rounded-2xl transition-all duration-300"
              >
                View Today's Frequency
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-8 py-3 border border-[#6B4E71]/30 hover:border-[#6B4E71]/60 text-[#e4e4e7]/60 hover:text-[#e4e4e7] text-sm tracking-widest uppercase rounded-2xl transition-all duration-300"
              >
                Join Sovereign Tier
              </button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 md:py-32 px-6 md:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-16 animate-fade-up">
              <p className="text-[#6B4E71] text-xs tracking-[0.3em] uppercase mb-4">
                Our Mission
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-[#e4e4e7] tracking-tight mb-4">
                Cooperation Through Self-Knowledge
              </h2>
              <p className="text-[#e4e4e7]/40 max-w-md mx-auto">
                The best way to help the world is to help yourself by knowing yourself.
              </p>
            </div>

            {/* Card grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, i) => (
                <Card
                  key={feature.title}
                  className={`bg-[#18181b] border border-[#6B4E71]/15 hover:border-[#6B4E71]/30 rounded-2xl transition-all duration-500 animate-fade-up stagger-${i + 1}`}
                >
                  <CardHeader className="p-8">
                    <feature.icon
                      className="w-5 h-5 text-[#6B4E71] mb-4"
                      strokeWidth={1.5}
                    />
                    <CardTitle className="text-lg text-[#e4e4e7] font-medium tracking-wide mb-2">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-[#e4e4e7]/45 leading-relaxed text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Minimal footer */}
      <footer className="py-8 border-t border-[#6B4E71]/10">
        <div className="text-center">
          <span className="text-[#e4e4e7]/20 text-xs tracking-widest uppercase">
            Moonday Live
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
