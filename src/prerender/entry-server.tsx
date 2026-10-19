// Build-time SSR entry used by scripts/prerender-library.mjs and scripts/prerender-seo.mjs (not part of the client bundle).
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "@/pages/Index";
import Pulse from "@/pages/Pulse";
import FAQ from "@/pages/FAQ";
import Pricing from "@/pages/Pricing";
import About from "@/pages/About";
import Library from "@/pages/Library";
import Blog from "@/pages/Blog";
import Contact from "@/pages/Contact";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Refund from "@/pages/Refund";
import Disclaimer from "@/pages/Disclaimer";
import MoonSignHoroscope from "@/pages/MoonSignHoroscope";
import LunarClimate from "@/pages/LunarClimate";
import LunarCycleTracking from "@/pages/LunarCycleTracking";
import BirthdayMoonPhase from "@/pages/BirthdayMoonPhase";
import Transit from "@/pages/Transit";
import { rowToPost, type BlogPostRow } from "@/lib/blog/posts";
import { SignPageBody } from "@/components/library/SignPageBody";
import { LIBRARY_SIGNS, buildSignSeo, libraryPath } from "@/lib/librarySeo";

export { LIBRARY_SIGNS, buildSignSeo, libraryPath };
export {
  PAGES,
  ZODIAC_SIGNS,
  SITE_URL,
  DEFAULT_OG_IMAGE,
  canonicalUrl,
  buildPostSeo,
  buildTransitPageSeo,
  signOgImage,
} from "@/lib/seo";
export { POST_COLUMNS, injectHead, injectRoot, postPage } from "@/lib/seoHead";
export { faqPageSchema } from "@/data/faqs";
export { renderPostArticle } from "@/lib/postHtml";

// Public pages whose real React page is rendered into the served HTML at build time.
const PAGE_ROUTES: Record<string, { pattern: string; element: JSX.Element }> = {
  "/": { pattern: "/", element: <Index /> },
  "/pulse": { pattern: "/pulse", element: <Pulse /> },
  "/faq": { pattern: "/faq", element: <FAQ /> },
  "/pricing": { pattern: "/pricing", element: <Pricing /> },
  "/about": { pattern: "/about", element: <About /> },
  "/library": { pattern: "/library", element: <Library /> },
  "/blog": { pattern: "/blog", element: <Blog /> },
  "/contact": { pattern: "/contact", element: <Contact /> },
  "/privacy": { pattern: "/privacy", element: <Privacy /> },
  "/terms": { pattern: "/terms", element: <Terms /> },
  "/refund": { pattern: "/refund", element: <Refund /> },
  "/disclaimer": { pattern: "/disclaimer", element: <Disclaimer /> },
  "/moon-sign-horoscope": { pattern: "/moon-sign-horoscope", element: <MoonSignHoroscope /> },
  "/lunar-climate": { pattern: "/lunar-climate", element: <LunarClimate /> },
  "/lunar-cycle-tracking": { pattern: "/lunar-cycle-tracking", element: <LunarCycleTracking /> },
  "/birthday-moon-phase": { pattern: "/birthday-moon-phase", element: <BirthdayMoonPhase /> },
};

export const RENDERED_PATHS = Object.keys(PAGE_ROUTES);

/** The page's own markup, as the browser would first render it (no auth, no data). */
export function renderPage(path: string, posts: BlogPostRow[] = []) {
  const route = path.startsWith("/transit/")
    ? { pattern: "/transit/:sign", element: <Transit /> }
    : PAGE_ROUTES[path];
  if (!route) throw new Error(`renderPage: no route for ${path}`);
  // The same data the page would fetch, so lists render instead of "Loading...".
  const queryClient = new QueryClient();
  const mapped = posts.map(rowToPost);
  queryClient.setQueryData(["blog-posts"], mapped);
  queryClient.setQueryData(["home-blog-posts"], mapped);
  return renderToString(
    <HelmetProvider context={{}}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider initialLoading={false}>
            <StaticRouter location={path}>
              <Routes>
                <Route path={route.pattern} element={route.element} />
              </Routes>
            </StaticRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

export function renderSignPage(sign: string) {
  return renderToString(
    <StaticRouter location={libraryPath(sign)}>
      <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
        <SignPageBody sign={sign} />
      </div>
    </StaticRouter>,
  );
}
