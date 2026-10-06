import { useMemo } from "react";
import UTCNotice from "@/components/UTCNotice";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Calendar, ChevronRight, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import MarkdownArticle from "@/components/blog/MarkdownArticle";
import EmailCaptureBlock from "@/components/EmailCaptureBlock";
import BlogCard from "@/components/blog/BlogCard";
import MoonLoader from "@/components/MoonLoader";
import { fetchPostBySlug, getRelated, categoryPath, resolveSignImage } from "@/lib/blog/posts";
import { getFAQsBySlug } from "@/data/transitFAQs";

const ZODIAC_SIGNS = [
  { sign: "Aries", slug: "aries" },
  { sign: "Taurus", slug: "taurus" },
  { sign: "Gemini", slug: "gemini" },
  { sign: "Cancer", slug: "cancer" },
  { sign: "Leo", slug: "leo" },
  { sign: "Virgo", slug: "virgo" },
  { sign: "Libra", slug: "libra" },
  { sign: "Scorpio", slug: "scorpio" },
  { sign: "Sagittarius", slug: "sagittarius" },
  { sign: "Capricorn", slug: "capricorn" },
  { sign: "Aquarius", slug: "aquarius" },
  { sign: "Pisces", slug: "pisces" },
];


const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const FALLBACK_SLUG = "unified-daily-moon-tracker";

