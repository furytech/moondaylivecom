import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";

// Art Deco Divider Component
const ArtDecoDivider = () => (
  <div className="py-16 flex items-center justify-center">
    <div className="relative w-[60%] flex items-center justify-center">
      {/* Left line */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-[#D4AF37]" />
      
      {/* Center ornament - geometric diamond with crescent */}
      <div className="mx-4 flex items-center justify-center">
        <div className="relative">
          {/* Diamond shape */}
          <div className="w-3 h-3 rotate-45 border border-[#D4AF37] bg-transparent" />
          {/* Inner dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 bg-[#D4AF37] rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Right line */}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#D4AF37]/60 to-[#D4AF37]" />
    </div>
  </div>
);

const Philosophy = () => {
  return (
    <PageLayout>
      <div className="max-w-3xl w-full mx-auto animate-fade-up">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-serif text-sm text-primary/60 uppercase tracking-[0.2em] mb-4">
            The Lunar Path
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-gold-gradient tracking-[0.06em] mb-6">
            Our Philosophy
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/30" />
            <div className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/30" />
          </div>
        </div>

        {/* Main Content */}
        <GlassmorphismCard size="lg" className="mb-12 stagger-1">
          <article>
            {/* Opening statement - refined typography */}
            <p 
              className="font-serif font-normal text-cream-muted leading-relaxed"
              style={{ fontSize: '1.25rem', letterSpacing: '0.05em' }}
            >
              We believe that the moon is more than a celestial body — it is a mirror for the soul, 
              a guide through the darkness, and a keeper of ancient rhythms that have shaped 
              humanity since the dawn of time.
            </p>

            {/* Art Deco Divider */}
            <ArtDecoDivider />

            {/* The Lunar Path */}
            <div>
              <h2 className="font-display text-2xl text-primary tracking-wider mb-6">
                The Lunar Path
              </h2>
              <p className="font-serif text-lg text-cream-muted/80 leading-relaxed mb-6">
                Moonday was born from a simple truth: our ancestors lived in harmony with lunar cycles, 
                and that wisdom still lives within us. We've created a sanctuary where modern seekers 
                can reconnect with these ancient rhythms.
              </p>
              <p className="font-serif text-lg text-cream-muted/80 leading-relaxed">
                Each phase of the moon offers unique energy for manifestation, reflection, and transformation. 
                By aligning our intentions with these celestial tides, we unlock our fullest potential.
              </p>
            </div>

            {/* Art Deco Divider */}
            <ArtDecoDivider />

            {/* Our Craft */}
            <div>
              <h2 className="font-display text-2xl text-primary tracking-wider mb-6">
                Our Craft
              </h2>
              <p className="font-serif text-lg text-cream-muted/80 leading-relaxed mb-6">
                Every ritual, every affirmation, and every piece of guidance on Moonday is crafted 
                with intention. We blend astrological wisdom with practical mindfulness techniques, 
                creating experiences that are both mystical and grounded.
              </p>
              <p className="font-serif text-lg text-cream-muted/80 leading-relaxed">
                We believe spirituality should be accessible, personal, and beautiful. 
                This is why we've designed Moonday as a visual and sensory journey — 
                because the sacred deserves elegance.
              </p>
            </div>

            {/* Art Deco Divider */}
            <ArtDecoDivider />

            {/* Join the Cosmos */}
            <div>
              <h2 className="font-display text-2xl text-primary tracking-wider mb-6">
                Join the Cosmos
              </h2>
              <p className="font-serif text-lg text-cream-muted/80 leading-relaxed">
                Whether you're a seasoned practitioner or just beginning to explore the moon's magic, 
                Moonday welcomes you. Here, under the same sky that has inspired poets, dreamers, 
                and seekers for millennia, your journey awaits.
              </p>
            </div>
          </article>
        </GlassmorphismCard>

        {/* Decorative footer element */}
        <div className="flex flex-col items-center gap-4 animate-fade-up stagger-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <span className="text-2xl">☽</span>
            <div className="w-10 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </div>
          <p className="font-serif text-sm text-cream-muted/50 italic">
            "As above, so below. As within, so without."
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default Philosophy;
