import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { useSEO } from "@/hooks/useSEO";

const Disclaimer = () => {
  useSEO({
    title: "Disclaimer — Moonday Live",
    description:
      "Moonday Live is provided for entertainment and personal reflection only. It is not medical, psychological, legal, or financial advice.",
  });

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto w-full animate-fade-up">
        <header className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-3">
            Disclaimer
          </h1>
          <p className="font-serif text-cream-muted text-xs uppercase tracking-[0.2em]">
            For Entertainment & Reflection
          </p>
        </header>

        <GlassmorphismCard>
          <div className="font-serif text-cream-muted leading-relaxed space-y-6 text-sm md:text-base">
            <p>
              Moonday Live offers lunar guidance, rituals, and astrological
              insight for the purposes of entertainment, inspiration, and
              personal reflection. By using the service you acknowledge and
              agree to the following.
            </p>

            <h2 className="font-display text-lg md:text-xl text-foreground mt-6 mb-3">
              Not Professional Advice
            </h2>
            <p>
              The content provided by Moonday Live — including forecasts,
              rituals, blueprints, and library entries — is not a substitute
              for advice from qualified medical, mental-health, legal,
              financial, or other professionals. Always consult an appropriate
              expert before making decisions that affect your health, finances,
              or wellbeing.
            </p>

            <h2 className="font-display text-lg md:text-xl text-foreground mt-6 mb-3">
              No Guarantees
            </h2>
            <p>
              Astrological interpretations are subjective and traditional.
              Moonday Live makes no claim that any prediction, ritual, or
              guidance will produce any specific outcome.
            </p>

            <h2 className="font-display text-lg md:text-xl text-foreground mt-6 mb-3">
              Personal Responsibility
            </h2>
            <p>
              You are solely responsible for the choices you make and the
              actions you take. Use of Moonday Live is at your own discretion
              and risk.
            </p>

            <h2 className="font-display text-lg md:text-xl text-foreground mt-6 mb-3">
              Age Requirement
            </h2>
            <p>
              Moonday Live is intended for users aged 18 and over.
            </p>

            <h2 className="font-display text-lg md:text-xl text-foreground mt-6 mb-3">
              Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, Moonday Live and its
              creators are not liable for any decisions, actions, or outcomes
              arising from your use of the service.
            </p>
          </div>
        </GlassmorphismCard>
      </div>
    </PageLayout>
  );
};

export default Disclaimer;
