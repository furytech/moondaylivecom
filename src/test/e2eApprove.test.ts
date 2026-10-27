import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { approveTransit, undoApproval } from '../services/transitService';
import { supabase } from '../lib/supabase';
import { ZodiacSignTransit } from '../types';
import { blogPostsClient, DRAFT_ARTICLE, APPROVED_ARTICLE } from './blogPostsMock';
import { transitsTable } from './transitsTableMock';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Gemini starts Wed Oct 28 2026 at 8:15 AM EDT, so it posts at 8:00 AM ET.
const WINDOWS = [{ sign: 'Gemini', start_time: '2026-10-28T12:15:00Z', end_time: '2026-10-30T20:00:00Z' }];

describe('E2E approval: scheduled confirmation, no Make.com ping', () => {
  const sampleTransit: ZodiacSignTransit = {
    id: 'gemini',
    sign: 'Gemini',
    symbol: '♊',
    element: 'Air',
    ruler: 'Mercury',
    dates: 'May 21 – Jun 20',
    transitTitle: 'Moon in Gemini',
    transitAspect: 'Mental Velocity',
    transit_period: 'Oct 28 – Oct 30',
    copy: 'Ideas spark across the network.',
    powerHour: '02:15 PM EST',
    ritualTip: 'Write three morning pages.',
    hashtags: ['#GeminiMoon'],
    status: 'pending',
    imageUrl: 'https://example.com/gemini.png',
  };

  const originalFetch = global.fetch;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-26T12:00:00Z') });
    fetchSpy = vi.fn().mockResolvedValue(new Response('Accepted', { status: 200 }));
    global.fetch = fetchSpy as any;
    // A webhook URL saved the old way must be ignored now
    localStorage.setItem('moonday.makeWebhook', 'https://hook.us1.make.com/live-test-scenario');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
    localStorage.removeItem('moonday.makeWebhook');
  });

  it('approve -> Approved, a confirmation with the scheduled time, and no request to Make.com', async () => {
    const t = transitsTable({ updateResults: [{ data: [{ id: 'gemini' }] }] });
    const blog = blogPostsClient(DRAFT_ARTICLE);
    vi.mocked(supabase.from).mockImplementation((name: string) =>
      (name === 'transits' ? t.table : { select: blog.select, update: blog.update }) as any
    );

    const result = await approveTransit('gemini', [sampleTransit], WINDOWS);

    expect(t.update.mock.calls[0][0]).toMatchObject({ status: 'published' });
    expect(t.update.mock.calls[0][0]).not.toHaveProperty('social_posted_at');
    expect(result.success).toBe(true);
    expect(result.feedbackType).toBe('success');
    expect(result.feedbackMessage).toBe('Approved. Posts Wed 8:00 AM ET.');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('a database failure still produces a clear error message', async () => {
    const t = transitsTable({ updateResults: [{ error: { message: 'Network connection to Supabase lost' } }] });
    vi.mocked(supabase.from).mockReturnValue(t.table as any);

    await expect(approveTransit('gemini', [sampleTransit], WINDOWS)).rejects.toThrow(
      'Failed to approve transit in Supabase: Network connection to Supabase lost'
    );
  });

  it('approve then undo returns the card to Pending, and neither step pings Make.com', async () => {
    const approve = transitsTable({ updateResults: [{ data: [{ id: 'gemini' }] }] });
    const blog = blogPostsClient(DRAFT_ARTICLE);
    vi.mocked(supabase.from).mockImplementation((name: string) =>
      (name === 'transits' ? approve.table : { select: blog.select, update: blog.update }) as any
    );
    const approved = await approveTransit('gemini', [sampleTransit], WINDOWS);

    const undo = transitsTable({ updateResults: [{ data: [{ id: 'gemini' }] }] });
    const blog2 = blogPostsClient(APPROVED_ARTICLE);
    vi.mocked(supabase.from).mockImplementation((name: string) =>
      (name === 'transits' ? undo.table : { select: blog2.select, update: blog2.update }) as any
    );
    const undone = await undoApproval('gemini', approved.updatedTransits, WINDOWS);

    expect(undone.success).toBe(true);
    expect(undone.updatedTransits[0].status).toBe('pending');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('Mission Control no longer has the webhook settings, the ping, or the "did not respond" notice', () => {
    const sources = ['src/pages/admin/MissionControl.tsx', 'src/services/transitService.ts', 'src/components/TransitReviewPanel.tsx', 'src/components/TransitDetailModal.tsx']
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    expect(sources).not.toMatch(/did not respond/i);
    expect(sources).not.toMatch(/sendMakeWebhook|VITE_MAKE_WEBHOOK_URL|moonday\.makeWebhook|make_webhook_url/);
    expect(sources).not.toMatch(/Make\.com Webhook/);
  });
});
