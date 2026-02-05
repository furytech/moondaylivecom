import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import moonLogo from "@/assets/moon-logo-new.png";
import { zodiacDeepContent, ZodiacDeepContent } from "@/lib/zodiacDeepContent";
import { ZodiacPortal } from "@/components/library/ZodiacPortal";
import { SignDetailPanel } from "@/components/library/SignDetailPanel";

const zodiacSigns = [
  "Aries", "Taurus", "Gemini", "Cancer", 
  "Leo", "Virgo", "Libra", "Scorpio", 
  "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const Library = () => {
  const navigate = useNavigate();
  const [selectedSign, setSelectedSign] = useState<ZodiacDeepContent | null>(null);

  const handleSignClick = (sign: string) => {
    const content = zodiacDeepContent[sign];
    if (content) {
      setSelectedSign(content);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      {/* Subtle star field */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-primary/30 rounded-full animate-twinkle"
            style={{
              top: `${(i * 17 + 23) % 100}%`,
              left: `${(i * 31 + 7) % 100}%`,
              animationDelay: `${(i * 0.2) % 3}s`,
            }}
          />
        ))}
      </div>

      <Navigation />

      <main className="flex-1 flex flex-col items-center pt-20 pb-12 px-4 md:px-8 relative z-20">
        <div className="max-w-6xl mx-auto w-full">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="animate-float">
              <div
                onClick={() => navigate("/")}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden cursor-pointer hover-scale-subtle bg-background logo-halo"
              >
                <img
                  src={moonLogo}
                  alt="Moonday"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-16 animate-fade-up">
            <p className="font-display text-xs md:text-sm text-primary/60 tracking-[0.3em] uppercase mb-4">
              The Archives of
            </p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-gold-gradient tracking-[0.1em] md:tracking-[0.15em] uppercase mb-6">
              Lunar Encyclopedia
            </h1>
            <p className="font-serif text-lg md:text-xl text-cream-muted max-w-2xl mx-auto leading-relaxed">
              Twelve portals to the soul's emotional architecture
            </p>

            {/* Art Deco divider */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <div className="w-20 md:w-32 h-px bg-gradient-to-r from-transparent to-primary/40" />
              <div className="w-3 h-3 rotate-45 border border-primary/50" />
              <div className="w-20 md:w-32 h-px bg-gradient-to-l from-transparent to-primary/40" />
            </div>
          </div>

          {/* Zodiac Portal Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {zodiacSigns.map((sign, index) => {
              const content = zodiacDeepContent[sign];
              if (!content) return null;
              return (
                <ZodiacPortal
                  key={sign}
                  content={content}
                  onClick={() => handleSignClick(sign)}
                  index={index}
                />
              );
            })}
          </div>

          {/* Footer flourish */}
          <div className="flex items-center justify-center gap-3 mt-16">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/30" />
            <span className="text-primary/30 text-xs tracking-[0.3em] uppercase font-display">
              Select a Portal
            </span>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/30" />
          </div>
        </div>
      </main>

      <Footer />

      {/* Sign Detail Panel */}
      {selectedSign && (
        <SignDetailPanel
          content={selectedSign}
          onClose={() => setSelectedSign(null)}
        />
      )}
    </div>
  );
};

export default Library;
