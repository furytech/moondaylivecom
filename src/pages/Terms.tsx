import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import moonLogo from "@/assets/moon-logo-new.png";

const Terms = () => {
  const navigate = useNavigate();

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
      
      <main className="flex-1 flex flex-col items-center px-6 pt-24 pb-12 relative z-10">
        {/* Logo */}
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

        <div className="max-w-2xl mx-auto w-full">
          <h1 className="font-display text-3xl text-gold-gradient tracking-wider mb-8 text-center">
            Terms of Service
          </h1>
          
          <div className="font-serif text-cream-muted leading-relaxed space-y-6">
            <p>
              By using Moonday, you agree to these terms of service. Please read 
              them carefully.
            </p>
            
            <h2 className="font-display text-xl text-foreground mt-8 mb-4">
              Use of Service
            </h2>
            <p>
              Moonday provides lunar insights and astrological content for 
              entertainment and personal reflection. The information provided 
              should not be considered professional advice.
            </p>
            
            <h2 className="font-display text-xl text-foreground mt-8 mb-4">
              Account Responsibilities
            </h2>
            <p>
              You are responsible for maintaining the security of your account 
              and for all activities that occur under your account.
            </p>
            
            <h2 className="font-display text-xl text-foreground mt-8 mb-4">
              Changes to Terms
            </h2>
            <p>
              We may update these terms from time to time. Continued use of the 
              service constitutes acceptance of any changes.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;