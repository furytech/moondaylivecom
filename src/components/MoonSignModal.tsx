import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getMoonSignDeepDive, MoonSignDeepDive } from "@/lib/moonSignContent";
import { X, Sparkles, Heart, Sun, Moon as MoonIcon, Flame } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MoonSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  moonSign: string | null;
}

const MoonSignModal = ({ isOpen, onClose, moonSign }: MoonSignModalProps) => {
  if (!moonSign) return null;
  
  const content = getMoonSignDeepDive(moonSign);
  
  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-background/98 backdrop-blur-xl border-primary/30 shadow-[0_0_100px_-20px_hsl(38,56%,72%,0.3)] z-[100]">
        {/* Custom close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-full bg-background/50 hover:bg-primary/20 transition-colors group"
        >
          <X className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>

        <ScrollArea className="max-h-[85vh]">
          <div className="p-8 md:p-10">
            {/* Header */}
            <DialogHeader className="mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-display text-sm text-primary uppercase tracking-widest">
                  Lunar Intel
                </span>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              
              {/* Sign symbol and name */}
              <div className="text-center mb-6">
                <span className="text-7xl text-primary font-display block mb-4">
                  {content.symbol}
                </span>
                <DialogTitle className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider">
                  Moon in {content.sign}
                </DialogTitle>
              </div>

              {/* Meta info */}
              <div className="flex items-center justify-center gap-6 text-sm">
                <span className="flex items-center gap-2 text-cream-muted">
                  <Flame className="w-4 h-4 text-primary" />
                  {content.element}
                </span>
                <span className="text-primary/30">•</span>
                <span className="flex items-center gap-2 text-cream-muted">
                  <Sun className="w-4 h-4 text-primary" />
                  {content.ruling}
                </span>
                <span className="text-primary/30">•</span>
                <span className="text-cream-muted italic">{content.archetype}</span>
              </div>
            </DialogHeader>

            {/* Headline */}
            <div className="mb-10 text-center">
              <p className="sanctuary-text text-gold-gradient italic leading-relaxed">
                "{content.headline}"
              </p>
            </div>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-4 mb-10">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <MoonIcon className="w-4 h-4 text-primary/50" />
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </div>

            {/* Overview */}
            <div className="mb-10">
              <p className="font-serif text-lg text-cream-muted leading-relaxed text-center">
                {content.overview}
              </p>
            </div>

            {/* Three columns: Needs, Strengths, Shadows */}
            <div className="grid md:grid-cols-3 gap-8 mb-10">
              {/* Emotional Needs */}
              <div className="bg-background/50 rounded-xl p-6 border border-primary/10">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-4 h-4 text-primary" />
                  <h3 className="font-display text-sm uppercase tracking-widest text-primary">
                    Emotional Needs
                  </h3>
                </div>
                <ul className="space-y-3">
                  {content.emotionalNeeds.map((need, i) => (
                    <li key={i} className="font-serif text-sm text-cream-muted flex items-start gap-2">
                      <span className="text-primary/50 mt-1">•</span>
                      {need}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Strengths */}
              <div className="bg-background/50 rounded-xl p-6 border border-primary/10">
                <div className="flex items-center gap-2 mb-4">
                  <Sun className="w-4 h-4 text-primary" />
                  <h3 className="font-display text-sm uppercase tracking-widest text-primary">
                    Strengths
                  </h3>
                </div>
                <ul className="space-y-3">
                  {content.strengths.map((strength, i) => (
                    <li key={i} className="font-serif text-sm text-cream-muted flex items-start gap-2">
                      <span className="text-primary/50 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Shadows */}
              <div className="bg-background/50 rounded-xl p-6 border border-primary/10">
                <div className="flex items-center gap-2 mb-4">
                  <MoonIcon className="w-4 h-4 text-primary" />
                  <h3 className="font-display text-sm uppercase tracking-widest text-primary">
                    Shadows
                  </h3>
                </div>
                <ul className="space-y-3">
                  {content.shadows.map((shadow, i) => (
                    <li key={i} className="font-serif text-sm text-cream-muted flex items-start gap-2">
                      <span className="text-primary/50 mt-1">•</span>
                      {shadow}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Self-care Ritual */}
            <div className="bg-primary/5 rounded-xl p-8 mb-8 border border-primary/20">
              <p className="font-display text-sm text-primary uppercase tracking-widest text-center mb-4">
                Sacred Self-Care Ritual
              </p>
              <p className="font-serif text-lg text-cream-muted text-center leading-relaxed">
                {content.selfCareRitual}
              </p>
            </div>

            {/* Affirmation */}
            <div className="text-center">
              <p className="font-display text-sm text-primary/90 uppercase tracking-widest mb-4">
                Your Affirmation
              </p>
              <blockquote className="sanctuary-text text-gold-gradient italic leading-relaxed">
                "{content.affirmation}"
              </blockquote>
            </div>

            {/* Close button */}
            <div className="flex justify-center mt-10">
              <button
                onClick={onClose}
                className="group relative px-8 py-3 font-display text-sm tracking-widest uppercase overflow-hidden art-deco-border bg-primary/5 hover:bg-primary/10 transition-all duration-500"
              >
                <span className="relative z-10 text-primary group-hover:text-gold-pale transition-colors">
                  Close
                </span>
              </button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MoonSignModal;
