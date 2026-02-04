import { useNavigate } from "react-router-dom";
import { ReactNode, useMemo } from "react";
import Footer from "@/components/Footer";
import moonLogo from "@/assets/moon-logo-new.png";

interface PageLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  showLogo?: boolean;
  className?: string;
}

const PageLayout = ({
  children,
  showFooter = true,
  showLogo = true,
  className = "",
}: PageLayoutProps) => {
  const navigate = useNavigate();

  // Generate stable star positions using useMemo
  const stars = useMemo(() => 
    [...Array(20)].map((_, i) => ({
      id: i,
      top: `${(i * 17 + 23) % 100}%`,
      left: `${(i * 31 + 7) % 100}%`,
      delay: `${(i * 0.15) % 3}s`,
      opacity: 0.3 + ((i * 0.07) % 0.5),
    })), 
  []);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Decorative stars background - stable positions */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute w-1 h-1 bg-gold-pale rounded-full animate-twinkle"
            style={{
              top: star.top,
              left: star.left,
              animationDelay: star.delay,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* Main content with fixed top padding (2rem = 32px = pt-8) */}
      <main className={`flex-1 flex flex-col items-center pt-8 pb-6 px-6 relative z-10 ${className}`}>
        {/* Logo - consistent position across all pages */}
        {showLogo && (
          <div className="animate-float mb-6">
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden cursor-pointer hover-scale-subtle bg-background logo-halo"
              onClick={() => navigate("/")}
            >
              <img
                src={moonLogo}
                alt="Moonday"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
};

export default PageLayout;
