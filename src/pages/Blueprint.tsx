import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import moonLogo from "@/assets/moon-logo-new.png";

const Blueprint = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Extract name from email
  const userName = user?.email?.split("@")[0] || "Cosmic Traveler";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
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
              opacity: Math.random() * 0.4 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 pt-24 pb-12 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-12 animate-fade-up">
            <div 
              onClick={() => navigate("/")} 
              className="cursor-pointer hover-scale-subtle inline-block"
            >
              <img 
                src={moonLogo} 
                alt="Moonday" 
                className="w-48 h-auto"
              />
            </div>
          </div>

          {/* Welcome Header */}
          <div className="text-center mb-16 animate-fade-up stagger-1">
            <h1 className="font-display text-3xl md:text-5xl text-gold-gradient tracking-wider mb-4">
              Your Blueprint
            </h1>
            <p className="font-serif text-xl text-cream-muted">
              Welcome back, {userName}
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid md:grid-cols-2 gap-10">
            {/* Current Lunar Phase */}
            <div className="art-deco-border brass-glow card-lift bg-card/40 backdrop-blur-sm p-8 md:p-10 animate-fade-up stagger-1">
              <h2 className="font-display text-lg tracking-wider text-foreground mb-8">
                Current Lunar Phase
              </h2>
              
              <div className="flex flex-col items-center py-8">
                {/* Moon placeholder */}
                <div className="w-28 h-28 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 hover-scale-subtle">
                  <span className="text-5xl">🌙</span>
                </div>
                
                <p className="font-display text-2xl text-primary mb-2">
                  Waxing Crescent
                </p>
                <p className="font-serif text-base text-muted-foreground">
                  27% Illumination
                </p>
              </div>

              <div className="border-t border-border/30 pt-6 mt-4">
                <p className="font-serif text-base text-cream-muted text-center leading-relaxed">
                  A time for intention setting and new beginnings. Your energy is building.
                </p>
              </div>
            </div>

            {/* Your Celestial Sign */}
            <div className="art-deco-border brass-glow card-lift bg-card/40 backdrop-blur-sm p-8 md:p-10 animate-fade-up stagger-2">
              <h2 className="font-display text-lg tracking-wider text-foreground mb-8">
                Your Celestial Sign
              </h2>
              
              <div className="flex flex-col items-center py-8">
                {/* Sign placeholder */}
                <div className="w-28 h-28 rounded-full bg-secondary/30 border border-secondary/50 flex items-center justify-center mb-6 hover-scale-subtle">
                  <span className="text-5xl">✨</span>
                </div>
                
                <p className="font-display text-2xl text-primary mb-2">
                  Complete Your Profile
                </p>
                <p className="font-serif text-base text-muted-foreground">
                  Discover your moon sign
                </p>
              </div>

              <div className="border-t border-border/30 pt-6 mt-4">
                <button className="w-full font-display text-sm tracking-widest uppercase py-4 art-deco-border brass-glow text-primary bg-primary/5 hover:bg-primary/10 transition-all duration-300">
                  Take the Quiz
                </button>
              </div>
            </div>
          </div>

          {/* Daily Insight */}
          <div className="mt-12 art-deco-border brass-glow card-lift bg-card/40 backdrop-blur-sm p-10 md:p-12 animate-fade-up stagger-3">
            <h2 className="font-display text-lg tracking-wider text-foreground mb-6 text-center">
              Daily Lunar Insight
            </h2>
            
            <blockquote className="font-serif text-xl md:text-2xl text-cream-muted text-center italic leading-relaxed max-w-2xl mx-auto">
              "The moon is a loyal companion. It never leaves. It's always there, watching, steadfast, knowing us in our light and dark moments."
            </blockquote>
            
            <p className="font-serif text-base text-muted-foreground text-center mt-6">
              — Tahereh Mafi
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blueprint;
