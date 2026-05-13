import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MoonLoader from "./MoonLoader";
import GlassmorphismCard from "./GlassmorphismCard";
import moonLogo from "@/assets/moon-logo-new.webp";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MoonLoader size="lg" text="Aligning the stars..." />
      </div>
    );
  }

  // Not logged in - redirect to portal
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User exists but email not verified
  if (!user.email_confirmed_at) {
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

        <main className="flex-1 flex flex-col items-center justify-start pt-[68px] pb-6 px-6 relative z-10">
          {/* Moon Logo */}
          <div className="animate-float mb-4">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-background logo-halo">
              <img
                src={moonLogo}
                alt="Moonday"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <GlassmorphismCard className="max-w-md w-full animate-fade-up">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-primary/30 flex items-center justify-center">
                <span className="text-3xl">🔒</span>
              </div>
              
              <h1 className="font-display text-2xl md:text-3xl text-gold-gradient tracking-[0.06em] mb-4">
                Email Verification Required
              </h1>
              
              <p className="font-serif text-base text-cream-muted/70 mb-6 leading-relaxed">
                Please check your inbox and verify your email address to unlock your personalized lunar blueprint.
              </p>
              
              <p className="font-serif text-sm text-cream-muted/50 mb-8">
                {user.email}
              </p>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 font-display text-xs tracking-[0.2em] uppercase border border-primary/30 rounded-full text-primary/80 hover:text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-500"
                >
                  I've Verified My Email
                </button>
                
                <p className="font-serif text-xs text-cream-muted/40">
                  Check your spam folder if you don't see the email
                </p>
              </div>
            </div>
          </GlassmorphismCard>
        </main>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
