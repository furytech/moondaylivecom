import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Atelier = () => {
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
      <main className="flex-1 pt-24 pb-12 px-6 relative z-10 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-block px-4 py-2 art-deco-border bg-card/30 mb-8">
            <span className="font-display text-xs tracking-widest uppercase text-primary">
              Coming Soon — Phase 2
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-5xl text-gold-gradient tracking-wider mb-6">
            The Atelier
          </h1>

          {/* Subtitle */}
          <p className="font-serif text-xl text-cream-muted mb-12 leading-relaxed">
            Where celestial artistry meets earthly craft
          </p>

          {/* Product Preview */}
          <div className="art-deco-border brass-glow bg-card/40 backdrop-blur-sm p-10 md:p-14 mb-12">
            {/* Product placeholder */}
            <div className="w-40 h-40 mx-auto mb-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
              <span className="text-6xl">🧘</span>
            </div>

            <h2 className="font-display text-2xl tracking-wider text-foreground mb-4">
              Lunar Cork Mats
            </h2>

            <p className="font-serif text-cream-muted leading-relaxed mb-6">
              Sustainable cork yoga mats adorned with celestial patterns. 
              Each design is inspired by a lunar phase, connecting your practice 
              to the rhythm of the cosmos.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="px-3 py-1 art-deco-border text-muted-foreground font-serif">
                Sustainable Cork
              </span>
              <span className="px-3 py-1 art-deco-border text-muted-foreground font-serif">
                Non-Toxic
              </span>
              <span className="px-3 py-1 art-deco-border text-muted-foreground font-serif">
                Hand-Finished
              </span>
            </div>
          </div>

          {/* Waitlist CTA */}
          <div className="space-y-4">
            <p className="font-serif text-sm text-muted-foreground">
              Be the first to know when the collection launches
            </p>
            
            <button className="font-display text-sm tracking-widest uppercase px-10 py-4 art-deco-border brass-glow text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
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
