import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl text-gold-gradient tracking-wider mb-8">
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
