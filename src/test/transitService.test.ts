import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  approveTransit, 
  batchApproveAllTransits, 
  updateTransitContent, 
  fetchTransits, 
  toDbRow, 
  fromDbRow,
  formatTransitBlogPostMarkdown,
  buildTransitBlogPostPayload,
  syncTransitToBlogPost
} from '../services/transitService';
import { supabase } from '../lib/supabase';
import { ZodiacSignTransit } from '../types';
import { blogPostsClient, DRAFT_ARTICLE, APPROVED_ARTICLE, PUBLISHED_ARTICLE } from './blogPostsMock';

vi.mock('../lib/supabase', () => {
  const upsertMock = vi.fn();
  const selectMock = vi.fn();
  const orderMock = vi.fn();

  return {
    supabase: {
      from: vi.fn(() => ({
        upsert: upsertMock,
        select: selectMock,
      })),
    },
    upsertMock,
    selectMock,
    orderMock,
  };
});

const mockTransits: ZodiacSignTransit[] = [
  {
    id: 'aries',
    sign: 'Aries',
    symbol: '♈',
    element: 'Fire',
    ruler: 'Mars',
    dates: 'Mar 21 – Apr 19',
    transitTitle: 'Moon in Aries',
    transitAspect: 'Cardinal Ignition',
    copy: 'A high-octane charge pulses.',
    powerHour: '08:15 AM EST',
    ritualTip: 'Burn frankincense.',
    hashtags: ['#AriesSeason'],
    status: 'pending',
    publishedAt: null,
    socialPostedAt: null,
  },
  {
    id: 'taurus',
    sign: 'Taurus',
    symbol: '♉',
    element: 'Earth',
    ruler: 'Venus',
    dates: 'Apr 20 – May 20',
    transitTitle: 'Moon in Taurus',
    transitAspect: 'Sensory Resonance',
    copy: 'Earth medicine grounds.',
    powerHour: '11:30 AM EST',
    ritualTip: 'Drink warm matcha.',
    hashtags: ['#TaurusEnergy'],
    status: 'published',
    publishedAt: '2026-09-26T00:00:00.000Z',
    socialPostedAt: null,
  },
];

