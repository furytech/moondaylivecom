import { Crown, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLuminaryStatus } from "@/hooks/useLuminaryStatus";

interface SovereignTeaserProps {
  /** Where the CTA button points for logged-out visitors. Defaults to /signup. Signed-in users always go to /pricing. */
  to?: string;
  /** Custom button label for logged-out visitors. Signed-in users always see "Unlock Luminary". */
  label?: string;
}

/**
 * Compact Sovereign teaser — a slimmer cousin of SovereignUpgradeCTA, sized
 * for funnel pages (Pulse, Moon Sign Horoscope, Lunar Climate, etc.) where
 * we want the edgy "you don't need your birth time" pitch without dominating
 * the page. Use this anywhere a public visitor might be one click from
 * curiosity to conversion.
 */
const SovereignTeaser = ({ to = "/signup", label = "Begin Your Reading" }: SovereignTeaserProps) => {
  let user: ReturnType<typeof useAuth>["user"] = null;
  let isMember = false;
  let ready = true;
  try {
    user = useAuth().user;
    // Same paid check as the rest of the app (Stripe, profile flags, dev override).
    const status = useLuminaryStatus();
    isMember = status.isLuminary;
    ready = status.ready;
  } catch {
    // outside AuthProvider (e.g. unit tests) — treat as logged out
  }

  // Signed-in visitors see nothing until we know they are not members.
  if (isMember || !ready) return null;

  const ctaTo = user ? "/pricing" : to;
  const ctaLabel = user ? "Unlock Luminary" : label;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-primary/30 backdrop-blur-sm animate-fade-up"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.18), transparent 60%), linear-gradient(180deg, hsl(var(--sov-obsidian-2) / 0.7), hsl(var(--sov-obsidian) / 0.85))",
      }}
    >
      <div className="relative z-10 px-6 py-8 md:px-10 md:py-10 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 mb-5">
          <Crown className="w-3 h-3 text-primary" />
          <span className="font-display text-[10px] uppercase tracking-[0.25em] text-primary">
            The Luminary Reading
          </span>
        </span>

        <h2 className="font-sans font-normal normal-case text-2xl md:text-3xl text-gold-gradient tracking-normal mb-3 leading-snug">
          You don't need your birth time.
          <br className="hidden md:block" />
          <span className="text-primary"> A real astrologer never did.</span>
        </h2>

        <p className="font-serif text-xs md:text-sm text-cream-muted/90 max-w-xl mx-auto mb-3 leading-relaxed italic text-left">
          The Moon is our closest celestial family — the nearest body in the sky, and the one that
          moves you most. Tides, sleep, mood, instinct.
        </p>

        <p className="font-serif text-sm md:text-base text-cream-muted max-w-xl mx-auto mb-5 leading-relaxed text-left">
          From your birthday alone we read you <em>remarkably</em> close — Sun, Moon, Mercury, Venus,
          Mars, Jupiter, Saturn, and your outer-planet signature.
          You still get more dots connected than any horoscope app will ever offer.
        </p>

        <Link
          to={ctaTo}
          className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_32px_hsl(var(--primary)/0.5)] font-display text-xs uppercase tracking-[0.25em] transition-all duration-300"
        >
          <Crown className="w-3.5 h-3.5" />
          <span>{ctaLabel}</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <p className="mt-3 font-sans text-sm normal-case tracking-normal leading-relaxed text-muted-foreground text-left">
          Entertainment, with discipline. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default SovereignTeaser;
