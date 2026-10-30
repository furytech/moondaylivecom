import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import SEO from "@/components/SEO";
import { seoProps } from "@/lib/seo";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const LAST_UPDATED = "2026-10-30";

const Terms = () => {
  return (
    <PageLayout>
      <SEO {...seoProps("/terms")} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Terms of Service",
          url: "https://moondaylive.com/terms",
          datePublished: "2025-01-01",
          dateModified: LAST_UPDATED,
          publisher: { "@type": "Organization", name: "Moonday Live", url: "https://moondaylive.com" },
        })}</script>
      </Helmet>
      <div className="max-w-2xl mx-auto w-full animate-fade-up">
        <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-8 text-center">
          Terms of Service
        </h1>
        
        <GlassmorphismCard>
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
              Cancel, Access, Refunds
            </h2>
            <p className="text-left">
              Luminary is a subscription that renews automatically each month
              or year until you cancel.
            </p>
            <p className="text-left">
              <strong>How to cancel.</strong> Sign in, open your{" "}
              <Link to="/account" className="text-primary hover:underline">Account</Link>{" "}
              page and choose Manage or cancel membership. You do not need to
              contact us, and you can do it at any time.
            </p>
            <p className="text-left">
              <strong>When access ends.</strong> Cancelling stops future
              charges. Your Luminary access continues until the end of the
              period you have already paid for, and then your account returns
              to the free Blueprint. We email you a confirmation with the end
              date when you cancel.
            </p>
            <p className="text-left">
              <strong>Refunds.</strong> Payments are non-refundable, and we do
              not give partial refunds for unused time. The{" "}
              <Link to="/refund" className="text-primary hover:underline">Refund &amp; Cancellation Policy</Link>{" "}
              has the details, including what to do about a duplicate charge or
              a billing error.
            </p>
            <p className="text-left">
              Yearly members receive an email reminder about 15 days before
              their membership renews.
            </p>

            <h2 className="font-display text-xl text-foreground mt-8 mb-4">
              Changes to Terms
            </h2>
            <p>
              We may update these terms from time to time. Continued use of the 
              service constitutes acceptance of any changes.
            </p>
          </div>
        </GlassmorphismCard>
      </div>
    </PageLayout>
  );
};

export default Terms;
