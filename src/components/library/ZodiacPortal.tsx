// Art Deco Zodiac Portal Card Component
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ZodiacDeepContent } from "@/lib/zodiacDeepContent";
import { libraryPath } from "@/lib/librarySeo";
import { libraryArticles } from "@/content/library";
import { moonSignDeepDiveContent } from "@/lib/moonSignContent";

import aries from "@/assets/zodiac/Aries.png";
import taurus from "@/assets/zodiac/Taurus.png";
import gemini from "@/assets/zodiac/Gemini.png";
import cancer from "@/assets/zodiac/Cancer.png";
import leo from "@/assets/zodiac/Leo.png";
import virgo from "@/assets/zodiac/Virgo.png";
import libra from "@/assets/zodiac/Libra.png";
import scorpio from "@/assets/zodiac/Scorpio.png";
import sagittarius from "@/assets/zodiac/Sagittarius.png";
import capricorn from "@/assets/zodiac/Capricorn.png";
import aquarius from "@/assets/zodiac/Aquarius.png";
import pisces from "@/assets/zodiac/Pisces.png";

interface ZodiacPortalProps {
  content: ZodiacDeepContent;
  index: number;
}

const zodiacImages: Record<string, string> = {
  Aries: aries, Taurus: taurus, Gemini: gemini, Cancer: cancer,
  Leo: leo, Virgo: virgo, Libra: libra, Scorpio: scorpio,
  Sagittarius: sagittarius, Capricorn: capricorn, Aquarius: aquarius, Pisces: pisces,
};

export function ZodiacPortal({ content, index }: ZodiacPortalProps) {
  const archetype = moonSignDeepDiveContent[content.sign]?.archetype;
  const summary = libraryArticles[content.sign]?.summary;
  return (
    <Link
      to={libraryPath(content.sign)}
      aria-label={`${content.sign} Moon meaning`}
      className={cn(
        "group relative flex flex-col overflow-hidden",
        "border border-primary/20 hover:border-primary/50",
        "bg-gradient-to-b from-background/80 to-navy-dark/60",
        "backdrop-blur-sm",
        "transition-all duration-500 ease-out",
        "hover:shadow-[0_0_60px_-15px_hsl(var(--gold-medium)/0.4)]",
        "hover:-translate-y-1",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
        "animate-fade-up"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Art Deco corner accents */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-primary/60 z-10" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-primary/60 z-10" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-primary/40 z-10" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-primary/40 z-10" />

      <img
        src={zodiacImages[content.sign]}
        alt={`${content.sign} constellation`}
        width={1136}
        height={939}
        loading="lazy"
        className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />

      <div className="flex flex-1 flex-col items-center gap-1.5 px-3 py-4 md:px-4 text-center">
        <h2 className="font-display font-light text-base md:text-lg text-foreground/90 tracking-[0.12em] uppercase group-hover:text-primary transition-colors duration-300 text-center">
          {content.sign} Moon
        </h2>
        {archetype && (
          <p className="font-display text-[11px] md:text-xs tracking-[0.2em] uppercase text-primary/80">{archetype}</p>
        )}
        {summary && <p className="font-serif text-sm text-cream-muted leading-snug text-left">{summary}</p>}
      </div>
    </Link>
  );
}
