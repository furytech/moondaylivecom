import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import moonLogo from "@/assets/moon-logo-new.png";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { moonSignDeepDiveContent, MoonSignDeepDive } from "@/lib/moonSignContent";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

const zodiacSigns = [
  "Aries", "Taurus", "Gemini", "Cancer", 
  "Leo", "Virgo", "Libra", "Scorpio", 
  "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const Library = () => {
  const navigate = useNavigate();
  const [selectedSign, setSelectedSign] = useState<MoonSignDeepDive | null>(null);

  const handleSignClick = (sign: string) => {
    const content = moonSignDeepDiveContent[sign];
    if (content) {
      setSelectedSign(content);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Decorative stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold-pale rounded-full animate-twinkle"
            style={{
              top: `${(i * 17 + 23) % 100}%`,
              left: `${(i * 31 + 7) % 100}%`,
              animationDelay: `${(i * 0.15) % 3}s`,
              opacity: 0.3 + ((i * 0.07) % 0.5),
            }}
          />
        ))}
      </div>

      <Navigation />

      <main className="flex-1 flex flex-col items-center pt-20 pb-6 px-6 relative z-20">
        <div className="max-w-5xl mx-auto w-full">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="animate-float">
              <div
                onClick={() => navigate("/")}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden cursor-pointer hover-scale-subtle bg-background logo-halo"
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
          <div className="text-center mb-12 animate-fade-up">
            <h1 className="font-display text-4xl md:text-6xl text-gold-gradient tracking-wider mb-4">
              Lunar Encyclopedia
            </h1>
            <p className="font-serif text-xl text-cream-muted max-w-2xl mx-auto">
              Explore the emotional landscape of each Moon Sign
            </p>
          </div>

          {/* Zodiac Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-up stagger-1">
            {zodiacSigns.map((sign) => {
              const content = moonSignDeepDiveContent[sign];
              return (
                <button
                  key={sign}
                  onClick={() => handleSignClick(sign)}
                  className="group"
                >
                  <GlassmorphismCard 
                    size="sm" 
                    className="h-full transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-[0_0_80px_-15px_hsl(38,56%,72%,0.4)]"
                  >
                    <div className="flex flex-col items-center py-4">
                      <span className="text-5xl md:text-6xl text-primary font-display mb-3 group-hover:scale-110 transition-transform">
                        {content?.symbol}
                      </span>
                      <p className="font-display text-lg md:text-xl text-foreground tracking-wider">
                        {sign}
                      </p>
                      <p className="font-serif text-sm text-muted-foreground mt-1">
                        {content?.element}
                      </p>
                    </div>
                  </GlassmorphismCard>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />

      {/* Sign Detail Modal */}
      <Dialog open={!!selectedSign} onOpenChange={() => setSelectedSign(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] bg-background border-primary/20 p-0 overflow-hidden">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6 md:p-8">
              <DialogHeader className="mb-6">
                <button
                  onClick={() => setSelectedSign(null)}
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center text-center">
                  <span className="text-6xl text-primary font-display mb-4">
                    {selectedSign?.symbol}
                  </span>
                  <DialogTitle className="font-display text-3xl text-gold-gradient tracking-wider mb-2">
                    {selectedSign?.sign} Moon
                  </DialogTitle>
                  <p className="font-serif text-lg text-cream-muted">
                    {selectedSign?.element} • Ruled by {selectedSign?.ruling}
                  </p>
                  <p className="font-display text-sm text-primary/70 uppercase tracking-widest mt-2">
                    {selectedSign?.archetype}
                  </p>
                </div>
              </DialogHeader>

              {selectedSign && (
                <div className="space-y-8">
                  {/* Headline */}
                  <div className="text-center">
                    <p className="font-serif text-xl text-primary italic">
                      "{selectedSign.headline}"
                    </p>
                  </div>

                  {/* Overview */}
                  <div>
                    <p className="font-serif text-lg text-cream-muted leading-relaxed">
                      {selectedSign.overview}
                    </p>
                  </div>

                  {/* Emotional Needs */}
                  <div>
                    <h3 className="font-display text-sm text-primary/60 uppercase tracking-widest mb-4">
                      Emotional Needs
                    </h3>
                    <ul className="space-y-2">
                      {selectedSign.emotionalNeeds.map((need, i) => (
                        <li key={i} className="font-serif text-cream-muted flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {need}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Strengths */}
                  <div>
                    <h3 className="font-display text-sm text-primary/60 uppercase tracking-widest mb-4">
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {selectedSign.strengths.map((strength, i) => (
                        <li key={i} className="font-serif text-cream-muted flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Shadows */}
                  <div>
                    <h3 className="font-display text-sm text-primary/60 uppercase tracking-widest mb-4">
                      Shadow Side
                    </h3>
                    <ul className="space-y-2">
                      {selectedSign.shadows.map((shadow, i) => (
                        <li key={i} className="font-serif text-cream-muted flex items-start gap-2">
                          <span className="text-primary/50 mt-1">•</span>
                          {shadow}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Self-Care Ritual */}
                  <div className="bg-primary/5 rounded-lg p-6 border border-primary/10">
                    <h3 className="font-display text-sm text-primary/60 uppercase tracking-widest mb-4 text-center">
                      Self-Care Ritual
                    </h3>
                    <p className="font-serif text-lg text-cream-muted text-center leading-relaxed">
                      {selectedSign.selfCareRitual}
                    </p>
                  </div>

                  {/* Affirmation */}
                  <div className="text-center pt-4 border-t border-primary/10">
                    <p className="font-display text-sm text-primary/60 uppercase tracking-widest mb-4">
                      Affirmation
                    </p>
                    <blockquote className="font-serif text-xl text-gold-gradient italic">
                      "{selectedSign.affirmation}"
                    </blockquote>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Library;
