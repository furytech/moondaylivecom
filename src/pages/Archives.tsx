import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Archives = () => {
  // Placeholder ritual entries
  const rituals = [
    {
      id: 1,
      title: "New Moon Intention Setting",
      date: "January 10, 2026",
      phase: "New Moon",
      description: "Set intentions for the lunar cycle ahead with clarity and purpose.",
    },
    {
      id: 2,
      title: "Full Moon Release Ceremony",
      date: "January 25, 2026",
      phase: "Full Moon",
      description: "Release what no longer serves you under the light of the full moon.",
    },
    {
      id: 3,
      title: "Waning Moon Reflection",
      date: "January 31, 2026",
      phase: "Waning Crescent",
      description: "A time for introspection and gratitude as the cycle completes.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Decorative stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
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
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-3">
              The Archives
            </h1>
            <p className="font-serif text-lg text-cream-muted">
              Your collection of lunar rituals and reflections
            </p>
          </div>

          {/* Ritual Entries */}
          <div className="space-y-6">
            {rituals.map((ritual, index) => (
              <article 
                key={ritual.id}
                className="art-deco-border brass-glow bg-card/40 backdrop-blur-sm p-6 md:p-8 group cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <span className="font-display text-xs tracking-widest uppercase text-primary">
                    {ritual.phase}
                  </span>
                  <span className="font-serif text-sm text-muted-foreground">
                    {ritual.date}
                  </span>
                </div>

                {/* Title */}
                <h2 className="font-display text-xl tracking-wider text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                  {ritual.title}
                </h2>

                {/* Description */}
                <p className="font-serif text-cream-muted leading-relaxed">
                  {ritual.description}
                </p>

                {/* Decorative line */}
                <div className="mt-6 flex items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
                  <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent" />
                  <div className="w-1 h-1 rotate-45 bg-primary/50" />
                </div>
              </article>
            ))}
          </div>

          {/* Empty state hint */}
          <div className="mt-12 text-center">
            <p className="font-serif text-sm text-muted-foreground">
              New rituals will appear here as you journey through the lunar cycles.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Archives;