const BlogPost = () => {
  const { slug } = useParams();
  // Template preview routes use literal placeholders like `:slug`.
  // Resolve them to the first live post so the preview isn't blank.
  const resolvedSlug = slug && !slug.startsWith(":") ? slug : FALLBACK_SLUG;

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["blog-post", resolvedSlug],
    queryFn: () => fetchPostBySlug(resolvedSlug),
  });

  const { data: related = [] } = useQuery({
    queryKey: ["blog-related", post?.slug, post?.category],
    queryFn: () => (post ? getRelated(post.slug, post.category) : []),
    enabled: !!post,
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="py-20 flex justify-center">
          <MoonLoader size="md" text="Loading article..." />
        </div>
      </PageLayout>
    );
  }

  if (!post || error) return <Navigate to="/blog" replace />;

  const canonicalCat = categoryPath(post.category);
  // If reached via /blog/:slug or wrong category, canonicalize the URL for SEO but still render.
  const canonical = `https://moondaylive.com/blog/${canonicalCat}/${post.slug}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: post.author, url: "https://moondaylive.com" },
    publisher: {
      "@type": "Organization",
      name: "Moonday Live",
      url: "https://moondaylive.com",
      logo: {
        "@type": "ImageObject",
        url: "https://moondaylive.com/og-image.png",
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    keywords: post.keywords.join(", "),
    articleSection: post.category,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://moondaylive.com/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://moondaylive.com/blog" },
      {
        "@type": "ListItem",
        position: 3,
        name: post.category,
        item: `https://moondaylive.com/blog?category=${canonicalCat}`,
      },
      { "@type": "ListItem", position: 4, name: post.title, item: canonical },
    ],
  };

  const signImage = resolveSignImage(post);

  const transitSignInfo = useMemo(() => {
    if (post?.category !== "Transits") return null;
    const tag = post.zodiacSignTag?.toLowerCase();
    const slugLower = post.slug.toLowerCase();
    const titleLower = post.title.toLowerCase();

    const idx = ZODIAC_SIGNS.findIndex(
      (z) =>
        z.slug === tag ||
        z.sign.toLowerCase() === tag ||
        slugLower.includes(z.slug) ||
        titleLower.includes(z.sign.toLowerCase())
    );
    if (idx === -1) return null;

    const current = ZODIAC_SIGNS[idx];
    const prev = ZODIAC_SIGNS[(idx - 1 + 12) % 12];
    const next = ZODIAC_SIGNS[(idx + 1) % 12];
    const faqs = getFAQsBySlug(current.slug);

    return { current, prev, next, faqs };
  }, [post]);

  const faqPageLd =
    transitSignInfo && transitSignInfo.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: transitSignInfo.faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.answer,
            },
          })),
        }
      : null;

  return (
    <PageLayout>
      <SEO
        title={`${post.title.length > 55 ? post.title.slice(0, 55) + "…" : post.title} — Moonday Live`}
        description={post.excerpt}
        canonical={canonical}
        ogType="article"
        ogImage={signImage || undefined}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqPageLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageLd) }} />
      )}

      <article className="w-full max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-xs md:text-sm text-cream-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/" className="hover:text-primary transition">Home</Link></li>
            <ChevronRight className="w-3.5 h-3.5" />
            <li><Link to="/blog" className="hover:text-primary transition">Blog</Link></li>
            <ChevronRight className="w-3.5 h-3.5" />
            <li><Link to={`/blog?category=${canonicalCat}`} className="hover:text-primary transition">{post.category}</Link></li>
          </ol>
        </nav>

        {/* Hero — sign constellation card */}
        <div className="relative rounded-2xl overflow-hidden mb-8 border border-border/30 bg-[#0a0f1a]">
          <div className="relative h-48 md:h-64 lg:h-72 w-full flex items-center justify-center">
            {signImage ? (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,hsl(var(--primary)/0.12),transparent_60%)]" />
                <img
                  src={signImage}
                  alt={`${post.zodiacSignTag || "Constellation"} constellation card`}
                  className="relative z-10 h-full w-full object-contain p-4 md:p-6"
                />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-navy-medium/60 to-navy-deep" />
            )}
          </div>
          <span className="absolute top-4 left-4 inline-flex items-center rounded-full border border-primary/30 bg-background/60 px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase text-primary/90 backdrop-blur">
            {post.category}
          </span>
        </div>


        <header className="mb-10">
          <h1 className="font-display text-2xl md:text-[32px] leading-snug tracking-tight text-foreground font-normal">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-cream-muted/80">
            <span>{post.author}</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.date)}
              <UTCNotice />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {post.readMinutes} min read
            </span>
            {post.reviewedBy && (
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] tracking-wider text-primary/90">
                Human-reviewed by {post.reviewedBy}
              </span>
            )}
          </div>
          {post.guestDisplayName && (
            <div className="mt-5 rounded-xl border border-primary/30 bg-primary/[0.06] px-5 py-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-1.5">
                Guest Astrologer
              </p>
              <p className="text-sm text-foreground">
                This week we have a guest astrologer — {post.guestDisplayName}'s take on this transit.
              </p>
              {post.guestBio && (
                <p className="mt-1 text-xs text-cream-muted/80">{post.guestBio}</p>
              )}
            </div>
          )}
          <p className="mt-5 text-[15px] md:text-base text-cream-muted/85 leading-relaxed italic text-justify hyphens-auto">
            {post.excerpt}
          </p>
        </header>


        {/* Body */}
        <MarkdownArticle source={post.content} ctaType={post.ctaType} />

        {/* Conversion Hero */}
        <div className="mt-14 rounded-xl border border-primary/30 bg-primary/[0.05] p-6 md:p-8 text-center backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-3">The Live Tracker</p>
          <h2 className="font-display text-lg md:text-xl text-foreground mb-2 font-normal">
            Experience the Live Tracker
          </h2>
          <p className="text-sm text-cream-muted/85 max-w-xl mx-auto mb-5 leading-relaxed">
            One dashboard. Live phase, live sign, your natal moon — no ads, no tab-switching.
          </p>
          <Link
            to="/blueprint"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/90 text-primary-foreground text-sm font-medium hover:bg-primary transition-all hover:shadow-[0_0_30px_-8px_hsl(var(--primary)/0.7)]"
          >
            Open the Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {post.category === "Transits" && <EmailCaptureBlock />}

        {/* Transit Cross-Links & FAQs */}
        {transitSignInfo && (
          <>
            {/* Cross-Links: Blueprint, Pricing, and Neighboring Signs */}
            <section className="mt-14 p-6 md:p-8 rounded-2xl border border-primary/20 bg-navy-medium/30 space-y-6">
              <div className="text-center">
                <h2 className="font-display text-xl md:text-2xl text-cream tracking-wide mb-1">
                  Related Pathways
                </h2>
                <p className="font-serif text-sm text-cream-muted">
                  Connect today's Moon in {transitSignInfo.current.sign} to your personal sky
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  to="/blueprint"
                  className="p-4 rounded-xl border border-primary/15 bg-background/40 hover:border-primary/40 transition block"
                >
                  <span className="font-display text-xs uppercase tracking-widest text-primary block mb-1">
                    Natal Architecture
                  </span>
                  <span className="font-display text-base text-cream block hover:text-primary transition">
                    Discover Your Moon Blueprint →
                  </span>
                </Link>

                <Link
                  to="/pricing"
                  className="p-4 rounded-xl border border-primary/15 bg-background/40 hover:border-primary/40 transition block"
                >
                  <span className="font-display text-xs uppercase tracking-widest text-primary block mb-1">
                    Daily Guidance
                  </span>
                  <span className="font-display text-base text-cream block hover:text-primary transition">
                    Unlock Luminary Access →
                  </span>
                </Link>
              </div>

              {/* Neighboring Signs */}
              <div className="pt-3 border-t border-primary/10 flex items-center justify-between gap-4 text-xs font-display uppercase tracking-wider">
                <Link
                  to={`/transit/${transitSignInfo.prev.slug}`}
                  className="text-cream-muted hover:text-primary transition"
                >
                  ← Moon in {transitSignInfo.prev.sign}
                </Link>
                <Link
                  to={`/transit/${transitSignInfo.next.slug}`}
                  className="text-cream-muted hover:text-primary transition text-right"
                >
                  Moon in {transitSignInfo.next.sign} →
                </Link>
              </div>
            </section>

            {/* FAQ Section */}
            {transitSignInfo.faqs.length > 0 && (
              <section
                aria-label={`Frequently asked questions about Moon in ${transitSignInfo.current.sign}`}
                className="mt-14 space-y-6"
              >
                <div className="text-center">
                  <h2 className="font-display text-2xl md:text-3xl text-gold-gradient tracking-wide mb-2">
                    Frequently Asked Questions
                  </h2>
                  <p className="font-serif text-sm md:text-base text-cream-muted/80">
                    Understanding the mechanics of Moon in {transitSignInfo.current.sign}
                  </p>
                </div>

                <div className="space-y-4">
                  {transitSignInfo.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-5 md:p-6 rounded-xl border border-primary/15 bg-navy-medium/20 space-y-2"
                    >
                      <h3 className="font-display text-base md:text-lg text-cream">
                        {faq.question}
                      </h3>
                      <p className="font-serif text-sm md:text-base text-cream-muted leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl text-foreground mb-6 text-center">
              Related Reading
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {related.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          </section>
        )}
      </article>
    </PageLayout>
  );
};

export default BlogPost;
