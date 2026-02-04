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

        {/* Navigation Links */}
        <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-8">
          <Link 
            to="/about" 
            className="font-display text-sm uppercase tracking-widest text-muted-foreground elegant-hover"
          >
            About
          </Link>
          <span className="hidden sm:block text-primary/20">•</span>
          <Link 
            to="/contact" 
            className="font-display text-sm uppercase tracking-widest text-muted-foreground elegant-hover"
          >
            Contact
          </Link>
          <span className="hidden sm:block text-primary/20">•</span>
          <Link 
            to="/privacy" 
            className="font-display text-sm uppercase tracking-widest text-muted-foreground elegant-hover"
          >
            Privacy
          </Link>
          <span className="hidden sm:block text-primary/20">•</span>
          <Link 
            to="/terms" 
            className="font-display text-sm uppercase tracking-widest text-muted-foreground elegant-hover"
          >
            Terms
          </Link>
        </nav>

        {/* Brand & Copyright */}
        <div className="text-center">
          <p className="font-display text-sm text-primary/60 tracking-[0.2em] uppercase mb-2">
            Moonday
          </p>
          <p className="font-serif text-xs text-muted-foreground/60">
            © {currentYear} Moonday Portal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
