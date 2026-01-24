import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl text-gold-gradient tracking-wider mb-8">
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
