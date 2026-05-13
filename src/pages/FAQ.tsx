import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import SEO from "@/components/SEO";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is Moonday Live?",
    a: "Moonday Live is a luxury lunar guidance experience. We translate the Great Cycle of the Moon — phase by phase — into personalized rituals across the Mind, Soul, and Body pillars. It is created for entertainment and reflection.",
  },
  {
    q: "How is my Lunar Signature calculated?",
    a: "Your Lunar Signature is generated from the precise date, time, and location of your birth using astronomical engines. The more accurate the data, the more nuanced your blueprint.",
  },
  {
    q: "What is the Sovereign Tier?",
    a: "The Sovereign Tier unlocks the full archive: deeper daily forecasts, the complete Lunar Library, void-of-course interval guidance, and unlimited access to your personal blueprint.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes — you may cancel at any time from your Account page. Your access continues until the end of the current billing period. Please review our Refund Policy for details.",
  },
  {
    q: "Do you offer refunds?",
    a: "Subscriptions renew automatically and are non-refundable, but you can cancel anytime to stop future charges. See our Refund & Cancellation Policy for full details.",
  },
  {
    q: "Is Moonday Live a substitute for professional advice?",
    a: "No. Moonday Live is provided strictly for entertainment, inspiration, and personal reflection. It is not a substitute for medical, psychological, legal, or financial advice. Please see our Disclaimer.",
  },
  {
    q: "How do I update my birth details?",
    a: "Visit your Account page to refine your birth date, time, and location. Your blueprint will recalibrate automatically.",
  },
  {
    q: "How do I delete my account?",
    a: "Email support@moondaylive.com from your account address requesting deletion, and we will remove your data within 30 days.",
  },
];

const FAQ = () => {
  return (
    <PageLayout>
      <SEO
        title="FAQ — Moonday Live"
        description="Answers about your Lunar Signature, the Sovereign Tier, billing, cancellations, and how Moonday guides your Great Cycle."
      />
      <div className="max-w-3xl mx-auto w-full animate-fade-up">
        <header className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-3">
            Frequently Asked
          </h1>
          <p className="font-serif text-cream-muted text-sm md:text-base">
            Answers, clearly written, before you ask.
          </p>
        </header>

        <GlassmorphismCard>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border-border/30"
              >
                <AccordionTrigger className="font-display text-left text-sm md:text-base text-foreground tracking-wide hover:text-primary">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="font-serif text-cream-muted leading-relaxed text-sm md:text-base">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </GlassmorphismCard>
      </div>
    </PageLayout>
  );
};

export default FAQ;
