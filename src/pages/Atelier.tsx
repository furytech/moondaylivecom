import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import moonLogo from "@/assets/moon-logo-new.png";

const Atelier = () => {
  const navigate = useNavigate();

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
      <main className="flex-1 flex flex-col items-center pt-20 pb-6 px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="animate-float">
              <div 
                onClick={() => navigate("/")} 
                className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden cursor-pointer hover-scale-subtle bg-background"
              >
                <img 
                  src={moonLogo} 
                  alt="Moonday" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-block px-5 py-2.5 art-deco-border bg-card/30 mb-10 animate-fade-up stagger-1">
            <span className="font-display text-xs tracking-widest uppercase text-primary">
              Coming Soon — Phase 2
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-6xl text-gold-gradient tracking-wider mb-6 animate-fade-up stagger-1">
            The Atelier
          </h1>

          {/* Subtitle */}
          <p className="font-serif text-xl md:text-2xl text-cream-muted mb-16 leading-relaxed animate-fade-up stagger-2">
            Where celestial artistry meets earthly craft
          </p>

          {/* Product Preview */}
          <div className="art-deco-border brass-glow card-lift bg-card/40 backdrop-blur-sm p-12 md:p-16 mb-14 animate-fade-up stagger-3">
            {/* Product placeholder */}
            <div className="w-44 h-44 mx-auto mb-10 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center hover-scale-subtle">
              <span className="text-7xl">🧘</span>
            </div>

            <h2 className="font-display text-2xl md:text-3xl tracking-wider text-foreground mb-5">
              Lunar Cork Mats
            </h2>

            <p className="font-serif text-lg text-cream-muted leading-relaxed mb-8 max-w-lg mx-auto">
              Sustainable cork yoga mats adorned with celestial patterns. 
              Each design is inspired by a lunar phase, connecting your practice 
              to the rhythm of the cosmos.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="px-4 py-2 art-deco-border text-muted-foreground font-serif brass-glow">
                Sustainable Cork
              </span>
              <span className="px-4 py-2 art-deco-border text-muted-foreground font-serif brass-glow">
                Non-Toxic
              </span>
              <span className="px-4 py-2 art-deco-border text-muted-foreground font-serif brass-glow">
                Hand-Finished
              </span>
            </div>
          </div>

          {/* Waitlist CTA */}
          <div className="space-y-5 animate-fade-up stagger-4">
            <p className="font-serif text-base text-muted-foreground">
              Be the first to know when the collection launches
            </p>
            
            <button className="font-display text-sm tracking-widest uppercase px-12 py-5 art-deco-border brass-glow text-primary bg-primary/5 hover:bg-primary/10 transition-all duration-300">
              Join the Waitlist
            </button>
          </div>

          {/* Decorative element */}
          <div className="mt-16 flex justify-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="w-2 h-2 rotate-45 border border-primary/30" />
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Atelier;
