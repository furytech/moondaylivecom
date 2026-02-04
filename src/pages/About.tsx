import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";

const About = () => {
  return (
    <PageLayout>
      <div className="max-w-3xl w-full mx-auto animate-fade-up">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-gold-gradient tracking-[0.06em] mb-6">
            The Moonday Manifesto
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/30" />
            <div className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/30" />
          </div>
        </div>

        {/* Manifesto Content */}
        <div className="space-y-8">
          {/* The Premise */}
          <GlassmorphismCard size="lg" className="stagger-1">
            <div className="space-y-4">
              <h2 className="font-display text-2xl text-primary tracking-wider">
                The Premise
              </h2>
              <blockquote className="border-l-2 border-primary/40 pl-6">
                <p className="font-serif text-lg md:text-xl text-cream-muted leading-relaxed italic">
                  We live in a world of constant solar noise—relentless, bright, and demanding. 
                  Moonday is the return to the architectural rhythm of the night. It is a space 
                  for those who understand that logic is not cold, and serenity is not soft.
                </p>
              </blockquote>
            </div>
          </GlassmorphismCard>

          {/* The Practice */}
          <GlassmorphismCard size="lg" className="stagger-2">
            <div className="space-y-4">
              <h2 className="font-display text-2xl text-primary tracking-wider">
                The Practice
              </h2>
              <blockquote className="border-l-2 border-primary/40 pl-6">
                <p className="font-serif text-lg md:text-xl text-cream-muted leading-relaxed italic">
                  We do not offer "woo-woo" or vague promises. We offer a Radiant Grid—a structured 
                  alignment between your personal journey and the lunar cycle. By tracking the 
                  celestial movements through a minimalist, sovereign lens, we reclaim the quiet 
                  power of the moon.
                </p>
              </blockquote>
            </div>
          </GlassmorphismCard>

          {/* The Goal */}
          <GlassmorphismCard size="lg" className="stagger-3">
            <div className="space-y-4">
              <h2 className="font-display text-2xl text-primary tracking-wider">
                The Goal
              </h2>
              <blockquote className="border-l-2 border-primary/40 pl-6">
                <p className="font-serif text-lg md:text-xl text-cream-muted leading-relaxed italic">
                  To move from chaos to alignment. To build a life that is as intentional as an 
                  Art Deco monument and as fluid as the tides.
                </p>
              </blockquote>
            </div>
          </GlassmorphismCard>
        </div>

        {/* Closing Statement */}
        <div className="text-center mt-12 animate-fade-up stagger-4">
          <p className="font-display text-xl md:text-2xl text-primary tracking-widest mb-2">
            Welcome to Moonday.
          </p>
          <p className="font-serif text-lg text-cream-muted/70 italic">
            Your blueprint is ready.
          </p>
          
          {/* Decorative element */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="w-10 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <span className="text-2xl">☽</span>
            <div className="w-10 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default About;
