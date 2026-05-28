// Art Deco Zodiac Portal Card Component
import { cn } from "@/lib/utils";
import { ZodiacDeepContent } from "@/lib/zodiacDeepContent";

import aries from "@/assets/zodiac/aries.png";
import taurus from "@/assets/zodiac/taurus.png";
import gemini from "@/assets/zodiac/gemini.png";
import cancer from "@/assets/zodiac/cancer.png";
import leo from "@/assets/zodiac/leo.png";
import virgo from "@/assets/zodiac/virgo.png";
import libra from "@/assets/zodiac/libra.png";
import scorpio from "@/assets/zodiac/scorpio.png";
import sagittarius from "@/assets/zodiac/sagittarius.png";
import capricorn from "@/assets/zodiac/capricorn.png";
import aquarius from "@/assets/zodiac/aquarius.png";
import pisces from "@/assets/zodiac/pisces.png";

interface ZodiacPortalProps {
  content: ZodiacDeepContent;
  onClick: () => void;
  index: number;
}

const zodiacImages: Record<string, string> = {
  Aries: aries, Taurus: taurus, Gemini: gemini, Cancer: cancer,
  Leo: leo, Virgo: virgo, Libra: libra, Scorpio: scorpio,
  Sagittarius: sagittarius, Capricorn: capricorn, Aquarius: aquarius, Pisces: pisces,
};

export function ZodiacPortal({ content, onClick, index }: ZodiacPortalProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden",
        "aspect-[3/4] w-full",
        "border border-primary/20 hover:border-primary/50",
        "bg-gradient-to-b from-background/80 to-navy-dark/60",
        "backdrop-blur-sm",
        "transition-all duration-500 ease-out",
        "hover:shadow-[0_0_60px_-15px_hsl(var(--gold-medium)/0.4)]",
        "hover:-translate-y-1",
        "focus:outline-none focus:ring-1 focus:ring-primary/50",
        "animate-fade-up"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Art Deco corner accents */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-primary/40" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-primary/40" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-primary/40" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-primary/40" />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center gap-6 p-4 md:p-6">
        <img
          src={zodiacImages[content.sign]}
          alt={`${content.sign} zodiac symbol`}
          className="w-20 h-20 md:w-24 md:h-24 object-contain transition-transform duration-300 group-hover:scale-110"
          style={{ filter: "invert(72%) sepia(45%) saturate(2300%) hue-rotate(210deg) brightness(102%) contrast(95%)" }}
        />
        <h3 className="font-display text-lg md:text-xl text-foreground tracking-[0.2em] uppercase group-hover:text-primary transition-colors duration-300">
          {content.sign}
        </h3>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </button>
  );
}
