import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { zodiacDeepContent } from "@/lib/zodiacDeepContent";
import { ZodiacPortal } from "@/components/library/ZodiacPortal";
import SEO from "@/components/SEO";
import { seoProps } from "@/lib/seo";
import { Link } from "react-router-dom";
import { libraryPath } from "@/lib/librarySeo";

const zodiacSigns = [
  "Aries", "Taurus", "Gemini", "Cancer", 
  "Leo", "Virgo", "Libra", "Scorpio", 
  "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const Library = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      <SEO {...seoProps("/library")} />
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

      <main className="flex-1 flex flex-col items-center pt-[68px] pb-12 px-4 md:px-8 relative z-20">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-up">
            <p className="font-display text-xs md:text-sm text-primary/90 tracking-[0.3em] uppercase mb-2">
              The Archives of
            </p>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl text-gold-gradient tracking-[0.1em] md:tracking-[0.15em] uppercase mb-3">
              Lunar Encyclopedia
            </h1>
            <p className="font-serif text-lg md:text-xl text-cream-muted max-w-2xl mx-auto leading-relaxed">
              Twelve portals to the soul's emotional architecture
            </p>

            <div className="flex items-center justify-center gap-3 mt-5">
              <div className="w-20 md:w-32 h-px bg-gradient-to-r from-transparent to-primary/40" />
              <span className="text-primary/60 text-xs">✦</span>
              <div className="w-20 md:w-32 h-px bg-gradient-to-l from-transparent to-primary/40" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {zodiacSigns.map((sign, index) => {
              const content = zodiacDeepContent[sign];
              if (!content) return null;
              return (
                <ZodiacPortal
                  key={sign}
                  content={content}
                  index={index}
                />
              );
            })}
          </div>

          <section aria-labelledby="library-meanings" className="mt-14">
            <h2 id="library-meanings" className="font-display text-sm tracking-[0.2em] uppercase text-primary/80 mb-4 text-center">
              Moon sign meanings
            </h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {zodiacSigns.map((sign) => {
                const c = zodiacDeepContent[sign];
                if (!c) return null;
                return (
                  <li key={sign} className="rounded-xl border border-primary/15 bg-navy-medium/20 p-4">
                    <Link to={libraryPath(sign)} className="font-display text-base text-primary underline underline-offset-4">
                      {sign} Moon
                    </Link>
                    <p className="mt-1 text-left font-serif text-sm text-cream-muted leading-relaxed">
                      {c.element} sign ruled by {c.ruling}. {c.essence.poetry.split(/(?<=[.!?])\s/)[0]}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="flex items-center justify-center gap-3 mt-16">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/30" />
            <span className="text-primary/70 text-xs tracking-[0.3em] uppercase font-display">
              Choose a Moon sign
            </span>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/30" />
          </div>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default Library;
