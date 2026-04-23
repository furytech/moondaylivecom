import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

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

      <Navigation />

      <main className="flex-1 flex flex-col items-center justify-center pt-20 md:pt-24 pb-6 px-6 relative z-20">
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

      <Footer />
    </div>
  );
};

export default NotFound;
