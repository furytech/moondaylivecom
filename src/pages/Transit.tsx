import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Sparkles, Moon, Compass, Flame, Droplets, Wind, Mountain, ChevronRight, Clock, ShieldCheck, HeartHandshake } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { INITIAL_TRANSIT_QUEUE } from "@/mocks/transitQueue";
import { getFAQsBySlug, type TransitFAQ } from "@/data/transitFAQs";
import type { ZodiacSignTransit } from "@/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ZODIAC_ORDER = [
  { sign: "Aries", slug: "aries", symbol: "♈", element: "Fire" },
  { sign: "Taurus", slug: "taurus", symbol: "♉", element: "Earth" },
  { sign: "Gemini", slug: "gemini", symbol: "♊", element: "Air" },
  { sign: "Cancer", slug: "cancer", symbol: "♋", element: "Water" },
  { sign: "Leo", slug: "leo", symbol: "♌", element: "Fire" },
  { sign: "Virgo", slug: "virgo", symbol: "♍", element: "Earth" },
  { sign: "Libra", slug: "libra", symbol: "♎", element: "Air" },
  { sign: "Scorpio", slug: "scorpio", symbol: "♏", element: "Water" },
  { sign: "Sagittarius", slug: "sagittarius", symbol: "♐", element: "Fire" },
  { sign: "Capricorn", slug: "capricorn", symbol: "♑", element: "Earth" },
  { sign: "Aquarius", slug: "aquarius", symbol: "♒", element: "Air" },
  { sign: "Pisces", slug: "pisces", symbol: "♓", element: "Water" },
];

function getElementIcon(element?: string | null) {
  switch (element?.toLowerCase()) {
    case "fire":
      return <Flame className="w-4 h-4 text-amber-400" />;
    case "water":
      return <Droplets className="w-4 h-4 text-cyan-400" />;
    case "air":
      return <Wind className="w-4 h-4 text-indigo-300" />;
    case "earth":
      return <Mountain className="w-4 h-4 text-emerald-400" />;
    default:
      return <Sparkles className="w-4 h-4 text-primary" />;
  }
}

