import { useNavigate } from "react-router-dom";
import moonLogo from "@/assets/moon-logo-transparent.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-navy-radial flex flex-col">
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

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Logo - Centered at top */}
        <div className="animate-float mb-8">
          <div className="w-72 h-72 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] rounded-full bg-[hsl(var(--navy-dark))] overflow-hidden flex items-center justify-center">
            <img
              src={moonLogo}
              alt="Moon Sign Quiz Logo"
              className="w-full h-full object-cover drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-gold-gradient text-center mb-4 tracking-wider">
          Discover Your Moon
        </h1>

        {/* Subtitle */}
        <p className="font-serif text-lg md:text-xl text-cream-muted text-center max-w-xl mb-12 leading-relaxed">
          Unveil the celestial secrets of your inner self through our mystical Moon sign quiz
        </p>

        {/* Art Deco decorative line */}
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent via-gold-medium to-transparent" />
          <div className="w-2 h-2 rotate-45 border border-gold-medium" />
          <div className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent via-gold-medium to-transparent" />
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/signup")}
          className="group relative px-10 py-4 font-display text-lg tracking-widest uppercase overflow-hidden art-deco-border bg-transparent hover:bg-gold-medium/10 transition-all duration-500"
        >
          <span className="relative z-10 text-gold-light group-hover:text-gold-pale transition-colors">
            Begin Your Journey
          </span>
          {/* Hover glow effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-gold" />
        </button>

        {/* Bottom decorative element */}
        <div className="mt-16 flex flex-col items-center gap-2">
          <div className="w-px h-12 bg-gradient-to-b from-gold-medium/50 to-transparent" />
          <span className="font-serif text-sm text-cream-muted/60 tracking-wider">
            Scroll to explore
          </span>
        </div>
      </main>

      {/* Art Deco footer accent */}
      <footer className="py-6 border-t border-gold-medium/20">
        <div className="flex justify-center items-center gap-3">
          <div className="w-8 h-px bg-gold-medium/30" />
          <div className="w-1.5 h-1.5 rotate-45 bg-gold-medium/50" />
          <div className="w-8 h-px bg-gold-medium/30" />
        </div>
      </footer>
    </div>
  );
};

export default Index;
