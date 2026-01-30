import { useNavigate } from "react-router-dom";
import moonLogo from "@/assets/moon-logo-transparent.png";
import { getCurrentMoon, getMoonMessage } from "@/lib/currentMoon";
import { Lock } from "lucide-react";
import CelestialBackground from "@/components/CelestialBackground";
import GlassmorphismCard from "@/components/GlassmorphismCard";

const Index = () => {
  const navigate = useNavigate();
  const moonData = getCurrentMoon();
  const moonMessage = getMoonMessage(moonData);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Animated Celestial Background - Full Screen */}
      <CelestialBackground />

      {/* Navigation Bar - Clean, no logo */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-end">
          {/* Portal Link */}
          <button
            onClick={() => navigate("/portal")}
            className="font-display text-sm tracking-widest uppercase text-primary/80 hover:text-primary transition-colors duration-300"
          >
            Enter Portal
          </button>
        </nav>
      </header>

      {/* Hero Section - Full Screen Cinematic Moon */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Cinematic Moon Display - Centered for Desktop */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
          
          {/* Main Logo - Centered Above Card */}
          <div className="mb-10 lg:mb-14 animate-fade-up">
            <img
              src={moonLogo}
              alt="Moonday Live"
              className="w-48 md:w-56 lg:w-64 h-auto drop-shadow-2xl mx-auto"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>

          {/* Current Moon Sign - Glassmorphism Card */}
          <GlassmorphismCard 
            size="lg" 
            className="max-w-3xl w-full mx-auto animate-fade-up stagger-1"
          >
            <div className="text-center">
              {/* Moon Phase Emoji - Large */}
              <div className="mb-6 lg:mb-8">
                <span className="text-7xl md:text-8xl lg:text-9xl filter drop-shadow-2xl">
                  {moonData.phaseEmoji}
                </span>
              </div>

              {/* Zodiac Symbol */}
              <div className="mb-4 lg:mb-6">
                <span className="text-4xl md:text-5xl lg:text-6xl text-primary font-display">
                  {moonData.symbol}
                </span>
              </div>

              {/* Moon Sign Name */}
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-gold-gradient tracking-wider mb-6">
                Moon in {moonData.sign}
              </h1>

              {/* Element Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 glass-card rounded-full mb-8">
                <span className="font-serif text-lg md:text-xl text-cream-muted">
                  {moonData.element} Sign
                </span>
                <span className="text-primary/60">•</span>
                <span className="font-serif text-lg md:text-xl text-cream-muted">
                  {moonData.phase}
                </span>
                <span className="text-primary/60">•</span>
                <span className="font-serif text-lg md:text-xl text-cream-muted">
                  {moonData.illumination}% Illumination
                </span>
              </div>

              {/* Moon Message */}
              <p className="sanctuary-text text-cream-muted max-w-2xl mx-auto leading-relaxed">
                {moonMessage}
              </p>
            </div>
          </GlassmorphismCard>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="flex flex-col items-center gap-2">
              <div className="w-px h-10 bg-gradient-to-b from-primary/50 to-transparent" />
              <span className="font-serif text-sm text-cream-muted/50 tracking-widest uppercase">
                Discover Your Ritual
              </span>
            </div>
          </div>
        </section>

        {/* The Tease - Locked Daily Ritual Section */}
        <section className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20 relative">
          {/* Decorative separator */}
          <div className="flex items-center gap-4 mb-16 animate-fade-up">
            <div className="w-32 md:w-40 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="w-3 h-3 rotate-45 border border-primary/50" />
            <div className="w-32 md:w-40 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>

          {/* Locked Content Card */}
          <div className="relative max-w-2xl w-full animate-fade-up stagger-1">
            {/* Blur Overlay */}
            <GlassmorphismCard className="absolute inset-0 z-10 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full glass-card flex items-center justify-center mb-8 shadow-glow">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-display text-3xl md:text-4xl text-gold-gradient mb-4 text-center">
                Your Daily Ritual Awaits
              </h3>
              <p className="font-serif text-xl text-cream-muted mb-10 text-center px-6 max-w-md">
                Unlock personalized lunar rituals, crystal guidance, and sacred practices
              </p>
              
              {/* Glowing CTA Button */}
              <button
                onClick={() => navigate("/portal")}
                className="group relative px-14 py-5 font-display text-lg tracking-widest uppercase overflow-hidden rounded-xl glass-card shadow-glow hover:shadow-gold transition-all duration-500"
              >
                <span className="relative z-10 text-primary group-hover:text-gold-pale transition-colors">
                  Begin Your Journey
                </span>
                {/* Animated glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-pulse" />
              </button>
            </GlassmorphismCard>

            {/* Blurred Background Content (teaser) */}
            <div className="p-12 md:p-14 opacity-30 blur-md pointer-events-none select-none">
              <h2 className="font-display text-xl tracking-wider text-foreground mb-6 text-center">
                Today's Ritual: The {moonData.sign} Awakening
              </h2>
              <div className="space-y-4">
                <p className="font-serif text-cream-muted leading-relaxed">
                  ✨ Morning Affirmation: "I embrace the energy of {moonData.sign}..."
                </p>
                <p className="font-serif text-cream-muted leading-relaxed">
                  🌙 Sacred Practice: Light a candle during the golden hour...
                </p>
                <p className="font-serif text-cream-muted leading-relaxed">
                  💎 Crystal Companion: Hold your moonstone close...
                </p>
                <p className="font-serif text-cream-muted leading-relaxed">
                  ⏱️ Best Timing: Perform at moonrise for maximum power...
                </p>
              </div>
            </div>
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
