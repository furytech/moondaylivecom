import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Minimal markdown renderer for blog content.
 * Supports: ## H2, ### H3, > blockquote, - list, blank-line paragraphs,
 * and [[callout:Label|/href]] cards.
 */
const MarkdownLite = ({ source }: { source: string }) => {
  const blocks = source.trim().split(/\n\n+/);

  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        const trimmed = block.trim();

        // Callout card
        const callout = trimmed.match(/^\[\[callout:([^|]+)\|([^\]]+)\]\]$/);
        if (callout) {
          const [, label, href] = callout;
          return (
            <Link
              key={i}
              to={href}
              className="group not-prose flex items-center justify-between gap-4 rounded-2xl border border-primary/40 bg-primary/[0.06] px-6 py-5 backdrop-blur-sm transition-all hover:border-primary/70 hover:bg-primary/[0.1] hover:shadow-[0_0_40px_-15px_hsl(var(--primary)/0.5)]"
            >
              <span className="text-base md:text-lg font-medium text-foreground">
                {label.trim()}
              </span>
              <ArrowRight className="w-5 h-5 text-primary transition-transform group-hover:translate-x-1" />
            </Link>
          );
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="text-base md:text-lg font-display font-normal tracking-wide text-foreground/90 mt-6 mb-1">
              {trimmed.slice(4)}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="text-lg md:text-xl font-display font-normal tracking-wide text-foreground mt-10 mb-1">
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-2 border-primary/50 pl-5 py-1 italic text-cream-muted/90 text-[15px] leading-relaxed"
            >
              {trimmed.slice(2)}
            </blockquote>
          );
        }
        if (trimmed.split("\n").every((l) => l.trim().startsWith("- "))) {
          const items = trimmed.split("\n").map((l) => l.trim().slice(2));
          return (
            <ul key={i} className="space-y-2 list-none pl-0">
              {items.map((item, j) => (
                <li key={j} className="flex gap-3 text-cream-muted/90 leading-relaxed text-[15px]">
                  <span className="text-primary/70 mt-2 w-1 h-1 rounded-full bg-primary/70 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-cream-muted/90 leading-[1.75] text-[15px] md:text-[16px]">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
};

export default MarkdownLite;
