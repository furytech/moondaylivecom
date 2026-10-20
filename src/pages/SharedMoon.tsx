import { Link, Navigate, useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { getMoonSignDeepDive } from "@/lib/moonSignContent";
import { buildSharedMoonPageSeo, parseShareSign } from "@/lib/sharedMoonSeo";

const GOLD = "#d4af37";

/**
 * What a shared Moon sign link opens: the sharer's sign and archetype, nothing else about them,
 * and an invitation to find your own by creating a free account.
 */
const SharedMoon = () => {
  const { sign: param } = useParams();
  const { user } = useAuth();
  const sign = parseShareSign(param);
  const dive = sign ? getMoonSignDeepDive(sign) : null;
  if (!sign || !dive) return <Navigate to="/" replace />;

  const seo = buildSharedMoonPageSeo(sign);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden flex flex-col">
      <SEO title={seo.title} description={seo.description} canonical={seo.canonical} ogImage={seo.ogImage} noindex />
      <Navigation />

      <main className="relative z-10 flex-1 flex items-start justify-center px-4 sm:px-6 pt-[68px] pb-16">
        <div className="max-w-md w-full space-y-6 mt-6">
          <p className="text-lilac text-xs tracking-[0.3em] uppercase text-center">A friend shared their Moon sign</p>

          <article className="p-6 sm:p-8 rounded-3xl border border-lilac/25 bg-card/50 backdrop-blur-xl shadow-[0_0_80px_-20px_hsl(var(--lilac)/0.4)] text-center space-y-3">
            <p className="text-6xl leading-none" aria-hidden="true" style={{ color: GOLD }}>
              {dive.symbol}
            </p>
            <h1
              className="font-display text-3xl md:text-4xl tracking-wide"
              style={{ color: GOLD, textShadow: "0 0 22px rgba(212, 175, 55, 0.35)" }}
            >
              {dive.sign} Moon
            </h1>
            <p className="text-sm text-muted-foreground tracking-wide">
              {dive.archetype} · {dive.element}
            </p>
            <p className="font-sans text-base italic text-cream/90 leading-relaxed">“{dive.headline}.”</p>
          </article>

          <div className="rounded-2xl border border-lilac/25 bg-card/50 p-5 md:p-6 space-y-4">
            <p className="font-sans text-lg leading-snug text-foreground text-left">
              Find your own Moon sign: create your free account.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed text-left">
              Add your birthday and email. Your Moon sign appears right away. We never ask for your birth time or place.
            </p>
            <Link
              to={user ? "/blueprint" : "/find-my-moon-sign"}
              className="flex items-center justify-center w-full min-h-12 px-5 py-3 bg-lilac hover:bg-lilac-light text-primary-foreground font-sans text-[15px] font-medium normal-case tracking-normal rounded-xl transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)]"
            >
              {user ? "Open your Blueprint" : "Find my Moon sign"}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SharedMoon;
