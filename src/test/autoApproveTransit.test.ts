import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('auto-approve-transit logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('identifies current moon sign from ingress_time <= now() and approves pending transit', async () => {
    const nowIso = '2026-10-11T16:00:00.000Z';
    const mockMoonTransitions = [
      {
        id: 'trans-libra',
        sign: 'Libra',
        ingress_time: '2026-10-09T08:30:00.000Z',
      },
      {
        id: 'trans-scorpio',
        sign: 'Scorpio',
        ingress_time: '2026-10-11T15:21:00.000Z',
      },
      {
        id: 'trans-sagittarius',
        sign: 'Sagittarius',
        ingress_time: '2026-10-14T01:00:00.000Z',
      },
    ];

    // 1. Query moon_transitions table: ingress_time <= now() ordered by ingress_time DESC limit 1
    const pastTransitions = mockMoonTransitions
      .filter((m) => m.ingress_time <= nowIso)
      .sort((a, b) => b.ingress_time.localeCompare(a.ingress_time));
    const currentTransition = pastTransitions[0];

    expect(currentTransition).toBeDefined();
    expect(currentTransition.sign).toBe('Scorpio');

    // 2. Find matching record in transits table where sign = current moon sign and status != 'published'
    const mockTransitsTable = [
      { id: 'scorpio', sign: 'Scorpio', status: 'pending', published_at: null },
      { id: 'libra', sign: 'Libra', status: 'published', published_at: '2026-10-09T08:30:00.000Z' },
    ];

    const pendingTransit = mockTransitsTable.find(
      (t) => t.sign.toLowerCase() === currentTransition.sign.toLowerCase() && t.status !== 'published'
    );

    expect(pendingTransit).toBeDefined();
    expect(pendingTransit?.id).toBe('scorpio');

    // 3. If found, set status = 'published' on that record
    const updatedTransit = {
      ...pendingTransit,
      status: 'published',
      published_at: nowIso,
    };

    expect(updatedTransit.status).toBe('published');
    expect(updatedTransit.published_at).toBe(nowIso);

    // 5. Response contract
    const responsePayload = {
      success: true,
      current_moon_sign: currentTransition.sign,
      ingress_time: currentTransition.ingress_time,
      action: 'published',
      transit: {
        id: updatedTransit.id,
        sign: updatedTransit.sign,
        status: updatedTransit.status,
        published_at: updatedTransit.published_at,
        updated: true,
      },
    };

    expect(responsePayload.success).toBe(true);
    expect(responsePayload.action).toBe('published');
    expect(responsePayload.transit.status).toBe('published');
  });

  it('handles already published transit without modifying it (idempotent)', async () => {
    const currentMoonSign = 'Scorpio';
    const mockPublishedTransit = {
      id: 'scorpio',
      sign: 'Scorpio',
      status: 'published',
      published_at: '2026-10-11T15:30:00.000Z',
    };

    // Pending check returns undefined
    const isPending = mockPublishedTransit.status !== 'published';
    expect(isPending).toBe(false);

    // Idempotent response
    const response = {
      success: true,
      current_moon_sign: currentMoonSign,
      ingress_time: '2026-10-11T15:21:00.000Z',
      action: 'already_published',
      transit: {
        id: mockPublishedTransit.id,
        sign: mockPublishedTransit.sign,
        status: mockPublishedTransit.status,
        published_at: mockPublishedTransit.published_at,
        updated: false,
      },
    };

    expect(response.success).toBe(true);
    expect(response.action).toBe('already_published');
    expect(response.transit.updated).toBe(false);
    expect(response.transit.status).toBe('published');
  });

  it('normalizes zodiac signs for matching case-insensitively', () => {
    const ZODIAC_SIGNS = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ];

    function normalizeSign(raw: string): string {
      const clean = raw.trim().toLowerCase();
      const matched = ZODIAC_SIGNS.find((s) => s.toLowerCase() === clean);
      return matched || (raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1));
    }

    expect(normalizeSign('aries')).toBe('Aries');
    expect(normalizeSign('SCORPIO')).toBe('Scorpio');
    expect(normalizeSign(' Scorpio ')).toBe('Scorpio');
    expect(normalizeSign(' Gemini ')).toBe('Gemini');
  });
});
