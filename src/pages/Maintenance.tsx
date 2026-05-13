import SEO from "@/components/SEO";
import { Wrench } from "lucide-react";

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative">
      <SEO
        title="Briefly Under Maintenance — Moonday Live"
        description="We are upgrading our celestial systems. Moonday Live will return shortly."
        noindex
      />
      {/* Subtle star field */}
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

      <div className="relative z-20 text-center max-w-lg">
        <div className="mb-6 flex justify-center">
          <div className="p-4 rounded-full border border-primary/40 bg-primary/5">
            <Wrench className="w-8 h-8 text-primary" />
          </div>
        </div>

        <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-4">
          Briefly Under Maintenance
        </h1>
        <p className="font-serif text-cream-muted text-base leading-relaxed mb-8">
          We are recalibrating the lunar instruments behind the scenes.
          <br className="hidden md:block" />
          Moonday Live will return shortly.
        </p>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-primary/30" />
            <div className="w-1.5 h-1.5 rotate-45 bg-primary/50" />
            <div className="w-8 h-px bg-primary/30" />
          </div>
        </div>

        <p className="font-serif text-sm text-muted-foreground/80">
          support@moondaylive.com
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
