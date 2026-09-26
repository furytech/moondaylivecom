import { describe, it, expect, vi, beforeEach } from 'vitest';
import { approveTransit, batchApproveAllTransits, updateTransitContent } from '../services/transitService';
import { supabase } from '../lib/supabase';
import { ZodiacSignTransit } from '../types';

vi.mock('../lib/supabase', () => {
  const updateMock = vi.fn();
  const eqMock = vi.fn();
  const inMock = vi.fn();

  return {
    supabase: {
      from: vi.fn(() => ({
        update: updateMock,
      })),
    },
    updateMock,
    eqMock,
    inMock,
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

  it('approveTransit publishes a pending transit with exact database column names', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

    vi.mocked(supabase.from).mockReturnValue({
      update: updateMock,
    } as unknown as ReturnType<typeof supabase.from>);

    const result = await approveTransit('aries', mockTransits);

    expect(result.success).toBe(true);
    expect(result.updatedTransits.find((t) => t.id === 'aries')?.status).toBe('published');

    if (import.meta.env.VITE_SUPABASE_URL) {
      expect(supabase.from).toHaveBeenCalledWith('transits');
      expect(updateMock).toHaveBeenCalledTimes(1);
      const payload = updateMock.mock.calls[0][0];
      expect(payload).toHaveProperty('status', 'published');
      expect(payload).toHaveProperty('published_at');
      expect(payload).toHaveProperty('updated_at');
      expect(eqMock).toHaveBeenCalledWith('id', 'aries');
    }
  });

  it('approveTransit revokes a published transit back to pending', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

    vi.mocked(supabase.from).mockReturnValue({
      update: updateMock,
    } as unknown as ReturnType<typeof supabase.from>);

    const result = await approveTransit('taurus', mockTransits);

    expect(result.success).toBe(true);
    const taurus = result.updatedTransits.find((t) => t.id === 'taurus');
    expect(taurus?.status).toBe('pending');
    expect(taurus?.publishedAt).toBeNull();

    if (import.meta.env.VITE_SUPABASE_URL) {
      const payload = updateMock.mock.calls[0][0];
      expect(payload).toHaveProperty('status', 'pending');
      expect(payload.published_at).toBeNull();
    }
  });

  it('batchApproveAllTransits marks all transits as published with database timestamp', async () => {
    const inMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ in: inMock });

    vi.mocked(supabase.from).mockReturnValue({
      update: updateMock,
    } as unknown as ReturnType<typeof supabase.from>);

    const result = await batchApproveAllTransits(mockTransits);

    expect(result.success).toBe(true);
    expect(result.updatedTransits.every((t) => t.status === 'published')).toBe(true);

    if (import.meta.env.VITE_SUPABASE_URL) {
      expect(supabase.from).toHaveBeenCalledWith('transits');
      const payload = updateMock.mock.calls[0][0];
      expect(payload.status).toBe('published');
      expect(payload.published_at).toBeDefined();
      expect(inMock).toHaveBeenCalledWith('id', ['aries', 'taurus']);
    }
  });

  it('updateTransitContent maps transitTitle, transitAspect, powerHour, ritualTip, hashtags to snake_case db columns', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

    vi.mocked(supabase.from).mockReturnValue({
      update: updateMock,
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
      const payload = updateMock.mock.calls[0][0];
      expect(payload).toEqual(
        expect.objectContaining({
          copy: 'New updated copy',
          transit_title: 'New Title',
          transit_aspect: 'New Aspect',
          power_hour: '10:00 AM EST',
          ritual_tip: 'New ritual tip',
          hashtags: ['#TestTag'],
        })
      );
      expect(eqMock).toHaveBeenCalledWith('id', 'aries');
    }
  });
});
