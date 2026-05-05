import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Sparkles, Moon as MoonIcon } from "lucide-react";

export interface EducationSection {
  label: string;
  body: string;
}

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  symbol?: string;
  subtitle?: string;
  intro?: string;
  sections?: EducationSection[];
  closing?: string;
}

const EducationModal = ({
  isOpen,
  onClose,
  eyebrow,
  title,
  symbol,
  subtitle,
  intro,
  sections,
  closing,
}: EducationModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-background/98 backdrop-blur-xl border-primary/30 z-[100]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-full bg-background/50 hover:bg-primary/20 transition-colors group"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>

        <ScrollArea className="max-h-[85vh]">
          <div className="p-8 md:p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-display text-sm text-primary uppercase tracking-widest">
                  {eyebrow}
                </span>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>

              <div className="text-center mb-2">
                {symbol && (
                  <span className="text-7xl text-primary font-display block mb-4">
                    {symbol}
                  </span>
                )}
                <DialogTitle className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider text-center">
                  {title}
                </DialogTitle>
                {subtitle && (
                  <p className="font-serif text-base text-cream-muted mt-3 text-center">
                    {subtitle}
                  </p>
                )}
              </div>
            </DialogHeader>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <MoonIcon className="w-4 h-4 text-primary/50" />
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </div>

            {intro && (
              <p className="font-serif text-lg text-cream-muted leading-relaxed text-center mb-8">
                {intro}
              </p>
            )}

            {sections && sections.length > 0 && (
              <div className="space-y-5 mb-8">
                {sections.map((s) => (
                  <div
                    key={s.label}
                    className="bg-background/50 rounded-xl p-6 border border-primary/15 text-center"
                  >
                    <p className="font-display text-xs text-primary uppercase tracking-[0.18em] mb-3">
                      {s.label}
                    </p>
                    <p className="font-serif text-base text-cream-muted leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {closing && (
              <blockquote className="sanctuary-text text-gold-gradient italic leading-relaxed text-center">
                "{closing}"
              </blockquote>
            )}

            <div className="flex justify-center mt-10">
              <button
                onClick={onClose}
                className="px-8 py-3 font-display text-sm tracking-widest uppercase rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary/60 text-primary transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EducationModal;
