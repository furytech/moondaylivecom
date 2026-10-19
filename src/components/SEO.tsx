import { Helmet } from "react-helmet-async";
import { SITE_URL, DEFAULT_OG_IMAGE, canonicalUrl, normalizePath } from "@/lib/seo";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Per-route SEO component using react-helmet-async.
 * Sets title, meta description, canonical, Open Graph + Twitter Card tags, and JSON-LD schema.
 * Keep titles < 60 chars and descriptions < 160 chars.
 *
 * The canonical is always absolute, lowercase and without a trailing slash, whatever form the
 * visitor's URL or the caller's string takes. Public pages are also written into the served HTML
 * at build time (scripts/prerender-seo.mjs); this component keeps the live head in step.
 */
const SEO = ({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  noindex = false,
  schema,
}: SEOProps) => {
  const path = canonical
    ? canonical.replace(SITE_URL, "")
    : typeof window !== "undefined"
      ? window.location.pathname
      : "/";
  const url = canonicalUrl(normalizePath(path || "/"));

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Moonday Live" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
