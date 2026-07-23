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

        // Tiles grid: [[tiles:Title1||Body1;;Title2||Body2;;Title3||Body3]]
        const tiles = trimmed.match(/^\[\[tiles:([\s\S]+)\]\]$/);
        if (tiles) {
          const items = tiles[1].split(";;").map((t) => {
            const [title, body] = t.split("||");
            return { title: (title || "").trim(), body: (body || "").trim() };
          });
          return (
            <div key={i} className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
              {items.map((t, j) => (
                <div
                  key={j}
                  className="rounded-2xl border border-border/40 bg-gradient-to-b from-navy-medium/50 to-navy-deep/40 p-6 backdrop-blur-sm transition-colors hover:border-primary/40"
                >
                  <h3 className="text-base md:text-lg font-semibold text-slate-100 mb-3 leading-snug">
                    {t.title}
                  </h3>
                  <p className="text-[14px] md:text-[15px] text-slate-300/90 leading-relaxed">
                    {t.body}
                  </p>
                </div>
              ))}
            </div>
          );
        }

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
            <h3 key={i} className="text-lg md:text-xl font-semibold text-slate-100 mt-8 mb-2 normal-case tracking-normal">
              {trimmed.slice(4)}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="text-xl md:text-2xl font-semibold text-slate-100 mt-12 mb-3 normal-case tracking-normal">
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-2 border-primary/50 pl-5 py-1 italic text-slate-300 text-[17px] leading-relaxed normal-case"
            >
              {trimmed.slice(2)}
            </blockquote>
          );
        }
        if (trimmed.split("\n").every((l) => l.trim().startsWith("- "))) {
          const items = trimmed.split("\n").map((l) => l.trim().slice(2));
          return (
            <ul key={i} className="space-y-3 list-none pl-0">
              {items.map((item, j) => (
                <li key={j} className="flex gap-3 text-slate-300 leading-relaxed text-[17px] md:text-[18px] normal-case">
                  <span className="text-primary/70 mt-2.5 w-1 h-1 rounded-full bg-primary/70 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-slate-300 leading-relaxed text-[17px] md:text-[18px] normal-case tracking-normal">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
};

export default MarkdownLite;
