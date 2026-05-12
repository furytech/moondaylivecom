import { Link } from "react-router-dom";

const SUPPORT_EMAIL = "support@moondaylive.com";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const linkClass =
    "font-serif text-xs text-cream-muted hover:text-foreground transition-colors";

  return (
    <footer className="border-t border-border/20 bg-background/95 backdrop-blur-sm relative z-30">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Decorative element */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-primary/30" />
            <div className="w-1.5 h-1.5 rotate-45 bg-primary/50" />
            <div className="w-8 h-px bg-primary/30" />
          </div>
        </div>

        {/* Brand */}
        <div className="text-center mb-8">
          <p className="font-display text-sm text-primary/80 tracking-[0.25em] uppercase mb-2">
            Moonday Live
          </p>
          <p className="font-serif text-xs text-cream-muted max-w-md mx-auto">
            Daily lunar guidance for the Mind, Soul, and Body.
          </p>
        </div>

        {/* Link grid */}
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-8 max-w-3xl mx-auto"
        >
          <div className="space-y-3">
            <p className="font-display text-[0.65rem] uppercase tracking-[0.25em] text-primary/90">
              Experience
            </p>
            <ul className="space-y-2">
              <li><Link to="/" className={linkClass}>Home</Link></li>
              <li><Link to="/pricing" className={linkClass}>Sovereign Tier</Link></li>
              <li><Link to="/library" className={linkClass}>Lunar Library</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-display text-[0.65rem] uppercase tracking-[0.25em] text-primary/90">
              Company
            </p>
            <ul className="space-y-2">
              <li><Link to="/about" className={linkClass}>About</Link></li>
              <li><Link to="/contact" className={linkClass}>Contact</Link></li>
              <li><Link to="/faq" className={linkClass}>FAQ</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-display text-[0.65rem] uppercase tracking-[0.25em] text-primary/90">
              Legal
            </p>
            <ul className="space-y-2">
              <li><Link to="/privacy" className={linkClass}>Privacy</Link></li>
              <li><Link to="/terms" className={linkClass}>Terms</Link></li>
              <li><Link to="/refund" className={linkClass}>Refunds</Link></li>
              <li><Link to="/disclaimer" className={linkClass}>Disclaimer</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-display text-[0.65rem] uppercase tracking-[0.25em] text-primary/90">
              Support
            </p>
            <ul className="space-y-2">
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </nav>

        {/* Copyright */}
        <div className="text-center pt-6 border-t border-border/10">
          <p className="font-serif text-[0.7rem] text-cream-muted/70">
            © {currentYear} Moonday Live. All rights reserved. For entertainment purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
