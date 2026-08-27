import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import BlogCard from "@/components/blog/BlogCard";
import { fetchPublishedPosts, CATEGORIES, BlogCategory, categoryPath } from "@/lib/blog/posts";
import MoonLoader from "@/components/MoonLoader";

type Filter = "All" | BlogCategory;
const FILTERS: Filter[] = ["All", ...CATEGORIES];

const Blog = () => {
  const [query, setQuery] = useState("");
  // The Journal leads with transits — that's the main content, not a blog wall.
  const [filter, setFilter] = useState<Filter>("Transits");

  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: fetchPublishedPosts,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (filter !== "All" && p.category !== filter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [query, filter, posts]);

  const featured = filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => p !== featured);

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Moonday Live — Lunar Insights & Guides",
    url: "https://moondaylive.com/blog",
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      datePublished: p.date,
      author: { "@type": "Organization", name: p.author },
      url: `https://moondaylive.com/blog/${categoryPath(p.category)}/${p.slug}`,
    })),
  };

  return (
    <PageLayout>
      <SEO
        title="Lunar Insights & Guides — Moonday Live Blog"
        description="Guides, transits, features, and product updates from Moonday Live — the unified, ad-free lunar tracking dashboard."
        canonical="https://moondaylive.com/blog"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }} />

      <div className="w-full max-w-6xl mx-auto">
        {/* Hero */}
        <header className="text-center mb-10 md:mb-14">
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-primary mb-4">The Journal</p>
          <h1 className="font-display text-4xl md:text-6xl tracking-wide text-foreground">
            Lunar Insights & Guides
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-cream-muted text-base md:text-lg">
            Field notes on the moon, transits, and the craft of tracking the sky honestly — one unified dashboard, zero ads.
          </p>
        </header>

        {/* Search + Filters */}
        <div className="mb-10 space-y-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles, signs, transits..."
              aria-label="Search articles"
              className="w-full h-12 pl-11 pr-4 rounded-full bg-background/70 backdrop-blur border border-border/50 text-foreground placeholder:text-cream-muted/60 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm tracking-wide border transition-all ${
                    active
                      ? "border-primary/70 bg-primary/15 text-primary shadow-[0_0_20px_-8px_hsl(var(--primary)/0.6)]"
                      : "border-border/50 bg-background/50 text-cream-muted hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <MoonLoader size="md" text="Loading journal..." />
          </div>
        ) : error ? (
          <p className="text-center text-cream-muted py-16">
            The journal is temporarily unavailable. Please try again in a moment.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-cream-muted py-16">No articles match your search.</p>
        ) : (
          <>
            {featured && (
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.25em] text-primary/80 mb-3 text-center">Featured</p>
                <BlogCard post={featured} featured />
              </div>
            )}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((p) => (
                  <BlogCard key={p.slug} post={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default Blog;
