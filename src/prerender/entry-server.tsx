// Build-time SSR entry used by scripts/prerender-library.mjs and scripts/prerender-seo.mjs (not part of the client bundle).
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
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

export function renderSignPage(sign: string) {
  return renderToString(
    <StaticRouter location={libraryPath(sign)}>
      <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
        <SignPageBody sign={sign} />
      </div>
    </StaticRouter>,
  );
}
