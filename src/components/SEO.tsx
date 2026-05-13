import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
}

const SITE_URL = "https://moondaylive.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * Per-route SEO component using react-helmet-async.
 * Sets title, meta description, canonical, Open Graph + Twitter Card tags.
 * Keep titles < 60 chars and descriptions < 160 chars.
 */
const SEO = ({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  noindex = false,
}: SEOProps) => {
  const url =
    canonical ||
    (typeof window !== "undefined"
      ? SITE_URL + window.location.pathname
      : SITE_URL);

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
    </Helmet>
  );
};

export default SEO;
