import { useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { useSEO } from "@/hooks/useSEO";
import { trackEvent } from "@/lib/analytics";
import { Mail, Clock, Sparkles } from "lucide-react";

const SUPPORT_EMAIL = "support@moondaylive.com";

const Contact = () => {
  useSEO({
    title: "Contact Moonday Live — Support & Inquiries",
    description:
      "Reach the Moonday Live concierge for account help, billing questions, or partnership inquiries. We respond within two lunar cycles (48 hours).",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      trackEvent("contact_intent", { method: "page_dwell" });
    }, 30000);
    return () => window.clearTimeout(timer);
  }, []);

  const handleEmailClick = () => {
    trackEvent("contact_intent", { method: "email_click" });
  };

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto w-full animate-fade-up">
        <header className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-3">
            Contact Support
          </h1>
          <p className="font-serif text-cream-muted text-sm md:text-base">
            For account, billing, or sovereign inquiries — we are listening.
          </p>
        </header>

        <GlassmorphismCard>
          <div className="font-serif text-cream-muted leading-relaxed space-y-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full border border-primary/40">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-display text-xs uppercase tracking-[0.25em] text-primary/70 mb-2">
                  Direct Line
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-display text-lg md:text-xl text-foreground hover:text-primary transition-colors"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-px bg-primary/30" />
                <div className="w-1.5 h-1.5 rotate-45 bg-primary/50" />
                <div className="w-8 h-px bg-primary/30" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full border border-primary/40">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-display text-xs uppercase tracking-[0.25em] text-primary/70 mb-2">
                  Response Window
                </p>
                <p className="text-sm">
                  Within 48 hours, Monday through Friday.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full border border-primary/40">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-display text-xs uppercase tracking-[0.25em] text-primary/70 mb-2">
                  What to Include
                </p>
                <p className="text-sm max-w-md mx-auto">
                  Your account email, the device you are using, and a clear
                  description of your inquiry — the more detail, the swifter
                  our reply.
                </p>
              </div>
            </div>
          </div>
        </GlassmorphismCard>
      </div>
    </PageLayout>
  );
};

export default Contact;
