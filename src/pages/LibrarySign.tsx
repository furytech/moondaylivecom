import { useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import NotFound from "@/pages/NotFound";
import { SignPageBody } from "@/components/library/SignPageBody";
import { buildSignSeo, signFromSlug } from "@/lib/librarySeo";

const LibrarySign = () => {
  const { slug } = useParams<{ slug: string }>();
  const sign = signFromSlug(slug);
  if (!sign) return <NotFound />;
  const seo = buildSignSeo(sign);

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      <SEO
        title={seo.title}
        description={seo.description}
        canonical={seo.url}
        ogType="article"
        schema={seo.schema}
      />
      <Navigation />
      <SignPageBody sign={sign} />
      <Footer />
    </div>
  );
};

export default LibrarySign;
