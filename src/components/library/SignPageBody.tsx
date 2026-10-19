// Body of a public /library/[sign]-moon page. Rendered by the React page and,
// at build time, by scripts/prerender-library.mjs (so it must work without auth/browser APIs).
import { Link } from "react-router-dom";
import { zodiacDeepContent } from "@/lib/zodiacDeepContent";
import { LIBRARY_SIGNS, libraryPath } from "@/lib/librarySeo";
import { libraryArticles } from "@/content/library";
import { OnThisPage, SignArticle } from "@/components/library/SignArticle";
import { SignDetailContent } from "@/components/library/SignDetailContent";

export function SignPageBody({ sign }: { sign: string }) {
  const content = zodiacDeepContent[sign];
  const article = libraryArticles[sign];
  const linkClass = "text-primary underline underline-offset-4 hover:text-primary/80";

  return (
    <main className="flex-1 flex flex-col items-center pt-[68px] pb-8 px-4 md:px-8 relative z-20">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
        <nav aria-label="Breadcrumb" className="font-serif text-sm text-muted-foreground text-left">
          <Link to="/library" className={linkClass}>Lunar Library</Link>
          <span aria-hidden="true"> / </span>
          <span>{sign} Moon</span>
        </nav>

        <SignDetailContent content={content} afterHeader={article ? <OnThisPage article={article} /> : undefined} />

        {article && <SignArticle article={article} />}

        <nav aria-label="All Moon signs">
          <h2 className="font-display text-sm tracking-[0.2em] uppercase text-primary/80 mb-3">
            All Moon signs
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {LIBRARY_SIGNS.map((s) => (
              <li key={s}>
                <Link
                  to={libraryPath(s)}
                  aria-current={s === sign ? "page" : undefined}
                  className="block rounded-xl border border-white/15 px-3 py-3 min-h-[44px] text-center font-serif text-sm text-foreground/80 hover:border-white/35 hover:bg-white/10 aria-[current=page]:border-[#d4af37] aria-[current=page]:text-[#d4af37]"
                >
                  {s} Moon
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-center font-serif text-sm text-muted-foreground">
          Looking for today's Moon?{" "}
          <Link to="/pulse" className={linkClass}>
            See the Daily Pulse →
          </Link>
        </p>
      </div>
    </main>
  );
}
