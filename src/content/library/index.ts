import type { LibraryArticle } from "./types";
import { cancerArticle } from "./cancer";

export type { LibraryArticle, ArticleSection, ArticleFaq, ArticleList } from "./types";

/** Long-form article per sign. Signs without an entry keep the four-tab page for now. */
export const libraryArticles: Record<string, LibraryArticle> = {
  Cancer: cancerArticle,
};
