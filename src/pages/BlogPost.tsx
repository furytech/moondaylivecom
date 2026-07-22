import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Calendar, ChevronRight, Clock } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import MarkdownLite from "@/components/blog/MarkdownLite";
import BlogCard from "@/components/blog/BlogCard";
import { getPost, getRelated, categoryPath } from "@/lib/blog/posts";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const BlogPost = () => {
  const { slug, category } = useParams();
  const post = slug ? getPost(slug) : undefined;

  if (!post) return <Navigate to="/blog" replace />;

  const canonicalCat = categoryPath(post.category);
  // If reached via /blog/:slug or wrong category, canonicalize the URL for SEO but still render.
  const canonical = `https://moondaylive.com/blog/${canonicalCat}/${post.slug}`;
  const related = getRelated(post.slug, post.category);

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

  return (
    <PageLayout>
      <SEO
        title={`${post.title.length > 55 ? post.title.slice(0, 55) + "…" : post.title} — Moonday Live`}
        description={post.excerpt}
        canonical={canonical}
        ogType="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <article className="w-full max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-xs md:text-sm text-cream-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/" className="hover:text-primary transition">Home</Link></li>
            <ChevronRight className="w-3.5 h-3.5" />
            <li><Link to="/blog" className="hover:text-primary transition">Blog</Link></li>
            <ChevronRight className="w-3.5 h-3.5" />
            <li><Link to={`/blog?category=${canonicalCat}`} className="hover:text-primary transition">{post.category}</Link></li>
            <ChevronRight className="w-3.5 h-3.5" />
            <li className="text-foreground/80 truncate max-w-[200px] md:max-w-none">{post.title}</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-10 h-52 md:h-72 bg-gradient-to-br from-primary/30 via-navy-medium to-navy-deep border border-border/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.4),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_80%,hsl(var(--gold-medium)/0.2),transparent_55%)]" />
          <span className="absolute top-5 left-5 inline-flex items-center rounded-full border border-primary/40 bg-background/70 px-3 py-1 text-xs tracking-wider uppercase text-primary backdrop-blur">
            {post.category}
          </span>
        </div>

        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-5xl leading-tight tracking-wide text-foreground">
            {post.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-cream-muted">
            <span>{post.author}</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(post.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readMinutes} min read
            </span>
          </div>
        </header>

        {/* Body */}
        <MarkdownLite source={post.content} />

        {/* Conversion Hero */}
        <div className="mt-14 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/[0.12] via-background/60 to-background/60 p-8 md:p-10 text-center backdrop-blur-md shadow-[0_0_60px_-20px_hsl(var(--primary)/0.5)]">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">The Live Tracker</p>
          <h2 className="font-display text-2xl md:text-3xl text-foreground mb-3">
            Experience the Live Tracker
          </h2>
          <p className="text-cream-muted max-w-xl mx-auto mb-6">
            One dashboard. Live phase, live sign, your natal moon — no ads, no tab-switching.
          </p>
          <Link
            to="/blueprint"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/90 text-primary-foreground font-medium hover:bg-primary transition-all hover:shadow-[0_0_30px_-8px_hsl(var(--primary)/0.7)]"
          >
            Open the Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

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
