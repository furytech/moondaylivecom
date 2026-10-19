// Long-form reading below the sign tabs, plus the "On this page" list. Copy lives in src/content/library/.
// Rendered by the React page and at build time by the prerender, so it must work without auth or browser APIs
// (the Sun-sign chips read the session, and treat a missing provider value as signed out).
import { Link } from "react-router-dom";
import type { LibraryArticle } from "@/content/library";
import { LIBRARY_SIGNS } from "@/lib/librarySeo";
import { zodiacDeepContent } from "@/lib/zodiacDeepContent";
import { useAuth } from "@/contexts/AuthContext";

const linkClass = "text-primary underline underline-offset-4 hover:text-primary/80";
const h2Class = "font-display text-xl md:text-2xl text-primary tracking-[0.08em] text-left scroll-mt-24 mb-4";
const pClass = "font-serif text-base md:text-lg text-cream-muted leading-relaxed text-left my-4";

export const PROFILE_ANCHOR = "profile";

export function articleToc(article: LibraryArticle) {
  return [
    { id: PROFILE_ANCHOR, label: `${article.sign} Moon profile` },
    ...article.sections.map((s) => ({ id: s.id, label: s.heading })),
    { id: "combination", label: "Find your combination" },
    { id: "questions", label: `${article.sign} Moon questions` },
  ];
}

export function OnThisPage({ article }: { article: LibraryArticle }) {
  return (
    <nav aria-label="On this page" className="rounded-xl border border-primary/15 bg-navy-medium/20 p-4">
      <h2 className="font-display text-xs tracking-[0.2em] uppercase text-primary/80 text-left mb-3">On this page</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-left list-none p-0 m-0">
        {articleToc(article).map((item) => (
          <li key={item.id} className="text-left">
            <a href={`#${item.id}`} className={`${linkClass} font-serif text-sm`}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SunSignChips({ moonSign }: { moonSign: string }) {
  const { user } = useAuth();
  // Signed-in members go to their Blueprint; everyone else starts at signup. Never /signup for a member.
  const href = user ? "/blueprint" : "/signup";
  return (
    <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 list-none p-0 m-0">
      {LIBRARY_SIGNS.map((sun) => (
        <li key={sun}>
          <Link
            to={href}
            aria-label={`${sun} Sun, ${moonSign} Moon combination`}
            className="block rounded-xl border border-white/15 px-2 py-3 min-h-[44px] text-center font-serif text-sm text-foreground/80 hover:border-white/35 hover:bg-white/10"
          >
            <span aria-hidden="true">{zodiacDeepContent[sun]?.symbol} </span>
            {sun}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SignArticle({ article }: { article: LibraryArticle }) {
  const { sign } = article;
  return (
    <div className="flex flex-col gap-10">
      {article.sections.map((section) => {
        const at = Math.min(section.listAfter ?? 1, section.paragraphs.length);
        const before = section.paragraphs.slice(0, at);
        const after = section.paragraphs.slice(at);
        return (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-h`}>
            <h2 id={`${section.id}-h`} className={h2Class}>
              {section.heading}
            </h2>
            {before.map((text, i) => (
              <p key={`b${i}`} className={pClass}>
                {text}
              </p>
            ))}
            {section.list && (
              <div className="my-5 rounded-xl border border-primary/10 p-5 text-left">
                <h3 className="font-display text-xs tracking-[0.2em] uppercase text-primary/90 text-left mb-3">
                  {section.list.title}
                </h3>
                <ul className="space-y-3 text-left list-none p-0 m-0">
                  {section.list.items.map((item) => (
                    <li key={item} className="font-serif text-base text-cream-muted leading-relaxed text-left flex gap-3">
                      <span aria-hidden="true" className="text-primary/60 mt-1">◆</span>
                      <span className="text-left">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {after.map((text, i) => (
              <p key={`a${i}`} className={pClass}>
                {text}
              </p>
            ))}
          </section>
        );
      })}

      <section id="combination" aria-labelledby="combination-h">
        <h2 id="combination-h" className={h2Class}>
          Find your combination
        </h2>
        <p className={pClass}>{article.combinationLine}</p>
        <SunSignChips moonSign={sign} />
      </section>

      <section id="questions" aria-labelledby="questions-h">
        <h2 id="questions-h" className={h2Class}>
          {sign} Moon questions
        </h2>
        <dl className="space-y-6 text-left">
          {article.faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="font-sans text-base md:text-lg font-medium text-foreground text-left">{faq.question}</dt>
              <dd className="font-serif text-base md:text-lg text-cream-muted leading-relaxed text-left mt-2 ml-0">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="closing-h" className="rounded-xl border border-primary/25 bg-primary/[0.05] p-6 md:p-8">
        <h2 id="closing-h" className="font-display text-xl md:text-2xl text-primary tracking-[0.08em] text-left mb-3">
          {article.closing.heading}
        </h2>
        <p className={pClass}>{article.closing.text}</p>
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <Link
            to="/birthday-moon-phase"
            className="inline-flex items-center justify-center rounded-xl bg-[#d4af37] px-5 py-3 min-h-[44px] font-sans text-sm font-semibold text-navy-deep hover:bg-[#d4af37]/90"
          >
            Find my Moon sign
          </Link>
          <Link
            to="/transition-quiz"
            className="inline-flex items-center justify-center rounded-xl border border-[#d4af37]/60 px-5 py-3 min-h-[44px] font-sans text-sm font-medium text-[#d4af37] hover:bg-[#d4af37]/10"
          >
            Take the Moon Cusp Quiz
          </Link>
        </div>
      </section>
    </div>
  );
}
