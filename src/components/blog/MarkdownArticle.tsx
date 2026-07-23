import { ReactNode } from "react";
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

// Group consecutive H3 + paragraph pairs inside a section into a feature-card grid.
function groupFeatureCards(nodes: ReactNode[]): ReactNode[] {
  const out: ReactNode[] = [];
  let buffer: { title: ReactNode; body: ReactNode }[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    if (buffer.length >= 2) {
      out.push(
        <div
          key={`grid-${out.length}`}
          className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 my-6"
        >
          {buffer.map((c, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/40 bg-gradient-to-b from-navy-medium/50 to-navy-deep/40 p-6 backdrop-blur-sm transition-colors hover:border-primary/40"
            >
              <h3 className="text-base md:text-lg font-semibold text-slate-100 mb-3 leading-snug">
                {c.title}
              </h3>
              <p className="text-[14px] md:text-[15px] text-slate-300/90 leading-relaxed">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      );
    } else {
      // Single H3 + paragraph → render inline
      const c = buffer[0];
      out.push(
        <h3
          key={`h3-${out.length}`}
          className="mt-8 mb-2 text-lg md:text-xl font-medium text-slate-100 leading-snug"
        >
          {c.title}
        </h3>
      );
      out.push(
        <p
          key={`p-${out.length}`}
          className="text-slate-300 leading-relaxed text-[1.125rem] mb-4"
        >
          {c.body}
        </p>
      );
    }
    buffer = [];
  };

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i] as { props?: { "data-block"?: string; children?: ReactNode } };
    if (n?.props?.["data-block"] === "h3") {
      const next = nodes[i + 1] as { props?: { "data-block"?: string; children?: ReactNode } } | undefined;
      if (next?.props?.["data-block"] === "p") {
        buffer.push({ title: n.props.children, body: next.props.children });
        i++;
        continue;
      }
    }
    flush();
    out.push(nodes[i]);
  }
  flush();
  return out;
}

const MarkdownArticle = ({ source, ctaType = "none" }: Props) => {
  const components: Components = {
    h1: ({ children }) => (
      <h1 className="font-display text-2xl md:text-[32px] leading-snug text-foreground mt-10 mb-4 font-normal">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-display text-xl md:text-2xl text-foreground mt-12 mb-5 font-normal leading-snug border-l-2 border-primary/60 pl-4">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      // Marker node; the section wrapper will decide whether to render as card or inline heading.
      <div data-block="h3">{children}</div>
    ),
    p: ({ children }) => (
      <div data-block="p">{children}</div>
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

  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {source}
      </ReactMarkdown>
      <PostProcessor ctaType={ctaType} />
    </div>
  );
};

// Post-render pass: transforms h3/p markers into cards, wraps body paragraphs, and injects CTA.
// Simpler alternative: render markdown, walk the DOM after mount. We use a wrapper approach instead.
const PostProcessor = ({ ctaType }: { ctaType: CtaType }) => {
  if (ctaType === "birthday-calculator") return <BirthdayCalculatorCTA />;
  return null;
};

export default MarkdownArticle;
