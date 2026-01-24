import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/20 bg-background/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Decorative element */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-primary/30" />
            <div className="w-1.5 h-1.5 rotate-45 bg-primary/50" />
            <div className="w-8 h-px bg-primary/30" />
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-6">
          <Link 
            to="/privacy" 
            className="font-serif text-sm text-muted-foreground elegant-hover"
          >
            Privacy Policy
          </Link>
          <span className="hidden sm:block text-border/50">•</span>
          <Link 
            to="/terms" 
            className="font-serif text-sm text-muted-foreground elegant-hover"
          >
            Terms of Service
          </Link>
        </div>

        {/* Copyright */}
        <p className="font-serif text-xs text-muted-foreground/60 text-center">
          © {currentYear} Moonday. Crafted under the celestial light.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
