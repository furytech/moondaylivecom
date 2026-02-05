import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

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

        {/* Brand & Copyright */}
        <div className="text-center mb-6">
          <p className="font-display text-sm text-primary/60 tracking-[0.2em] uppercase mb-2">
            Moonday
          </p>
          <p className="font-serif text-xs text-muted-foreground/60">
            © {currentYear} Moonday Portal. All rights reserved.
          </p>
        </div>

        {/* Legal Links */}
        <nav className="flex items-center justify-center gap-6">
          <Link 
            to="/privacy" 
            className="font-serif text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-muted-foreground/30">•</span>
          <Link 
            to="/terms" 
            className="font-serif text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
