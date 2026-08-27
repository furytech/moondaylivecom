import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, ArrowRight } from "lucide-react";

interface EmailCaptureBlockProps {
  /** Headline override. */
  title?: string;
  /** Supporting line under the headline. */
  blurb?: string;
  /** Button label. */
  cta?: string;
}

/**
 * Lightweight, inline email capture used at the end of transit articles.
 * It doesn't create a second list — it hands the address straight to the
 * signup form (prefilled), so one step later the reader is a real subscriber
 * with a moon sign on file.
 */
const EmailCaptureBlock = ({
  title = "Get your moon sign — free",
  blurb = "One email when the Moon changes signs. No birth time needed, no noise, unsubscribe anytime.",
  cta = "Get my moon sign",
}: EmailCaptureBlockProps) => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    navigate(trimmed ? `/signup?email=${encodeURIComponent(trimmed)}` : "/signup");
  };

  return (
    <aside className="mt-12 rounded-xl border border-primary/25 bg-primary/[0.04] p-6 md:p-7 text-center backdrop-blur-sm">
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-3">
        <Moon className="w-3 h-3" strokeWidth={1.5} />
        The Lunar Signature
      </span>
      <h2 className="font-display text-lg md:text-xl text-foreground mb-2 font-normal">{title}</h2>
      <p className="text-sm text-cream-muted/85 max-w-md mx-auto mb-5 leading-relaxed">{blurb}</p>

      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <label htmlFor="capture-email" className="sr-only">
          Email address
        </label>
        <input
          id="capture-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="flex-1 rounded-full border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground placeholder:text-cream-muted/50 focus:outline-none focus:border-primary/60"
        />
        <button
          type="submit"
          className="btn-lime inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
        >
          {cta}
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </form>
    </aside>
  );
};

export default EmailCaptureBlock;
