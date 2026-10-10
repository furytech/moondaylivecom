import { vi } from 'vitest';

/**
 * Test double for the blog_posts queries used by syncTransitToBlogPost:
 *   select(...).eq().eq().gte().order().limit().maybeSingle()  -> the upcoming article (or null)
 *   update(...).eq().select().single()                          -> the updated article
 */
export interface ArticleRow {
  id: string;
  slug: string;
  status: string;
  publish_at: string;
}

export const DRAFT_ARTICLE: ArticleRow = {
  id: 'post-123',
  slug: 'the-moon-enters-aries-what-to-feel-notice-and-release-2099-01-01',
  status: 'draft',
  publish_at: '2099-01-01T00:00:00.000Z',
};
export const APPROVED_ARTICLE: ArticleRow = { ...DRAFT_ARTICLE, status: 'approved' };
export const PUBLISHED_ARTICLE: ArticleRow = { ...DRAFT_ARTICLE, status: 'published' };

export function blogPostsClient(article: ArticleRow | null, updateError: { message: string } | null = null) {
  const query: Record<string, any> = {};
  for (const method of ['eq', 'gte', 'order', 'limit']) {
    query[method] = vi.fn().mockReturnValue(query);
  }
  query.maybeSingle = vi.fn().mockResolvedValue({ data: article, error: null });

  const single = vi.fn().mockResolvedValue({ data: article, error: updateError });
  const updateEq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
  const updateMock = vi.fn().mockReturnValue({ eq: updateEq });

  return {
    select: vi.fn().mockReturnValue(query),
    update: updateMock,
    updateMock,
    query,
  };
}