describe('transitService - Database Column Mapping & Mutation Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('approveTransit publishes a pending transit with exact database column names via upsert', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const blog = blogPostsClient(DRAFT_ARTICLE);
    vi.mocked(supabase.from).mockImplementation((table: string) =>
      (table === 'transits' ? { upsert: upsertMock } : { select: blog.select, update: blog.update }) as any
    );

    const result = await approveTransit('aries', mockTransits);

    expect(result.success).toBe(true);
    expect(result.updatedTransits.find((t) => t.id === 'aries')?.status).toBe('published');

    if (import.meta.env.VITE_SUPABASE_URL) {
      expect(supabase.from).toHaveBeenCalledWith('transits');
      expect(upsertMock).toHaveBeenCalledTimes(1);
      const payload = upsertMock.mock.calls[0][0];
      expect(payload).toHaveProperty('id', 'aries');
      expect(payload).toHaveProperty('status', 'published');
      expect(payload).toHaveProperty('published_at');
      expect(payload).toHaveProperty('updated_at');
      expect(payload).toHaveProperty('sign', 'Aries');
      expect(upsertMock.mock.calls[0][1]).toEqual({ onConflict: 'id' });
    }
  });

  it('approveTransit revokes a published transit back to pending', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const blog = blogPostsClient(APPROVED_ARTICLE);
    vi.mocked(supabase.from).mockImplementation((table: string) =>
      (table === 'transits' ? { upsert: upsertMock } : { select: blog.select, update: blog.update }) as any
    );

    const result = await approveTransit('taurus', mockTransits);

    expect(result.success).toBe(true);
    const taurus = result.updatedTransits.find((t) => t.id === 'taurus');
    expect(taurus?.status).toBe('pending');
    expect(taurus?.publishedAt).toBeNull();

    if (import.meta.env.VITE_SUPABASE_URL) {
      const payload = upsertMock.mock.calls[0][0];
      expect(payload).toHaveProperty('id', 'taurus');
      expect(payload).toHaveProperty('status', 'pending');
      expect(payload.published_at).toBeNull();
    }
  });

  it('batchApproveAllTransits marks all transits as published with database timestamp via upsert', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const blog = blogPostsClient(DRAFT_ARTICLE);
    vi.mocked(supabase.from).mockImplementation((table: string) =>
      (table === 'transits' ? { upsert: upsertMock } : { select: blog.select, update: blog.update }) as any
    );

    const result = await batchApproveAllTransits(mockTransits);

    expect(result.success).toBe(true);
    expect(result.updatedTransits.every((t) => t.status === 'published')).toBe(true);

    if (import.meta.env.VITE_SUPABASE_URL) {
      expect(supabase.from).toHaveBeenCalledWith('transits');
      const rows = upsertMock.mock.calls[0][0];
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBe(2);
      expect(rows.every((r: any) => r.status === 'published')).toBe(true);
      expect(rows.every((r: any) => r.published_at !== null)).toBe(true);
      expect(upsertMock.mock.calls[0][1]).toEqual({ onConflict: 'id' });
    }
  });

  it('updateTransitContent maps transitTitle, transitAspect, powerHour, ritualTip, hashtags to snake_case db columns', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
    } as unknown as ReturnType<typeof supabase.from>);

    const updates = {
      copy: 'New updated copy',
      transitTitle: 'New Title',
      transitAspect: 'New Aspect',
      powerHour: '10:00 AM EST',
      ritualTip: 'New ritual tip',
      hashtags: ['#TestTag'],
    };

    const result = await updateTransitContent('aries', updates, mockTransits);

    expect(result.success).toBe(true);
    const updated = result.updatedTransits.find((t) => t.id === 'aries');
    expect(updated?.copy).toBe('New updated copy');

    if (import.meta.env.VITE_SUPABASE_URL) {
      expect(supabase.from).toHaveBeenCalledWith('transits');
      const payload = upsertMock.mock.calls[0][0];
      expect(payload).toEqual(
        expect.objectContaining({
          id: 'aries',
          copy: 'New updated copy',
          transit_title: 'New Title',
          transit_aspect: 'New Aspect',
          power_hour: '10:00 AM EST',
          ritual_tip: 'New ritual tip',
          hashtags: ['#TestTag'],
        })
      );
      expect(upsertMock.mock.calls[0][1]).toEqual({ onConflict: 'id' });
    }
  });

  it('approveTransit throws an error if Supabase upsert fails', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: { message: 'RLS policy violation' } });

    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
    } as unknown as ReturnType<typeof supabase.from>);

    if (import.meta.env.VITE_SUPABASE_URL) {
      await expect(approveTransit('aries', mockTransits)).rejects.toThrow('Failed to approve transit in Supabase: RLS policy violation');
    }
  });

  it('approveTransit returns success feedback when Make.com webhook responds 200', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const blog = blogPostsClient(DRAFT_ARTICLE);
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
      select: blog.select,
      update: blog.update,
    } as unknown as ReturnType<typeof supabase.from>);

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    localStorage.setItem('moonday.makeWebhook', 'https://hook.us1.make.com/test-endpoint');

    try {
      const result = await approveTransit('aries', mockTransits);
      expect(result.success).toBe(true);
      expect(result.webhookSuccess).toBe(true);
      expect(result.feedbackMessage).toBe('Approved. Sent to Make.com for syndication.');
      expect(result.feedbackType).toBe('success');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://hook.us1.make.com/test-endpoint',
        expect.objectContaining({
          method: 'POST',
        })
      );
    } finally {
      global.fetch = originalFetch;
      localStorage.removeItem('moonday.makeWebhook');
    }
  });

  it('approveTransit returns warning feedback when Make.com webhook does not respond', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const blog = blogPostsClient(DRAFT_ARTICLE);
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
      select: blog.select,
      update: blog.update,
    } as unknown as ReturnType<typeof supabase.from>);

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection timeout'));
    localStorage.setItem('moonday.makeWebhook', 'https://hook.us1.make.com/test-endpoint');

    try {
      const result = await approveTransit('aries', mockTransits);
      expect(result.success).toBe(true);
      expect(result.webhookSuccess).toBe(false);
      expect(result.feedbackMessage).toBe('Approval saved but Make.com webhook did not respond. Check your automation.');
      expect(result.feedbackType).toBe('warning');
    } finally {
      global.fetch = originalFetch;
      localStorage.removeItem('moonday.makeWebhook');
    }
  });

  it('toDbRow outputs all required columns matching PostgreSQL transits schema', () => {
    const transit = mockTransits[0];
    const row = toDbRow(transit, { status: 'published', published_at: '2026-09-26T12:00:00Z', transit_date: 'Sep 28 – Sep 30' });

    expect(row).toHaveProperty('id', 'aries');
    expect(row).toHaveProperty('sign', 'Aries');
    expect(row).toHaveProperty('symbol', '♈');
    expect(row).toHaveProperty('element', 'Fire');
    expect(row).toHaveProperty('ruler', 'Mars');
    expect(row).toHaveProperty('dates', 'Mar 21 – Apr 19');
    expect(row).toHaveProperty('transit_title', 'Moon in Aries');
    expect(row).toHaveProperty('transit_aspect', 'Cardinal Ignition');
    expect(row).toHaveProperty('transit_date', 'Sep 28 – Sep 30');
    expect(row).toHaveProperty('transit_period', 'Sep 28 – Sep 30');
    expect(row).toHaveProperty('copy', 'A high-octane charge pulses.');
    expect(row).toHaveProperty('power_hour', '08:15 AM EST');
    expect(row).toHaveProperty('ritual_tip', 'Burn frankincense.');
    expect(row).toHaveProperty('hashtags', ['#AriesSeason']);
    expect(row).toHaveProperty('image_url');
    expect(row.image_url).toContain('/storage/v1/object/public/transit-images/aries.png');
    expect(row).toHaveProperty('status', 'published');
    expect(row).toHaveProperty('published_at', '2026-09-26T12:00:00Z');
    expect(row).toHaveProperty('social_posted_at', null);
    expect(row).toHaveProperty('created_at');
    expect(row).toHaveProperty('updated_at');
  });

  it('fromDbRow maps image_url and transit_date to both camelCase and snake_case', () => {
    const dbRow = {
      id: 'leo',
      sign: 'Leo',
      symbol: '♌',
      element: 'Fire',
      ruler: 'The Sun',
      dates: 'Jul 23 – Aug 22',
      transit_title: 'Sun Trine Moon',
      transit_aspect: 'Solar Radiance',
      transit_date: 'Sep 28 – Sep 30',
      copy: 'Your creative aura commands attention.',
      power_hour: '12:00 PM EST',
      ritual_tip: 'Wear gold.',
      hashtags: ['#LeoSeason'],
      image_url: 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/leo.png',
      status: 'pending',
      published_at: null,
      social_posted_at: null,
      created_at: '2026-09-26T00:00:00Z',
      updated_at: '2026-09-26T00:00:00Z',
    };

    const transit = fromDbRow(dbRow);
    expect(transit.imageUrl).toBe('https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/leo.png');
    expect(transit.image_url).toBe('https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/leo.png');
    expect(transit.transitDate).toBe('Sep 28 – Sep 30');
    expect(transit.transit_date).toBe('Sep 28 – Sep 30');
    expect(transit.transit_period).toBe('Sep 28 – Sep 30');
    expect(transit.sign).toBe('Leo');
  });

  it('formatTransitBlogPostMarkdown generates complete markdown article from transit data', () => {
    const transit = mockTransits[0];
    const md = formatTransitBlogPostMarkdown(transit);

    expect(md).toContain('# Moon in Aries');
    expect(md).toContain('**Zodiac Sign:** Aries ♈');
    expect(md).toContain('**Transit Aspect:** Cardinal Ignition');
    expect(md).toContain('**Transit Window:** Mar 21 – Apr 19');
    expect(md).toContain('**Power Hour:** 08:15 AM EST');
    expect(md).toContain('### Cosmic Weather & Astrological Forecast');
    expect(md).toContain('A high-octane charge pulses.');
    expect(md).toContain('### Daily Ritual & Alignment Tip');
    expect(md).toContain('Burn frankincense.');
    expect(md).toContain('#AriesSeason');
  });

  it('buildTransitBlogPostPayload creates published blog_posts row payload matching schema', () => {
    const transit = mockTransits[0];
    const payload = buildTransitBlogPostPayload(transit, true);

    expect(payload.slug).toBe('transit-aries');
    expect(payload.title).toBe('Moon in Aries');
    expect(payload.category).toBe('Transits');
    expect(payload.status).toBe('published');
    expect(payload.published_at).not.toBeNull();
    expect(payload.zodiac_sign_tag).toBe('Aries');
    expect(payload.keywords).toContain('AriesSeason');
  });

  it('approveTransit warns when no journal article is queued for the sign', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const blog = blogPostsClient(null);
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
      select: blog.select,
      update: blog.update,
    } as unknown as ReturnType<typeof supabase.from>);

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    localStorage.setItem('moonday.makeWebhook', 'https://hook.us1.make.com/test-endpoint');

    try {
      const result = await approveTransit('aries', mockTransits);
      expect(result.success).toBe(true);
      expect(result.webhookSuccess).toBe(true);
      if (import.meta.env.VITE_SUPABASE_URL) {
        expect(result.feedbackType).toBe('warning');
        expect(result.feedbackMessage).toContain('Approved. Sent to Make.com for syndication.');
        expect(result.feedbackMessage).toContain('Journal article not queued: No upcoming journal article found for Aries');
      }
    } finally {
      global.fetch = originalFetch;
      localStorage.removeItem('moonday.makeWebhook');
    }
  });

  describe('syncTransitToBlogPost - queues the real journal article', () => {
    const aries = mockTransits[0];

    it('marks the upcoming draft article approved', async () => {
      const blog = blogPostsClient(DRAFT_ARTICLE);
      vi.mocked(supabase.from).mockReturnValue({
        select: blog.select,
        update: blog.update,
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await syncTransitToBlogPost(aries, true);

      expect(result.success).toBe(true);
      if (import.meta.env.VITE_SUPABASE_URL) {
        expect(supabase.from).toHaveBeenCalledWith('blog_posts');
        expect(blog.query.eq).toHaveBeenCalledWith('category', 'Transits');
        expect(blog.query.eq).toHaveBeenCalledWith('zodiac_sign_tag', 'Aries');
        expect(blog.updateMock).toHaveBeenCalledWith({ status: 'approved' });
      }
    });

    it('leaves an article that is already published alone', async () => {
      const blog = blogPostsClient(PUBLISHED_ARTICLE);
      vi.mocked(supabase.from).mockReturnValue({
        select: blog.select,
        update: blog.update,
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await syncTransitToBlogPost(aries, true);

      expect(result.success).toBe(true);
      expect(blog.updateMock).not.toHaveBeenCalled();
    });

    it('returns an error and changes nothing when no upcoming article exists', async () => {
      const blog = blogPostsClient(null);
      vi.mocked(supabase.from).mockReturnValue({
        select: blog.select,
        update: blog.update,
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await syncTransitToBlogPost(aries, true);

      if (import.meta.env.VITE_SUPABASE_URL) {
        expect(result.success).toBe(false);
        expect(result.error).toContain('No upcoming journal article found for Aries');
      }
      expect(blog.updateMock).not.toHaveBeenCalled();
    });

    it('revoking returns an approved article to draft', async () => {
      const blog = blogPostsClient(APPROVED_ARTICLE);
      vi.mocked(supabase.from).mockReturnValue({
        select: blog.select,
        update: blog.update,
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await syncTransitToBlogPost(aries, false);

      expect(result.success).toBe(true);
      if (import.meta.env.VITE_SUPABASE_URL) {
        expect(blog.updateMock).toHaveBeenCalledWith({ status: 'draft', published_at: null });
      }
    });
  });
});
