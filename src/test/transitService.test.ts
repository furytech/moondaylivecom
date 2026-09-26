import { describe, it, expect, vi, beforeEach } from 'vitest';
import { approveTransit, batchApproveAllTransits, updateTransitContent, fetchTransits, toDbRow } from '../services/transitService';
import { supabase } from '../lib/supabase';
import { ZodiacSignTransit } from '../types';

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

    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
    } as unknown as ReturnType<typeof supabase.from>);

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

    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
    } as unknown as ReturnType<typeof supabase.from>);

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

    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
    } as unknown as ReturnType<typeof supabase.from>);

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

  it('toDbRow outputs all required columns matching PostgreSQL transits schema', () => {
    const transit = mockTransits[0];
    const row = toDbRow(transit, { status: 'published', published_at: '2026-09-26T12:00:00Z' });

    expect(row).toHaveProperty('id', 'aries');
    expect(row).toHaveProperty('sign', 'Aries');
    expect(row).toHaveProperty('symbol', '♈');
    expect(row).toHaveProperty('element', 'Fire');
    expect(row).toHaveProperty('ruler', 'Mars');
    expect(row).toHaveProperty('dates', 'Mar 21 – Apr 19');
    expect(row).toHaveProperty('transit_title', 'Moon in Aries');
    expect(row).toHaveProperty('transit_aspect', 'Cardinal Ignition');
    expect(row).toHaveProperty('copy', 'A high-octane charge pulses.');
    expect(row).toHaveProperty('power_hour', '08:15 AM EST');
    expect(row).toHaveProperty('ritual_tip', 'Burn frankincense.');
    expect(row).toHaveProperty('hashtags', ['#AriesSeason']);
    expect(row).toHaveProperty('status', 'published');
    expect(row).toHaveProperty('published_at', '2026-09-26T12:00:00Z');
    expect(row).toHaveProperty('social_posted_at', null);
    expect(row).toHaveProperty('created_at');
    expect(row).toHaveProperty('updated_at');
  });
});
