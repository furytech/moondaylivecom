import React from "react";
import { Mail, Sparkles } from "lucide-react";
import GlassmorphismCard from "./GlassmorphismCard";

interface BlueprintPreviewCardProps {
  combinationTitle: string;
  combinationSynthesis?: string | null;
  className?: string;
}

export function getFirstTwoSentences(text?: string | null): string {
  if (!text) return "";
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\.\s*\n+/g, ". ")
    .replace(/\n+/g, " ");

  const sentences = normalized
    .split(". ")
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return "";
  const firstTwo = sentences.slice(0, 2);
  return firstTwo
    .map((s) => (s.endsWith(".") || s.endsWith("!") || s.endsWith("?") ? s : `${s}.`))
    .join(" ");
}

export const BlueprintPreviewCard: React.FC<BlueprintPreviewCardProps> = ({
  combinationTitle,
  combinationSynthesis,
  className = "",
}) => {
  const previewSynthesis = getFirstTwoSentences(combinationSynthesis);

  return (
    <GlassmorphismCard
      size="md"
      className={`border-primary/25 bg-navy-medium/40 backdrop-blur-md text-center p-6 md:p-8 relative overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-center gap-2 mb-3">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="font-display text-xs uppercase tracking-widest text-primary/80">
          Blueprint Preview
        </span>
        <Sparkles className="w-3.5 h-3.5 text-primary" />
      </div>

      {/* The combination_title in gold */}
      <h3 className="font-display text-2xl md:text-3xl text-gold-gradient tracking-wide mb-4">
        {combinationTitle}
      </h3>

      {/* The first two sentences of combination_synthesis only */}
      {previewSynthesis && (
        <p className="font-serif text-lg md:text-xl text-cream-muted leading-relaxed italic font-light max-w-2xl mx-auto mb-6">
          "{previewSynthesis}"
        </p>
      )}

      {/* A line that says "Your full Blueprint is on its way to your inbox" */}
      <div className="pt-4 border-t border-primary/15 flex items-center justify-center gap-2 text-primary font-display text-xs md:text-sm uppercase tracking-widest">
        <Mail className="w-4 h-4 text-primary shrink-0" />
        <span>Your full Blueprint is on its way to your inbox</span>
      </div>
    </GlassmorphismCard>
  );
};

export default BlueprintPreviewCard;
