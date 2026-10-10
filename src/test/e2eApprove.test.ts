import { describe, it, expect, vi } from 'vitest';
import { approveTransit, sendMakeWebhook } from '../services/transitService';
import { supabase } from '../lib/supabase';
import { ZodiacSignTransit } from '../types';
import { blogPostsClient, DRAFT_ARTICLE } from './blogPostsMock';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('E2E Approval Flow, Make.com Webhook & Status Feedback', () => {
  const sampleTransit: ZodiacSignTransit = {
    id: 'gemini',
    sign: 'Gemini',
    symbol: '♊',
    element: 'Air',
    ruler: 'Mercury',
    dates: 'May 21 – Jun 20',
    transitTitle: 'Moon in Gemini',
    transitAspect: 'Mental Velocity',
    transit_period: 'Sep 30 – Oct 2',
    copy: 'Ideas spark across the network.',
    powerHour: '02:15 PM EST',
    ritualTip: 'Write three morning pages.',
    hashtags: ['#GeminiMoon'],
    status: 'pending',
    imageUrl: 'https://example.com/gemini.png',
  };

  it('verifies state (a): Successful approval with 200 webhook response', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const blog = blogPostsClient(DRAFT_ARTICLE);
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
      select: blog.select,
      update: blog.update,
    } as unknown as ReturnType<typeof supabase.from>);

    const originalFetch = global.fetch;
    const makeFetchSpy = vi.fn().mockResolvedValue(new Response('Accepted', { status: 200 }));
    global.fetch = makeFetchSpy;
    localStorage.setItem('moonday.makeWebhook', 'https://hook.us1.make.com/live-test-scenario');

    try {
      const result = await approveTransit('gemini', [sampleTransit]);

      // 1. Verify Supabase was called with status 'published'
      expect(upsertMock).toHaveBeenCalled();
      const callArg = upsertMock.mock.calls[0][0];
      expect(callArg.status).toBe('published');
      expect(callArg.id).toBe('gemini');
      expect(callArg.published_at).toBeDefined();

      // 2. Verify webhook fired to Make.com with transit payload
      expect(makeFetchSpy).toHaveBeenCalledWith(
        'https://hook.us1.make.com/live-test-scenario',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"event":"transit.approved"'),
        })
      );

      // 3. Verify confirmation message displays state (a) exactly
      expect(result.success).toBe(true);
      expect(result.webhookSuccess).toBe(true);
      expect(result.feedbackType).toBe('success');
      expect(result.feedbackMessage).toBe('Approved. Sent to Make.com for syndication.');
    } finally {
      global.fetch = originalFetch;
      localStorage.removeItem('moonday.makeWebhook');
    }
  });

  it('verifies state (b): Approval saved in DB but Make.com webhook failed to respond', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const blog = blogPostsClient(DRAFT_ARTICLE);
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
      select: blog.select,
      update: blog.update,
    } as unknown as ReturnType<typeof supabase.from>);

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));
    localStorage.setItem('moonday.makeWebhook', 'https://hook.us1.make.com/unreachable-endpoint');

    try {
      const result = await approveTransit('gemini', [sampleTransit]);

      // 1. Status was saved to Supabase
      expect(upsertMock).toHaveBeenCalled();

      // 2. Webhook failed
      expect(result.success).toBe(true);
      expect(result.webhookSuccess).toBe(false);

      // 3. Verify confirmation message displays state (b) exactly
      expect(result.feedbackType).toBe('warning');
      expect(result.feedbackMessage).toBe(
        'Approval saved but Make.com webhook did not respond. Check your automation.'
      );
    } finally {
      global.fetch = originalFetch;
      localStorage.removeItem('moonday.makeWebhook');
    }
  });

  it('verifies state (c): Database failure produces clear error message', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: { message: 'Network connection to Supabase lost' } });
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
    } as unknown as ReturnType<typeof supabase.from>);

    await expect(approveTransit('gemini', [sampleTransit])).rejects.toThrow(
      'Failed to approve transit in Supabase: Network connection to Supabase lost'
    );
  });
});
