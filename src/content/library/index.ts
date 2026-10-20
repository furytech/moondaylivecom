import type { LibraryArticle } from "./types";
import { cancerArticle } from "./cancer";
import { ariesArticle } from "./aries";
import { taurusArticle } from "./taurus";
import { geminiArticle } from "./gemini";
import { leoArticle } from "./leo";
import { virgoArticle } from "./virgo";
import { libraArticle } from "./libra";
import { scorpioArticle } from "./scorpio";
import { sagittariusArticle } from "./sagittarius";
import { capricornArticle } from "./capricorn";
import { aquariusArticle } from "./aquarius";
import { piscesArticle } from "./pisces";

export type { LibraryArticle, ArticleSection, ArticleFaq, ArticleList } from "./types";

/** Long-form article per sign. Signs without an entry keep the four-tab page for now. */
const articles: Record<string, LibraryArticle> = {
  Cancer: cancerArticle,
  Aries: ariesArticle,
  Taurus: taurusArticle,
  Gemini: geminiArticle,
  Leo: leoArticle,
  Virgo: virgoArticle,
  Libra: libraArticle,
  Scorpio: scorpioArticle,
  Sagittarius: sagittariusArticle,
  Capricorn: capricornArticle,
  Aquarius: aquariusArticle,
  Pisces: piscesArticle,
};

/** Closing line of every "Under stress, and what helps" section (same words on all signs). */
export const STRESS_NOTE =
  "Astrology can help you understand your patterns, but it isn't medical care. If stress, low mood or anxiety stays with you for weeks or starts to affect your sleep, eating or daily life, please reach out to a doctor or a mental health professional.";

/** The note goes after the section's list, as its last paragraph. */
function withStressNote(article: LibraryArticle): LibraryArticle {
  return {
    ...article,
    sections: article.sections.map((s) =>
      s.id === "stress" ? { ...s, listAfter: s.listAfter ?? s.paragraphs.length, paragraphs: [...s.paragraphs, STRESS_NOTE] } : s,
    ),
  };
}

export const libraryArticles: Record<string, LibraryArticle> = Object.fromEntries(
  Object.entries(articles).map(([sign, article]) => [sign, withStressNote(article)]),
);
