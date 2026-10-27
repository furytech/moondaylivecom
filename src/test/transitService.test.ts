import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  approveTransit,
  stateOf,
  undoApproval,
  undoAllApproved,
  batchApproveAllTransits,
  updateTransitContent,
  toDbRow,
  fromDbRow,
  formatTransitBlogPostMarkdown,
  buildTransitBlogPostPayload,
  syncTransitToBlogPost
} from '../services/transitService';
import * as transitService from '../services/transitService';
import { supabase } from '../lib/supabase';
import { ZodiacSignTransit } from '../types';
import { blogPostsClient, DRAFT_ARTICLE, APPROVED_ARTICLE, PUBLISHED_ARTICLE } from './blogPostsMock';
import { transitsTable } from './transitsTableMock';
import type { TransitWindow } from '../../supabase/functions/_shared/socialDue';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

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
    publishedAt: '2026-10-25T00:00:00.000Z',
    socialPostedAt: null,
  },
];

// Aries starts Tue Oct 27 2026, 2:30 PM EDT (posts 2:00 PM ET). Taurus starts Fri Oct 30, 12:18 AM EDT (posts Thu 8:00 PM ET).
const WINDOWS: TransitWindow[] = [
  { sign: 'Aries', start_time: '2026-10-27T18:30:00Z', end_time: '2026-10-29T20:00:00Z' },
  { sign: 'Taurus', start_time: '2026-10-30T04:18:00Z', end_time: '2026-11-01T10:00:00Z' },
];
const NOW = '2026-10-26T12:00:00Z';

const withTransits = (table: ReturnType<typeof transitsTable>['table'], blogArticle: any = DRAFT_ARTICLE) => {
  const blog = blogPostsClient(blogArticle);
  vi.mocked(supabase.from).mockImplementation((name: string) =>
    (name === 'transits' ? table : { select: blog.select, update: blog.update }) as any
  );
  return blog;
};

