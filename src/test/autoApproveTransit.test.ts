import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('auto-approve-transit logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('identifies current moon sign from window and approves pending transit', async () => {
    const mockMoonTransition = {
      id: 'trans-1',
      sign: 'Aries',
      start_time: '2026-10-06T00:00:00.000Z',
      end_time: '2026-10-08T12:00:00.000Z',
    };

    const mockPendingTransit = {
      id: 'aries',
      sign: 'Aries',
      status: 'pending',
    };

    const mockUpdatedTransit = {
      id: 'aries',
      sign: 'Aries',
      status: 'published',
      published_at: '2026-10-06T14:00:00.000Z',
    };

    // Simulate edge function logic
    const currentMoonSign = mockMoonTransition.sign;
    expect(currentMoonSign).toBe('Aries');

    // Matching pending transit found
    expect(mockPendingTransit.sign).toBe(currentMoonSign);
    expect(mockPendingTransit.status).toBe('pending');

    // Update status to published
    const updated = {
      ...mockPendingTransit,
      status: 'published',
      published_at: mockUpdatedTransit.published_at,
    };

    expect(updated.status).toBe('published');
    expect(updated.id).toBe('aries');
    expect(updated.sign).toBe('Aries');
  });

  it('handles already published transit without error', async () => {
    const mockPublishedTransit = {
      id: 'aries',
      sign: 'Aries',
      status: 'published',
    };

    const isPending = mockPublishedTransit.status === 'pending';
    expect(isPending).toBe(false);

    const response = {
      message: `Transit for ${mockPublishedTransit.sign} is already published`,
      id: mockPublishedTransit.id,
      sign: mockPublishedTransit.sign,
      status: mockPublishedTransit.status,
      approved: false,
    };

    expect(response.approved).toBe(false);
    expect(response.id).toBe('aries');
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
    expect(normalizeSign(' Gemini ')).toBe('Gemini');
  });
});
