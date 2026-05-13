import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import SEO from "@/components/SEO";

const Privacy = () => {
  return (
    <PageLayout>
      <SEO
        title="Privacy Policy — Moonday Live"
        description="How Moonday Live collects, uses, and protects your personal and birth data — written plainly."
      />
      <div className="max-w-2xl mx-auto w-full animate-fade-up">
        <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-8 text-center">
          Privacy Policy
        </h1>
        
        <GlassmorphismCard>
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
        </GlassmorphismCard>
      </div>
    </PageLayout>
  );
};

export default Privacy;
