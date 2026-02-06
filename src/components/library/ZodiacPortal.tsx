// Art Deco Zodiac Portal Card Component
import { cn } from "@/lib/utils";
import { ZodiacDeepContent } from "@/lib/zodiacDeepContent";

interface ZodiacPortalProps {
  content: ZodiacDeepContent;
  onClick: () => void;
  index: number;
}

// Geometric line art icons for each zodiac sign
const zodiacIcons: Record<string, JSX.Element> = {
  Aries: (
    <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20">
      <path
        d="M16 48 C16 28, 24 16, 32 12 C40 16, 48 28, 48 48 M32 12 L32 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Taurus: (
    <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20">
      <circle cx="32" cy="38" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M18 16 C18 24, 24 24, 32 24 C40 24, 46 24, 46 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  Gemini: (
    <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20">
      <line x1="16" y1="12" x2="48" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <line x1="16" y1="52" x2="48" y2="52" stroke="currentColor" strokeWidth="1.5" />
      <line x1="24" y1="12" x2="24" y2="52" stroke="currentColor" strokeWidth="1.5" />
      <line x1="40" y1="12" x2="40" y2="52" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Cancer: (
    <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20">
      <circle cx="22" cy="28" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="42" cy="36" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M14 28 C14 18, 32 12, 50 18 M50 36 C50 46, 32 52, 14 46"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  Leo: (
    <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20">
      <circle cx="24" cy="24" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M34 24 Q44 24, 44 34 Q44 48, 32 52 Q20 48, 24 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  Virgo: (
    <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20">
      <path
        d="M16 16 L16 48 M24 16 L24 48 M32 16 L32 40 Q32 48, 40 48 Q48 48, 48 40 L48 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 32 Q20 28, 24 32 Q28 28, 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Libra: (
    <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20">
      <line x1="12" y1="48" x2="52" y2="48" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 36 L52 36 M32 36 L32 20 M20 20 Q20 12, 32 12 Q44 12, 44 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  Scorpio: (
    <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20">
      <path
        d="M12 16 L12 48 M20 16 L20 48 M28 16 L28 40 Q28 48, 40 48 L52 48 M48 44 L52 48 L48 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 32 Q16 28, 20 32 Q24 28, 28 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Sagittarius: (
    <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20">
      <line x1="16" y1="48" x2="48" y2="16" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M36 16 L48 16 L48 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="24" y1="32" x2="40" y2="40" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Capricorn: (
    <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20">
      <path
        d="M16 12 L16 40 Q16 48, 24 48 Q32 48, 32 40 L32 24 Q32 16, 40 16 Q48 16, 48 24 Q48 32, 40 32 Q32 32, 32 40 L32 52 Q32 56, 36 56"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  Aquarius: (
    <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20">
      <path
        d="M12 24 L20 20 L28 24 L36 20 L44 24 L52 20 M12 36 L20 32 L28 36 L36 32 L44 36 L52 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Pisces: (
    <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20">
      <path
        d="M16 12 Q28 20, 28 32 Q28 44, 16 52 M48 12 Q36 20, 36 32 Q36 44, 48 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line x1="12" y1="32" x2="52" y2="32" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
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
      <div className="relative h-full flex flex-col items-center justify-center p-4 md:p-6">
        {/* Geometric icon */}
        <div className="text-primary/70 group-hover:text-primary transition-colors duration-300 group-hover:scale-110 transform transition-transform">
          {zodiacIcons[content.sign]}
        </div>

        {/* Sign name */}
        <h3 className="font-display text-lg md:text-xl text-foreground tracking-[0.2em] uppercase mt-4 group-hover:text-primary transition-colors duration-300">
          {content.sign}
        </h3>

        {/* Element */}
        <p className="font-serif text-xs md:text-sm text-muted-foreground tracking-widest uppercase mt-2 mb-6 md:mb-4">
          {content.element}
        </p>

        {/* Subtle glyph - positioned further down on mobile */}
        <span className="absolute bottom-3 md:bottom-4 text-xl md:text-2xl text-primary/20 group-hover:text-primary/40 transition-colors duration-300 font-display">
          {content.symbol}
        </span>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </button>
  );
}