describe('transitService - approve, undo and the removed Make.com ping', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(NOW) });
    fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchSpy as any;
    localStorage.setItem('moonday.makeWebhook', 'https://hook.us1.make.com/test-endpoint');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
    localStorage.removeItem('moonday.makeWebhook');
  });

  it('approve moves Pending to Approved with a targeted update (status and published_at only; the post marker is never written)', async () => {
    const t = transitsTable({ updateResults: [{ data: [{ id: 'aries' }] }] });
    withTransits(t.table);

    const result = await approveTransit('aries', mockTransits, WINDOWS);

    expect(result.success).toBe(true);
    expect(result.action).toBe('approved');
    const aries = result.updatedTransits.find((x) => x.id === 'aries')!;
    expect(aries.status).toBe('published');
    expect(aries.publishedAt).toBe(new Date(NOW).toISOString());
    expect(t.update).toHaveBeenCalledTimes(1);
    const payload = t.update.mock.calls[0][0];
    expect(Object.keys(payload).sort()).toEqual(['published_at', 'status', 'updated_at']);
    expect(payload).toMatchObject({ status: 'published' });
    expect(t.upsert).not.toHaveBeenCalled();
  });

  it('approve shows the scheduled post time in the confirmation', async () => {
    withTransits(transitsTable({ updateResults: [{ data: [{ id: 'aries' }] }] }).table);
    const result = await approveTransit('aries', mockTransits, WINDOWS);
    expect(result.feedbackType).toBe('success');
    expect(result.feedbackMessage).toBe('Approved. Posts Tue 2:00 PM ET.');
  });

  it('approve after the post time with the window running says it posts at the next hourly check', async () => {
    vi.setSystemTime(new Date('2026-10-28T12:00:00Z'));
    withTransits(transitsTable({ updateResults: [{ data: [{ id: 'aries' }] }] }).table);
    const result = await approveTransit('aries', mockTransits, WINDOWS);
    expect(result.feedbackMessage).toContain('posts at the next hourly check');
  });

  it('approve with no moon schedule loaded warns instead of promising a time', async () => {
    withTransits(transitsTable({ updateResults: [{ data: [{ id: 'aries' }] }] }).table);
    const result = await approveTransit('aries', mockTransits, []);
    expect(result.feedbackType).toBe('warning');
    expect(result.feedbackMessage).toContain('No moon schedule');
  });

  it('only Pending cards can be approved: an approved card is refused and nothing is written', async () => {
    const t = transitsTable();
    withTransits(t.table);
    const result = await approveTransit('taurus', mockTransits, WINDOWS);
    expect(result.success).toBe(false);
    expect(t.update).not.toHaveBeenCalled();
    expect(t.upsert).not.toHaveBeenCalled();
  });

  it('a card with no database row yet is inserted when approved', async () => {
    const t = transitsTable({ updateResults: [{ data: [] }] });
    withTransits(t.table);
    const result = await approveTransit('aries', mockTransits, WINDOWS);
    expect(result.success).toBe(true);
    expect(t.upsert).toHaveBeenCalledTimes(1);
    expect(t.upsert.mock.calls[0][0][0]).toMatchObject({ id: 'aries', status: 'published' });
    expect(t.upsert.mock.calls[0][1]).toEqual({ onConflict: 'id' });
  });

  it('approve throws an error if Supabase fails', async () => {
    withTransits(transitsTable({ updateResults: [{ error: { message: 'RLS policy violation' } }] }).table);
    await expect(approveTransit('aries', mockTransits, WINDOWS)).rejects.toThrow('Failed to approve transit in Supabase: RLS policy violation');
  });

  it('approve warns when no journal article is queued for the sign', async () => {
    withTransits(transitsTable({ updateResults: [{ data: [{ id: 'aries' }] }] }).table, null);
    const result = await approveTransit('aries', mockTransits, WINDOWS);
    expect(result.success).toBe(true);
    expect(result.feedbackType).toBe('warning');
    expect(result.feedbackMessage).toContain('Approved. Posts Tue 2:00 PM ET.');
    expect(result.feedbackMessage).toContain('Journal article not queued: No upcoming journal article found for Aries');
  });

  it('the Make.com ping is gone: approving never calls fetch, and there is no webhook sender or notice', async () => {
    withTransits(transitsTable({ updateResults: [{ data: [{ id: 'aries' }] }] }).table);
    const result = await approveTransit('aries', mockTransits, WINDOWS);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect((transitService as Record<string, unknown>).sendMakeWebhook).toBeUndefined();
    expect(result).not.toHaveProperty('webhookSuccess');
    expect(result.feedbackMessage).not.toMatch(/make\.com|webhook/i);
  });

  it('undo returns an Approved card to Pending, only touching approved, unposted, not-sending rows', async () => {
    const t = transitsTable({ updateResults: [{ data: [{ id: 'taurus' }] }] });
    withTransits(t.table, APPROVED_ARTICLE);

    const result = await undoApproval('taurus', mockTransits, WINDOWS);

    expect(result.success).toBe(true);
    expect(result.action).toBe('undone');
    const taurus = result.updatedTransits.find((x) => x.id === 'taurus')!;
    expect(taurus.status).toBe('pending');
    expect(taurus.publishedAt).toBeNull();
    expect(t.update.mock.calls[0][0]).toMatchObject({ status: 'pending', published_at: null });
    // Taurus posts Thu Oct 29 8:00 PM ET (00:00Z Oct 30): the post must not be out for THIS window
    expect(t.filters[0]).toEqual(expect.arrayContaining([
      'eq:id,taurus',
      'eq:status,published',
      'or:social_posted_at.is.null,social_posted_at.lt.2026-10-30T00:00:00.000Z',
    ]));
    expect(t.filters[0].some((f) => f.startsWith('or:social_sending_at.is.null'))).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('undo is refused for a Posted card, with no database write', async () => {
    const t = transitsTable();
    withTransits(t.table);
    vi.setSystemTime(new Date('2026-10-30T01:00:00Z'));
    const posted = mockTransits.map((x) => (x.id === 'taurus' ? { ...x, socialPostedAt: '2026-10-30T00:05:00Z' } : x));
    const result = await undoApproval('taurus', posted, WINDOWS);
    expect(result.success).toBe(false);
    expect(result.feedbackMessage).toContain('already gone out');
    expect(t.update).not.toHaveBeenCalled();
  });

  it('undo is refused when the database shows the post went out after this screen loaded', async () => {
    const t = transitsTable({
      updateResults: [{ data: [] }],
      rows: [{ id: 'taurus', status: 'published', social_posted_at: '2026-10-30T00:05:00Z', social_sending_at: null }],
    });
    withTransits(t.table);
    const result = await undoApproval('taurus', mockTransits, WINDOWS);
    expect(result.success).toBe(false);
    expect(result.feedbackMessage).toContain('already gone out');
    expect(result.updatedTransits.find((x) => x.id === 'taurus')?.status).toBe('published');
  });

  it('undo is refused while the post is being sent', async () => {
    const t = transitsTable({
      updateResults: [{ data: [] }],
      rows: [{ id: 'taurus', status: 'published', social_posted_at: null, social_sending_at: '2026-10-26T11:59:30Z' }],
    });
    withTransits(t.table);
    const result = await undoApproval('taurus', mockTransits, WINDOWS);
    expect(result.success).toBe(false);
    expect(result.feedbackMessage).toContain('being sent right now');
  });

  it('undo still works before the sending column exists (that check is dropped, the rest stays)', async () => {
    const t = transitsTable({ updateResults: [{ error: { message: 'column "social_sending_at" does not exist' } }, { data: [{ id: 'taurus' }] }] });
    withTransits(t.table, APPROVED_ARTICLE);
    const result = await undoApproval('taurus', mockTransits, WINDOWS);
    expect(result.success).toBe(true);
    expect(t.update).toHaveBeenCalledTimes(2);
    expect(t.filters[1]).toContain('or:social_posted_at.is.null,social_posted_at.lt.2026-10-30T00:00:00.000Z');
    expect(t.filters[1].some((f) => f.startsWith('or:social_sending_at'))).toBe(false);
  });

  it('Undo sticks: the card is Pending afterwards, and a later content edit cannot bring the approval back', async () => {
    const t = transitsTable({ updateResults: [{ data: [{ id: 'taurus' }] }] });
    withTransits(t.table, APPROVED_ARTICLE);
    const undone = await undoApproval('taurus', mockTransits, WINDOWS);
    const taurus = undone.updatedTransits.find((x) => x.id === 'taurus')!;
    expect(stateOf(taurus, WINDOWS).state).toBe('pending');
    // even at its post time the Pending card is not due
    expect(stateOf(taurus, WINDOWS, Date.parse('2026-10-30T01:00:00Z'))).toMatchObject({ state: 'pending', due: false });

    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ upsert: upsertMock } as unknown as ReturnType<typeof supabase.from>);
    await updateTransitContent('taurus', { copy: 'edited' }, undone.updatedTransits);
    expect(upsertMock.mock.calls[0][0]).not.toHaveProperty('status');
    expect(upsertMock.mock.calls[0][0]).not.toHaveProperty('published_at');
  });

  it('a card carrying the previous cycle marker can still be undone before its new post (the marker is older than the post time)', async () => {
    const t = transitsTable({ updateResults: [{ data: [{ id: 'taurus' }] }] });
    withTransits(t.table, APPROVED_ARTICLE);
    const lastCycle = mockTransits.map((x) => (x.id === 'taurus' ? { ...x, socialPostedAt: '2026-10-02T00:05:00Z' } : x));
    const result = await undoApproval('taurus', lastCycle, WINDOWS);
    expect(result.success).toBe(true);
    expect(result.updatedTransits.find((x) => x.id === 'taurus')?.status).toBe('pending');
  });

  it('a Missed card (standing approval, window ended unposted) can be undone', async () => {
    vi.setSystemTime(new Date('2026-11-02T00:00:00Z')); // Taurus ended Nov 1 10:00Z, never posted
    const t = transitsTable({ updateResults: [{ data: [{ id: 'taurus' }] }] });
    withTransits(t.table, APPROVED_ARTICLE);
    expect(stateOf(mockTransits[1], WINDOWS).state).toBe('missed');
    const result = await undoApproval('taurus', mockTransits, WINDOWS);
    expect(result.success).toBe(true);
  });

  it('Approve also approves the journal article of the sign (so the journal does not wait on auto-approve-transit)', async () => {
    const t = transitsTable({ updateResults: [{ data: [{ id: 'aries' }] }] });
    const blog = withTransits(t.table, DRAFT_ARTICLE);
    const result = await approveTransit('aries', mockTransits, WINDOWS);
    expect(result.success).toBe(true);
    expect(blog.query.eq).toHaveBeenCalledWith('zodiac_sign_tag', 'Aries');
    expect(blog.updateMock).toHaveBeenCalledWith({ status: 'approved' });
  });

  it('Approve all also approves the journal article of each pending sign', async () => {
    const t = transitsTable({ updateResults: [{ data: [{ id: 'aries' }] }] });
    const blog = withTransits(t.table, DRAFT_ARTICLE);
    await batchApproveAllTransits(mockTransits, WINDOWS);
    expect(blog.query.eq).toHaveBeenCalledWith('zodiac_sign_tag', 'Aries');
    expect(blog.updateMock).toHaveBeenCalledWith({ status: 'approved' });
  });

  it('only Approved cards can be undone: a Pending card is refused', async () => {
    const t = transitsTable();
    withTransits(t.table);
    const result = await undoApproval('aries', mockTransits, WINDOWS);
    expect(result.success).toBe(false);
    expect(t.update).not.toHaveBeenCalled();
  });

  it('undo all returns every Approved card, leaves Pending and Posted alone, and counts refusals', async () => {
    const t = transitsTable({
      updateResults: [{ data: [{ id: 'taurus' }] }, { data: [] }],
      rows: [{ id: 'gemini', status: 'published', social_posted_at: null, social_sending_at: '2026-10-26T11:59:30Z' }],
    });
    withTransits(t.table, APPROVED_ARTICLE);
    const all: ZodiacSignTransit[] = [
      ...mockTransits,
      { ...mockTransits[1], id: 'gemini', sign: 'Gemini', publishedAt: '2026-10-25T00:00:00.000Z' },
      { ...mockTransits[1], id: 'leo', sign: 'Leo', socialPostedAt: '2026-10-25T12:00:00Z' },
    ];
    const windows = [
      ...WINDOWS,
      { sign: 'Gemini', start_time: '2026-11-01T12:00:00Z', end_time: '2026-11-03T12:00:00Z' },
      { sign: 'Leo', start_time: '2026-10-25T12:00:00Z', end_time: '2026-10-28T12:00:00Z' },
    ];

    const result = await undoAllApproved(all, windows);

    expect(result).toMatchObject({ undone: 1, refused: 1 });
    expect(t.filters.map((f) => f[0])).toEqual(['eq:id,taurus', 'eq:id,gemini']);
    expect(result.updatedTransits.find((x) => x.id === 'taurus')?.status).toBe('pending');
    expect(result.updatedTransits.find((x) => x.id === 'gemini')?.status).toBe('published');
    expect(result.updatedTransits.find((x) => x.id === 'aries')?.status).toBe('pending');
    expect(result.updatedTransits.find((x) => x.id === 'leo')?.socialPostedAt).toBe('2026-10-25T12:00:00Z');
  });

  it('approve all approves only the Pending cards', async () => {
    const t = transitsTable({ updateResults: [{ data: [{ id: 'aries' }] }] });
    withTransits(t.table);

    const result = await batchApproveAllTransits(mockTransits, WINDOWS);

    expect(result.approved).toBe(1);
    expect(t.filters[0]).toContain('in:id,aries');
    expect(t.update.mock.calls[0][0]).toMatchObject({ status: 'published' });
    expect(t.update.mock.calls[0][0]).not.toHaveProperty('social_posted_at');
    expect(result.updatedTransits.find((x) => x.id === 'aries')?.status).toBe('published');
    // taurus was already approved: its approval time is untouched
    expect(result.updatedTransits.find((x) => x.id === 'taurus')?.publishedAt).toBe('2026-10-25T00:00:00.000Z');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('approve all with nothing pending writes nothing', async () => {
    const t = transitsTable();
    withTransits(t.table);
    const result = await batchApproveAllTransits([mockTransits[1]], WINDOWS);
    expect(result.approved).toBe(0);
    expect(t.update).not.toHaveBeenCalled();
  });

  it('updateTransitContent maps fields to snake_case but never writes status, published_at or social_posted_at', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ upsert: upsertMock } as unknown as ReturnType<typeof supabase.from>);

    const updates = {
      copy: 'New updated copy',
      transitTitle: 'New Title',
      transitAspect: 'New Aspect',
      powerHour: '10:00 AM EST',
      ritualTip: 'New ritual tip',
      hashtags: ['#TestTag'],
    };

    const result = await updateTransitContent('taurus', updates, mockTransits);

    expect(result.success).toBe(true);
    expect(result.updatedTransits.find((t) => t.id === 'taurus')?.copy).toBe('New updated copy');
    const payload = upsertMock.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        id: 'taurus',
        copy: 'New updated copy',
        transit_title: 'New Title',
        transit_aspect: 'New Aspect',
        power_hour: '10:00 AM EST',
        ritual_tip: 'New ritual tip',
        hashtags: ['#TestTag'],
      })
    );
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('published_at');
    expect(payload).not.toHaveProperty('social_posted_at');
    expect(upsertMock.mock.calls[0][1]).toEqual({ onConflict: 'id' });
  });
});

describe('transitService - Database Column Mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
