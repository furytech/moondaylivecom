import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import moonLogo from "@/assets/moon-logo-new.png";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Decorative stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold-pale rounded-full animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      <main className="flex-1 flex flex-col items-center pt-20 pb-6 px-6 relative z-10">
        {/* Logo */}
        <div className="animate-float mb-6">
          <div 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden cursor-pointer hover-scale-subtle bg-background"
            onClick={() => navigate("/")}
          >
            <img
              src={moonLogo}
              alt="Moonday"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h1 className="font-display text-6xl md:text-7xl text-gold-gradient tracking-wider mb-4">
          404
        </h1>
        <p className="font-serif text-xl text-cream-muted mb-8">
          This celestial path does not exist
        </p>
        <button
          onClick={() => navigate("/")}
          className="font-display text-sm tracking-widest uppercase px-8 py-3 art-deco-border brass-glow text-primary"
        >
          Return Home
        </button>
      </main>

      {/* Footer accent */}
      <footer className="py-5 border-t border-primary/10">
        <div className="flex justify-center items-center gap-3">
          <div className="w-10 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="w-1.5 h-1.5 rotate-45 bg-primary/30" />
          <div className="w-10 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </footer>
    </div>
  );
};

export default NotFound;