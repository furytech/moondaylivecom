import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import SEO from "@/components/SEO";

const Refund = () => {
  return (
    <PageLayout>
      <SEO
        title="Refund & Cancellation Policy — Moonday Live"
        description="How cancellations, renewals, and refunds are handled for the Moonday Live Sovereign Tier subscription."
      />
      <div className="max-w-2xl mx-auto w-full animate-fade-up">
        <header className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-3">
            Refund & Cancellation
          </h1>
          <p className="font-serif text-cream-muted text-xs uppercase tracking-[0.2em]">
            Last updated: May 2026
          </p>
        </header>

        <GlassmorphismCard>
          <div className="font-serif text-cream-muted leading-relaxed space-y-6 text-sm md:text-base">
            <p>
              The Sovereign Tier is a recurring subscription. By subscribing,
              you authorise Moonday Live to charge your payment method on a
              recurring basis until you cancel.
            </p>

            <h2 className="font-display text-lg md:text-xl text-foreground mt-6 mb-3">
              Cancellation
            </h2>
            <p>
              You may cancel your subscription at any time from the Account
              page. Cancellation takes effect at the end of your current
              billing period. You will retain Sovereign Tier access until that
              date — no further charges will be made.
            </p>

            <h2 className="font-display text-lg md:text-xl text-foreground mt-6 mb-3">
              Refunds
            </h2>
            <p>
              All payments are non-refundable. Once a billing period has begun
              we are unable to issue partial refunds for unused time. Renewals
              are non-refundable once charged.
            </p>

            <h2 className="font-display text-lg md:text-xl text-foreground mt-6 mb-3">
              Exceptional Circumstances
            </h2>
            <p>
              In the case of a duplicate charge, technical failure that
              prevented access to the service, or a billing error on our part,
              please contact us within 14 days at{" "}
              <a
                href="mailto:support@moondaylive.com"
                className="text-primary hover:underline"
              >
                support@moondaylive.com
              </a>{" "}
              and we will review your request promptly.
            </p>

            <h2 className="font-display text-lg md:text-xl text-foreground mt-6 mb-3">
              Free Trials
            </h2>
            <p>
              If a free trial is offered, you may cancel at any time before the
              trial ends to avoid being charged. Once the trial converts to a
              paid subscription, the cancellation terms above apply.
            </p>

            <h2 className="font-display text-lg md:text-xl text-foreground mt-6 mb-3">
              Statutory Rights
            </h2>
            <p>
              This policy does not affect any statutory consumer rights you may
              have under the laws of your jurisdiction.
            </p>
          </div>
        </GlassmorphismCard>
      </div>
    </PageLayout>
  );
};

export default Refund;