export default function Transit() {
  const { sign: paramSign } = useParams<{ sign: string }>();
  const navigate = useNavigate();

  const signSlug = (paramSign || "aries").toLowerCase().trim();

  // Find zodiac info
  const signIndex = ZODIAC_ORDER.findIndex(
    (z) => z.slug === signSlug || z.sign.toLowerCase() === signSlug
  );
  const currentZodiac = signIndex !== -1 ? ZODIAC_ORDER[signIndex] : ZODIAC_ORDER[0];
  const signName = currentZodiac.sign;

  // Neighboring signs in the zodiac wheel
  const prevIndex = (signIndex - 1 + 12) % 12;
  const nextIndex = (signIndex + 1) % 12;
  const prevSign = ZODIAC_ORDER[prevIndex];
  const nextSign = ZODIAC_ORDER[nextIndex];

  // Transit content state
  const [transit, setTransit] = useState<ZodiacSignTransit | null>(() => {
    return (
      INITIAL_TRANSIT_QUEUE.find(
        (t) => t.sign.toLowerCase() === signName.toLowerCase() || t.id.toLowerCase() === signSlug
      ) || null
    );
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTransit = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("transits")
          .select("*")
          .ilike("sign", signName)
          .limit(1)
          .maybeSingle();

        if (!error && data && isMounted) {
          setTransit({
            id: data.id,
            sign: data.sign,
            symbol: data.symbol || currentZodiac.symbol,
            element: (data.element as any) || currentZodiac.element,
            ruler: data.ruler || "",
            dates: data.dates || "",
            transitTitle: data.transit_title,
            transitAspect: data.transit_aspect || "",
            transitDate: data.transit_date || "",
            copy: data.copy,
            powerHour: data.power_hour || "",
            ritualTip: data.ritual_tip || "",
            hashtags: data.hashtags || [],
            imageUrl: data.image_url,
            status: data.status as any,
            publishedAt: data.published_at,
            socialPostedAt: data.social_posted_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
        }
      } catch (err) {
        console.warn("Could not fetch remote transit row:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTransit();
    return () => {
      isMounted = false;
    };
  }, [signName, currentZodiac]);

  // Retrieve 3 FAQs for this sign
  const faqs = useMemo<TransitFAQ[]>(() => {
    return getFAQsBySlug(currentZodiac.slug);
  }, [currentZodiac.slug]);

  // Dynamic titles and metadata
  const pageTitle = `Moon in ${signName} Transit — What It Means Today | Moonday Live`;
  const pageDescription = `Discover the emotional and somatic resonance of Moon in ${signName}. Read today's transit guidance, daily ritual, and astrological FAQs at Moonday Live.`;
  const canonicalUrl = `https://moondaylive.com/transit/${currentZodiac.slug}`;

  // JSON-LD structured data: WebApplication + Article + FAQPage
  const faqPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Moon in ${signName} Transit Guide`,
    name: `Moon in ${signName}`,
    description: pageDescription,
    url: canonicalUrl,
    datePublished: "2026-10-06T00:00:00.000Z",
    dateModified: new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: "Moonday Live",
      url: "https://moondaylive.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Moonday Live",
      url: "https://moondaylive.com",
      logo: {
        "@type": "ImageObject",
        url: "https://moondaylive.com/moonday-logo.png",
      },
    },
    about: {
      "@type": "Thing",
      name: `Moon in ${signName}`,
    },
  };

  return (
    <PageLayout>
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical={canonicalUrl}
        schema={articleSchema}
      />
      <Helmet>
        {/* FAQPage JSON-LD schema merged into page head */}
        <script type="application/ld+json">
          {JSON.stringify(faqPageSchema)}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto w-full space-y-12 animate-fade-up">
        {/* Hero Header */}
        <header className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs uppercase tracking-[0.25em] mb-4">
            <Moon className="w-3.5 h-3.5" />
            <span>Lunar Transit Guide · 2.5-Day Window</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-gold-gradient tracking-tight mb-4">
            Moon in {signName}
          </h1>

          <p className="font-serif italic text-lg md:text-xl text-cream-muted max-w-2xl mx-auto leading-relaxed">
            {transit?.transitAspect
              ? `Energetic signature: ${transit.transitAspect}`
              : `Navigating collective emotional currents as the Moon transits ${signName}.`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs uppercase tracking-widest text-primary/80">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-medium/40 border border-primary/15">
              <span className="text-sm">{currentZodiac.symbol}</span>
              <span>{signName}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-medium/40 border border-primary/15">
              {getElementIcon(transit?.element || currentZodiac.element)}
              <span>{transit?.element || currentZodiac.element} Element</span>
            </span>
            {transit?.powerHour && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-medium/40 border border-primary/15">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Power Window: {transit.powerHour}</span>
              </span>
            )}
          </div>
        </header>

        {/* Main Transit Content Card */}
        <GlassmorphismCard size="lg" className="p-6 md:p-10 space-y-8">
          <div>
            <h2 className="font-display text-xl md:text-2xl text-cream tracking-wide mb-4">
              {transit?.transitTitle || `The Frequency of Moon in ${signName}`}
            </h2>
            <p className="font-serif text-lg md:text-xl text-cream-muted leading-relaxed font-light">
              {transit?.copy ||
                `During Moon in ${signName}, instinctual impulses shift into this sign's archetypal rhythm. Feelings find expression through ${currentZodiac.element.toLowerCase()} elemental qualities.`}
            </p>
          </div>

          {transit?.ritualTip && (
            <div className="rounded-xl p-6 bg-primary/[0.08] border border-primary/25 space-y-2">
              <div className="flex items-center gap-2 text-primary font-display text-xs uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span>Somatic & Ritual Prescription</span>
              </div>
              <p className="font-serif text-base md:text-lg text-cream leading-relaxed italic">
                "{transit.ritualTip}"
              </p>
            </div>
          )}
        </GlassmorphismCard>

        {/* 1. CROSS-LINKS SECTION: Related pathways & neighboring zodiac signs */}
        <section aria-labelledby="related-pathways-heading" className="space-y-6">
          <div className="text-center">
            <h2 id="related-pathways-heading" className="font-display text-2xl md:text-3xl text-gold-gradient tracking-wide mb-2">
              Related Pathways
            </h2>
            <p className="font-serif text-sm md:text-base text-cream-muted/80">
              Integrate this transit with your personal natal architecture
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Link 1: Blueprint */}
            <Link
              to="/blueprint"
              className="group p-6 rounded-2xl border border-primary/20 bg-navy-medium/30 hover:bg-navy-medium/50 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-xs uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    Natal Architecture
                  </span>
                  <ChevronRight className="w-4 h-4 text-primary/60 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="font-display text-xl text-cream group-hover:text-gold-light transition-colors mb-2">
                  Discover Your Moon Blueprint
                </h3>
                <p className="font-serif text-sm text-cream-muted leading-relaxed">
                  Calculate how today's Moon in {signName} forms a unique energetic triad with your birth Sun and Moon placements.
                </p>
              </div>
              <span className="mt-4 font-display text-xs uppercase tracking-wider text-primary underline underline-offset-4">
                View My Blueprint →
              </span>
            </Link>

            {/* Link 2: Pricing / Luminary */}
            <Link
              to="/pricing"
              className="group p-6 rounded-2xl border border-primary/20 bg-navy-medium/30 hover:bg-navy-medium/50 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-xs uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Deep Practice
                  </span>
                  <ChevronRight className="w-4 h-4 text-primary/60 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="font-display text-xl text-cream group-hover:text-gold-light transition-colors mb-2">
                  Unlock Luminary Access
                </h3>
                <p className="font-serif text-sm text-cream-muted leading-relaxed">
                  Access daily somatic guidance, void-of-course alerts, and 1,728 triad state profiles calibrated to your sky.
                </p>
              </div>
              <span className="mt-4 font-display text-xs uppercase tracking-wider text-primary underline underline-offset-4">
                Explore Luminary Membership →
              </span>
            </Link>
          </div>

          {/* Neighboring Signs Links */}
          <div className="pt-2">
            <div className="p-5 rounded-2xl border border-border/40 bg-background/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                to={`/transit/${prevSign.slug}`}
                className="group flex items-center gap-3 text-left hover:text-primary transition-colors"
              >
                <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center font-display text-lg text-primary bg-primary/5">
                  {prevSign.symbol}
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-widest text-cream-muted/70">Previous Transit</span>
                  <h3 className="font-display text-sm md:text-base text-cream group-hover:text-primary transition-colors">
                    ← Moon in {prevSign.sign}
                  </h3>
                </div>
              </Link>

              <div className="hidden sm:block h-8 w-px bg-primary/15" />

              <Link
                to={`/transit/${nextSign.slug}`}
                className="group flex items-center gap-3 text-right hover:text-primary transition-colors flex-row-reverse sm:flex-row"
              >
                <div>
                  <span className="block text-[11px] uppercase tracking-widest text-cream-muted/70">Next Transit</span>
                  <h3 className="font-display text-sm md:text-base text-cream group-hover:text-primary transition-colors">
                    Moon in {nextSign.sign} →
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center font-display text-lg text-primary bg-primary/5">
                  {nextSign.symbol}
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* 2. FAQ SECTION: Accordion Q&A wrapped in <section aria-label="..."> */}
        {faqs.length > 0 && (
          <section
            aria-label={`Frequently asked questions about Moon in ${signName}`}
            className="space-y-6 pt-4"
          >
            <div className="text-center">
              <h2 className="font-display text-2xl md:text-3xl text-gold-gradient tracking-wide mb-2">
                Frequently Asked Questions
              </h2>
              <p className="font-serif text-sm md:text-base text-cream-muted/80">
                Understanding the mechanics of Moon in {signName}
              </p>
            </div>

            <GlassmorphismCard size="md" className="p-6 md:p-8">
              <Accordion type="single" collapsible defaultValue="item-0" className="w-full space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border border-primary/15 rounded-xl px-4 py-1 bg-navy-medium/20"
                  >
                    <AccordionTrigger className="text-left font-display text-base md:text-lg text-cream hover:text-primary hover:no-underline py-4">
                      <h3>{faq.question}</h3>
                    </AccordionTrigger>
                    <AccordionContent className="font-serif text-base text-cream-muted leading-relaxed pb-4 pt-1">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </GlassmorphismCard>
          </section>
        )}
      </div>
    </PageLayout>
  );
}
