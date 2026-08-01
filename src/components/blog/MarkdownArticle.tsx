import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CtaType } from "@/lib/blog/posts";

interface Props {
  source: string;
  ctaType?: CtaType;
}

const BirthdayCalculatorCTA = () => (
  <Link
    to="/birthday-moon-phase"
    className="group not-prose my-8 flex items-center justify-between gap-4 rounded-2xl border border-primary/40 bg-primary/[0.06] px-6 py-5 backdrop-blur-sm transition-all hover:border-primary/70 hover:bg-primary/[0.1] hover:shadow-[0_0_40px_-15px_hsl(var(--primary)/0.5)]"
  >
    <div>
      <p className="text-[10px] uppercase tracking-[0.25em] text-primary/80 mb-1">
        Try the Calculator
      </p>
      <span className="text-base md:text-lg font-medium text-foreground">
        Calculate your birthday moon phase
      </span>
    </div>
    <ArrowRight className="w-5 h-5 text-primary transition-transform group-hover:translate-x-0.5" />
  </Link>
);

const proseComponents: Components = {
  h2: ({ children }) => (
    <h2 className="font-display text-xl md:text-2xl text-foreground mt-12 mb-5 font-normal leading-snug border-l-2 border-primary/60 pl-4">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 mb-2 text-lg md:text-xl font-medium text-slate-100 leading-snug">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-slate-300 leading-relaxed text-[1.125rem] my-4 text-justify hyphens-auto">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-5 space-y-2 text-slate-300 leading-relaxed text-[1.0625rem] list-disc pl-5 marker:text-primary/60">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-5 space-y-2 text-slate-300 leading-relaxed text-[1.0625rem] list-decimal pl-5 marker:text-primary/60">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-primary/50 pl-5 italic text-slate-300/90 text-[1.0625rem] leading-relaxed">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) =>
    href?.startsWith("/") ? (
      <Link to={href} className="text-primary underline underline-offset-4 hover:text-primary/80">
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80">
        {children}
      </a>
    ),
  strong: ({ children }) => <strong className="text-slate-100 font-medium">{children}</strong>,
  em: ({ children }) => <em className="text-slate-200/90">{children}</em>,
  hr: () => <hr className="my-10 border-border/30" />,
  code: ({ children }) => (
    <code className="rounded bg-navy-deep/60 px-1.5 py-0.5 text-[0.95em] text-primary/90">
      {children}
    </code>
  ),
};

const inlineComponents: Components = {
  ...proseComponents,
  p: ({ children }) => <>{children}</>,
};

type Segment =
  | { kind: "md"; text: string }
  | { kind: "cards"; items: { title: string; body: string }[] }
  | { kind: "cta" };

// Split a source into blocks separated by blank lines, then detect
// runs of 2+ consecutive `### Title` + paragraph pairs and group into card grids.
function segment(source: string, ctaType: CtaType): Segment[] {
  const blocks = source.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out: Segment[] = [];
  let mdBuf: string[] = [];

  const flushMd = () => {
    if (mdBuf.length) {
      out.push({ kind: "md", text: mdBuf.join("\n\n") });
      mdBuf = [];
    }
  };

  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    const h3 = b.match(/^###\s+(.+)$/);
    const next = blocks[i + 1];
    const nextIsProse = next && !/^(#{1,6}\s|>|-\s|\d+\.\s|```)/.test(next);
    if (h3 && nextIsProse) {
      // Try to build a run
      const run: { title: string; body: string }[] = [];
      let j = i;
      while (j < blocks.length) {
        const bb = blocks[j];
        const nn = blocks[j + 1];
        const hh = bb.match(/^###\s+(.+)$/);
        const nnProse = nn && !/^(#{1,6}\s|>|-\s|\d+\.\s|```)/.test(nn);
        if (hh && nnProse) {
          run.push({ title: hh[1].trim(), body: nn.trim() });
          j += 2;
        } else break;
      }
      if (run.length >= 2) {
        flushMd();
        out.push({ kind: "cards", items: run });
        i = j;
        continue;
      }
    }
    mdBuf.push(b);
    i++;
  }
  flushMd();

  // Insert CTA after the first cards block, or before the last md block if no cards.
  if (ctaType === "birthday-calculator") {
    const cardsIdx = out.findIndex((s) => s.kind === "cards");
    if (cardsIdx >= 0) {
      out.splice(cardsIdx + 1, 0, { kind: "cta" });
    } else {
      out.push({ kind: "cta" });
    }
  }
  return out;
}

const MarkdownArticle = ({ source, ctaType = "none" }: Props) => {
  const segments = segment(source, ctaType);
  return (
    <div className="article-body">
      {segments.map((seg, idx) => {
        if (seg.kind === "cta") return <BirthdayCalculatorCTA key={idx} />;
        if (seg.kind === "cards") {
          return (
            <div
              key={idx}
              className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 my-6"
            >
              {seg.items.map((c, j) => (
                <div
                  key={j}
                  className="rounded-2xl border border-border/40 bg-gradient-to-b from-navy-medium/50 to-navy-deep/40 p-6 backdrop-blur-sm transition-colors hover:border-primary/40"
                >
                  <h3 className="text-base md:text-lg font-semibold text-slate-100 mb-3 leading-snug">
                    {c.title}
                  </h3>
                  <div className="text-[14px] md:text-[15px] text-slate-300/90 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={inlineComponents}>
                      {c.body}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          );
        }
        return (
          <Fragment key={idx}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={proseComponents}>
              {seg.text}
            </ReactMarkdown>
          </Fragment>
        );
      })}
    </div>
  );
};

export default MarkdownArticle;
