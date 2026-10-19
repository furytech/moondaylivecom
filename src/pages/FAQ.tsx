import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import SEO from "@/components/SEO";
import { seoProps } from "@/lib/seo";
import { faqs, faqPageSchema } from "@/data/faqs";
import { Helmet } from "react-helmet-async";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


const FAQ = () => {
  return (
    <PageLayout>
      <SEO {...seoProps("/faq")} />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqPageSchema())}
        </script>
      </Helmet>
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
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border-0"
              >
                <AccordionTrigger className="text-[15px] md:text-base text-foreground">
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
