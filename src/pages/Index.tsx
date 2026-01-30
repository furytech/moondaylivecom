import { useNavigate } from "react-router-dom";
import { getCurrentMoon, getMoonMessage } from "@/lib/currentMoon";
import { Lock } from "lucide-react";
import CelestialBackground from "@/components/CelestialBackground";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import CrescentMoon from "@/components/CrescentMoon";

const Index = () => {
  const navigate = useNavigate();
  const moonData = getCurrentMoon();
  const moonMessage = getMoonMessage(moonData);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Animated Celestial Background - Full Screen */}
      <CelestialBackground />

      {/* Navigation Bar - Clean, minimal */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
        <nav className="max-w-7xl mx-auto flex items-center justify-end">
          <button
            onClick={() => navigate("/portal")}
            className="font-display text-sm tracking-[0.2em] uppercase text-primary/70 hover:text-primary transition-colors duration-500"
          >
            Enter Portal
          </button>
        </nav>
      </header>

      {/* Hero Section - Full Screen */}
      <main className="flex-1 flex flex-col relative z-10">
        <section className="min-h-screen flex flex-col items-center justify-start px-6 pt-40 lg:pt-48 pb-8">
          
          {/* CSS Crescent Moon - Golden Anchor */}
          <div className="mb-10 lg:mb-12 animate-fade-up">
            <CrescentMoon size="lg" />
          </div>

          {/* Moon Sign Card - Text First Design */}
          <GlassmorphismCard 
            size="lg" 
            className="max-w-2xl w-full mx-auto animate-fade-up stagger-1"
          >
            <div className="text-center">
              {/* Subtle Zodiac Symbol */}
              <div className="mb-6">
                <span className="text-3xl md:text-4xl text-primary/60 font-light">
                  {moonData.symbol}
                </span>
              </div>

              {/* Hero Text - Large Luxury Typography */}
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-gold-gradient tracking-[0.08em] mb-8">
                Moon in {moonData.sign}
              </h1>

              {/* Element & Phase - Minimal Line */}
              <div className="flex items-center justify-center gap-6 mb-10">
                <span className="font-serif text-lg text-cream-muted/70 tracking-wide">
                  {moonData.element}
                </span>
                <span className="w-1 h-1 rounded-full bg-primary/40" />
                <span className="font-serif text-lg text-cream-muted/70 tracking-wide">
                  {moonData.phase}
                </span>
                <span className="w-1 h-1 rounded-full bg-primary/40" />
                <span className="font-serif text-lg text-cream-muted/70 tracking-wide">
                  {moonData.illumination}%
                </span>
              </div>

              {/* Moon Message - Refined */}
              <p className="font-serif text-xl text-cream-muted/80 max-w-xl mx-auto leading-relaxed tracking-wide">
                {moonMessage}
              </p>
            </div>
          </GlassmorphismCard>

          {/* Scroll Indicator - Minimal */}
          <div className="mt-10 animate-fade-up stagger-2">
            <div className="w-px h-8 mx-auto bg-gradient-to-b from-primary/40 to-transparent" />
          </div>
        </section>

        {/* The Tease - Elegant Locked Section */}
        <section className="flex flex-col items-center justify-center px-6 py-12 relative">
          {/* Decorative separator */}
          <div className="flex items-center gap-6 mb-10 animate-fade-up">
            <div className="w-20 h-px bg-gradient-to-r from-transparent to-primary/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <div className="w-20 h-px bg-gradient-to-l from-transparent to-primary/30" />
          </div>

          {/* Elegant CTA Card */}
          <div className="text-center max-w-lg animate-fade-up stagger-1">
            {/* Lock Icon - Thin Line Style */}
            <div className="w-16 h-16 mx-auto mb-8 rounded-full border border-primary/30 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary/70" strokeWidth={1.5} />
            </div>
            
            <h3 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-[0.06em] mb-5">
              Your Ritual Awaits
            </h3>
            
            <p className="font-serif text-lg text-cream-muted/60 mb-10 leading-relaxed">
              Personalized lunar guidance, crystal wisdom, and sacred practices
            </p>
            
            {/* Premium CTA Button */}
            <button
              onClick={() => navigate("/portal")}
              className="group px-12 py-4 font-display text-sm tracking-[0.2em] uppercase border border-primary/40 rounded-full text-primary hover:bg-primary/10 hover:border-primary/60 transition-all duration-500"
            >
              Begin Your Journey
            </button>
          </div>

          {/* Bottom decorative element */}
          <div className="mt-20 flex flex-col items-center gap-4 animate-fade-up stagger-2">
            <div className="flex items-center gap-3">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="w-2 h-2 rotate-45 border border-primary/30" />
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
            <span className="font-serif text-base text-cream-muted/50 tracking-wider">
              Join thousands embracing their lunar path
            </span>
          </div>
        </section>
      </main>

      {/* Celestial footer accent */}
      <footer className="py-8 border-t border-primary/10 relative z-10">
        <div className="flex justify-center items-center gap-4">
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="w-2 h-2 rotate-45 bg-primary/30" />
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </footer>
    </div>
  );
};

export default Index;
