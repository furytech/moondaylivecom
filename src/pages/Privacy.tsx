import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import moonLogo from "@/assets/moon-logo-new.png";

const Privacy = () => {
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

        <div className="max-w-2xl mx-auto w-full">
          <h1 className="font-display text-3xl text-gold-gradient tracking-wider mb-8 text-center">
            Privacy Policy
          </h1>
          
          <div className="font-serif text-cream-muted leading-relaxed space-y-6">
            <p>
              Your privacy is important to us. This policy explains how Moonday collects, 
              uses, and protects your personal information.
            </p>
            
            <h2 className="font-display text-xl text-foreground mt-8 mb-4">
              Information We Collect
            </h2>
            <p>
              We collect information you provide directly, including your email address 
              and birth date for moon sign calculations. We do not share this information 
              with third parties.
            </p>
            
            <h2 className="font-display text-xl text-foreground mt-8 mb-4">
              How We Use Your Information
            </h2>
            <p>
              Your information is used solely to provide personalized lunar insights 
              and improve your experience with Moonday.
            </p>
            
            <h2 className="font-display text-xl text-foreground mt-8 mb-4">
              Contact
            </h2>
            <p>
              For questions about this policy, please reach out through our website.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;