// Long-form reading for a /library/[sign]-moon page, below the four tabs.
// One file per sign (cancer.ts is the model); the page renders every sign's article the same way.
// The page is about having this Moon sign as a person (the Moon was in the sign on your birthday),
// not about the Moon's monthly transit through the sign, which lives on /transit/<sign> and the Daily Pulse.

export interface ArticleList {
  /** Short lead-in shown above the bullets. */
  title: string;
  items: string[];
}

export interface ArticleSection {
  /** Anchor id used by the "On this page" links. */
  id: string;
  /** Short heading (6 words or fewer: it is set in the display font). */
  heading: string;
  paragraphs: string[];
  /** Optional bullets, shown after the first `listAfter` paragraphs (default 1). */
  list?: ArticleList;
  listAfter?: number;
}

export interface ArticleFaq {
  question: string;
  answer: string;
}

export interface LibraryArticle {
  sign: string;
  /** Overrides the meta title / description when the default ones are too generic. */
  seoTitle?: string;
  seoDescription?: string;
  sections: ArticleSection[];
  faqs: ArticleFaq[];
  closing: { heading: string; text: string };
}
