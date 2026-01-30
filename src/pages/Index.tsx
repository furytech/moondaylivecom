import { useNavigate } from "react-router-dom";
import moonLogo from "@/assets/moon-logo-new.png";
import { getCurrentMoon, getMoonMessage } from "@/lib/currentMoon";
import { Lock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const moonData = getCurrentMoon();
  const moonMessage = getMoonMessage(moonData);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
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

      {/* Hero Section - Full Screen Cinematic Moon */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Cinematic Moon Display - Takes most of viewport */}
        <section className="min-h-[85vh] lg:min-h-screen flex flex-col items-center justify-center px-6 py-12">
          {/* Logo - Top */}
          <div className="animate-fade-up mb-8 lg:mb-12">
            <img
              src={moonLogo}
              alt="Moonday Live"
              className="w-48 md:w-56 lg:w-64 h-auto cursor-pointer hover-scale-subtle"
              onClick={() => navigate("/")}
            />
          </div>

          {/* Current Moon Sign - Cinematic Display */}
          <div className="text-center animate-fade-up stagger-1">
            {/* Moon Phase Emoji - Large */}
            <div className="mb-6 lg:mb-8">
              <span className="text-8xl md:text-9xl lg:text-[12rem] filter drop-shadow-2xl">
                {moonData.phaseEmoji}
              </span>
            </div>

            {/* Zodiac Symbol */}
            <div className="mb-4 lg:mb-6">
              <span className="text-5xl md:text-6xl lg:text-7xl text-primary font-display">
                {moonData.symbol}
              </span>
            </div>

            {/* Moon Sign Name */}
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl xl:text-8xl text-gold-gradient tracking-wider mb-4">
              Moon in {moonData.sign}
            </h1>

            {/* Element Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-2 art-deco-border bg-card/30 backdrop-blur-sm mb-6">
              <span className="font-serif text-lg md:text-xl text-cream-muted">
                {moonData.element} Sign
              </span>
              <span className="text-primary">•</span>
              <span className="font-serif text-lg md:text-xl text-cream-muted">
                {moonData.phase}
              </span>
              <span className="text-primary">•</span>
              <span className="font-serif text-lg md:text-xl text-cream-muted">
                {moonData.illumination}% Illumination
              </span>
            </div>

            {/* Moon Message */}
            <p className="font-serif text-xl md:text-2xl lg:text-3xl text-cream-muted max-w-3xl mx-auto leading-relaxed">
              {moonMessage}
            </p>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="flex flex-col items-center gap-2">
              <div className="w-px h-8 bg-gradient-to-b from-primary/50 to-transparent" />
              <span className="font-serif text-sm text-cream-muted/60 tracking-wider">
                Discover Your Ritual
              </span>
            </div>
          </div>
        </section>

        {/* The Tease - Locked Daily Ritual Section */}
        <section className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16 relative">
          {/* Decorative separator */}
          <div className="flex items-center gap-4 mb-12 animate-fade-up">
            <div className="w-24 md:w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            <div className="w-3 h-3 rotate-45 border border-primary" />
            <div className="w-24 md:w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          </div>

          {/* Locked Content Card */}
          <div className="relative max-w-2xl w-full animate-fade-up stagger-1">
            {/* Blur Overlay */}
            <div className="absolute inset-0 bg-card/60 backdrop-blur-lg rounded-lg border border-primary/20 z-10 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl text-gold-gradient mb-3">
                Your Daily Ritual Awaits
              </h3>
              <p className="font-serif text-lg text-cream-muted mb-8 text-center px-6">
                Unlock personalized lunar rituals, crystal guidance, and sacred practices
              </p>
              
              {/* Glowing CTA Button */}
              <button
                onClick={() => navigate("/portal")}
                className="group relative px-12 py-5 font-display text-lg tracking-widest uppercase overflow-hidden art-deco-border bg-primary/10 hover:bg-primary/20 transition-all duration-500 shadow-gold animate-pulse hover:animate-none"
              >
                <span className="relative z-10 text-primary group-hover:text-gold-pale transition-colors">
                  Begin Your Journey
                </span>
                {/* Glow effect */}
                <div className="absolute inset-0 opacity-50 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              </button>
            </div>

            {/* Blurred Background Content (teaser) */}
            <div className="p-10 md:p-12 opacity-40 blur-sm pointer-events-none select-none">
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
          <div className="mt-16 flex flex-col items-center gap-2 animate-fade-up stagger-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="w-1.5 h-1.5 rotate-45 border border-primary/30" />
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
            <span className="font-serif text-sm text-cream-muted/60 tracking-wider mt-4">
              Join thousands embracing their lunar path
            </span>
          </div>
        </section>
      </main>

      {/* Art Deco footer accent */}
      <footer className="py-6 border-t border-primary/20">
        <div className="flex justify-center items-center gap-3">
          <div className="w-8 h-px bg-primary/30" />
          <div className="w-1.5 h-1.5 rotate-45 bg-primary/50" />
          <div className="w-8 h-px bg-primary/30" />
        </div>
      </footer>
    </div>
  );
};

export default Index;
