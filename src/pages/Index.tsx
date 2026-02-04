import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentMoon, getMoonMessage } from "@/lib/currentMoon";
import { Lock } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import MoonLoader from "@/components/MoonLoader";
import moonLogo from "@/assets/moon-logo-new.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const moonData = getCurrentMoon();
  const moonMessage = getMoonMessage(moonData);

  // Redirect logged-in users to Blueprint
  useEffect(() => {
    if (user && !loading) {
      navigate("/blueprint", { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loader while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MoonLoader size="lg" text="Aligning the stars..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      {/* Decorative stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold-pale rounded-full animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Navigation Bar - Refined spacing */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 md:px-12 md:py-8">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo mark in header */}
          <div 
            className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden cursor-pointer opacity-60 hover:opacity-100 transition-opacity duration-300"
            onClick={() => navigate("/")}
          >
            <img
              src={moonLogo}
              alt="Moonday"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={() => navigate("/portal")}
            className="font-display text-xs md:text-sm tracking-[0.25em] uppercase text-primary/60 hover:text-primary transition-colors duration-500"
          >
            Enter Portal
          </button>
        </nav>
      </header>

      {/* Hero Section - Compact */}
      <main className="flex-1 flex flex-col relative z-10">
        <section className="pt-16 md:pt-20 pb-6 flex flex-col items-center px-6 md:px-8 lg:px-12">
          
          {/* Moon Logo - Refined proportions */}
          <div className="animate-float mb-4 md:mb-6">
            <div className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full overflow-hidden hover-scale-subtle bg-background logo-halo">
              <img
                src={moonLogo}
                alt="Moonday"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Moon Sign Card - Text First Design */}
          <GlassmorphismCard 
            size="lg" 
            className="max-w-xl md:max-w-2xl w-full mx-auto animate-fade-up stagger-1"
          >
            <div className="text-center px-2 md:px-4">
              {/* Subtle Zodiac Symbol */}
              <div className="mb-3 md:mb-4">
                <span className="text-2xl md:text-3xl text-primary/50 font-light">
                  {moonData.symbol}
                </span>
              </div>

              {/* Hero Text - Balanced Typography */}
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-gold-gradient tracking-[0.06em] mb-4 md:mb-5">
                Moon in {moonData.sign}
              </h1>

              {/* Element & Phase - Refined spacing */}
              <div className="flex items-center justify-center gap-4 md:gap-5 mb-4 md:mb-5">
                <span className="font-serif text-sm md:text-base text-cream-muted/60 tracking-wide">
                  {moonData.element}
                </span>
                <span className="w-0.5 h-0.5 rounded-full bg-primary/30" />
                <span className="font-serif text-sm md:text-base text-cream-muted/60 tracking-wide">
                  {moonData.phase}
                </span>
                <span className="w-0.5 h-0.5 rounded-full bg-primary/30" />
                <span className="font-serif text-sm md:text-base text-cream-muted/60 tracking-wide">
                  {moonData.illumination}%
                </span>
              </div>

              {/* Moon Message - Refined */}
              <p className="font-serif text-base md:text-lg text-cream-muted/70 max-w-md mx-auto leading-relaxed">
                {moonMessage}
              </p>
            </div>
          </GlassmorphismCard>

          {/* Scroll Indicator - Subtle */}
          <div className="mt-5 md:mt-6 animate-fade-up stagger-2">
            <div className="w-px h-5 mx-auto bg-gradient-to-b from-primary/30 to-transparent" />
          </div>
        </section>

        {/* The Tease - Elegant Locked Section */}
        <section className="flex flex-col items-center justify-center px-6 md:px-8 py-8 md:py-10 relative">
          {/* Decorative separator */}
          <div className="flex items-center gap-4 mb-5 animate-fade-up">
            <div className="w-12 md:w-16 h-px bg-gradient-to-r from-transparent to-primary/25" />
            <div className="w-1 h-1 rounded-full bg-primary/30" />
            <div className="w-12 md:w-16 h-px bg-gradient-to-l from-transparent to-primary/25" />
          </div>

          {/* Elegant CTA Card */}
          <div className="text-center max-w-md animate-fade-up stagger-1">
            {/* Lock Icon - Refined size */}
            <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 rounded-full border border-primary/25 flex items-center justify-center">
              <Lock className="w-4 h-4 md:w-5 md:h-5 text-primary/60" strokeWidth={1.5} />
            </div>
            
            <h3 className="font-display text-xl md:text-2xl text-gold-gradient tracking-[0.05em] mb-3">
              Your Ritual Awaits
            </h3>
            
            <p className="font-serif text-sm md:text-base text-cream-muted/50 mb-5 leading-relaxed">
              Personalized lunar guidance, crystal wisdom, and sacred practices
            </p>
            
            {/* Premium CTA Button - Refined */}
            <button
              onClick={() => navigate("/signup")}
              className="group px-8 md:px-10 py-2.5 md:py-3 font-display text-xs md:text-sm tracking-[0.2em] uppercase border border-primary/30 rounded-full text-primary/80 hover:text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-500"
            >
              Begin Your Journey
            </button>
          </div>

          {/* Bottom decorative element */}
          <div className="mt-10 flex flex-col items-center gap-2 animate-fade-up stagger-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <div className="w-1.5 h-1.5 rotate-45 border border-primary/20" />
              <div className="w-10 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </div>
            <span className="font-serif text-xs md:text-sm text-cream-muted/40 tracking-wider">
              Join thousands embracing their lunar path
            </span>
          </div>
        </section>
      </main>

      {/* Celestial footer accent */}
      <footer className="py-5 border-t border-primary/10 relative z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="w-10 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="w-1.5 h-1.5 rotate-45 bg-primary/30" />
          <div className="w-10 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </footer>
    </div>
  );
};

export default Index;
