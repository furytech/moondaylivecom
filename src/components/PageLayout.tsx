import { ReactNode, useMemo } from "react";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";

interface PageLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  /** @deprecated Logo now lives in Navigation. Kept for backwards compatibility. */
  showLogo?: boolean;
  /** Show the top Navigation bar. Defaults to true. */
  showNav?: boolean;
  className?: string;
}

const PageLayout = ({
  children,
  showFooter = true,
  showNav = true,
  className = "",
}: PageLayoutProps) => {
  // Stable decorative star positions
  const stars = useMemo(
    () =>
      [...Array(20)].map((_, i) => ({
        id: i,
        top: `${(i * 17 + 23) % 100}%`,
        left: `${(i * 31 + 7) % 100}%`,
        delay: `${(i * 0.15) % 3}s`,
        opacity: 0.3 + ((i * 0.07) % 0.5),
      })),
    []
  );

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Decorative stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
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

      {showNav && <Navigation />}

      <main
        className={`flex-1 flex flex-col items-center ${
          showNav ? "pt-16 md:pt-[4.5rem]" : "pt-4"
        } pb-6 px-6 relative z-20 ${className}`}
      >
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
};

export default PageLayout;
