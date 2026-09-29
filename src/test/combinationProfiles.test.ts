import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateSunSign, calculateNatalSigns } from '../lib/moonSign';
import { 
  generateDefaultCombinationProfile, 
  fetchCombinationProfile, 
  upsertCombinationProfile 
} from '../services/combinationService';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => {
  const upsertMock = vi.fn();
  const selectMock = vi.fn();
  const eqMock = vi.fn();

  return {
    supabase: {
      from: vi.fn(() => ({
        upsert: upsertMock,
        select: selectMock,
      })),
    },
    upsertMock,
    selectMock,
    eqMock,
  };
});

describe('Natal Calculation Engine (Sun & Moon)', () => {
  it('correctly calculates Tropical Sun signs across zodiac seasons', () => {
    // Aries: ~March 25
    expect(calculateSunSign(new Date('1990-03-25T12:00:00Z'))).toBe('Aries');
    // Taurus: ~April 25
    expect(calculateSunSign(new Date('1990-04-25T12:00:00Z'))).toBe('Taurus');
    // Gemini: ~June 10
    expect(calculateSunSign(new Date('1990-06-10T12:00:00Z'))).toBe('Gemini');
    // Cancer: ~July 10
    expect(calculateSunSign(new Date('1990-07-10T12:00:00Z'))).toBe('Cancer');
    // Leo: ~August 10
    expect(calculateSunSign(new Date('1990-08-10T12:00:00Z'))).toBe('Leo');
    // Virgo: ~September 10
    expect(calculateSunSign(new Date('1990-09-10T12:00:00Z'))).toBe('Virgo');
    // Libra: ~October 10
    expect(calculateSunSign(new Date('1990-10-10T12:00:00Z'))).toBe('Libra');
    // Scorpio: ~November 10
    expect(calculateSunSign(new Date('1990-11-10T12:00:00Z'))).toBe('Scorpio');
    // Sagittarius: ~December 10
    expect(calculateSunSign(new Date('1990-12-10T12:00:00Z'))).toBe('Sagittarius');
    // Capricorn: ~January 10
    expect(calculateSunSign(new Date('1990-01-10T12:00:00Z'))).toBe('Capricorn');
    // Aquarius: ~February 10
    expect(calculateSunSign(new Date('1990-02-10T12:00:00Z'))).toBe('Aquarius');
    // Pisces: ~March 05
    expect(calculateSunSign(new Date('1990-03-05T12:00:00Z'))).toBe('Pisces');
  });

  it('accepts string date format (YYYY-MM-DD)', () => {
    expect(calculateSunSign('1995-10-31')).toBe('Scorpio');
    expect(calculateSunSign('1988-07-04')).toBe('Cancer');
  });

  it('calculates combined natal signs (Sun + Moon)', async () => {
    const natal = await calculateNatalSigns('1992-08-15');
    expect(natal.sunSign).toBe('Leo');
    expect(typeof natal.moonSign).toBe('string');
    expect(natal.moonResult.element).toBeDefined();
    expect(natal.moonResult.traits.length).toBeGreaterThan(0);
  });
});

describe('Combination Profiles Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a complete 10-field archetype profile for any Sun/Moon pairing', () => {
    const profile = generateDefaultCombinationProfile('Scorpio', 'Aries');

    expect(profile.sun_sign).toBe('Scorpio');
    expect(profile.moon_sign).toBe('Aries');
    expect(profile.combination_title).toContain('Scorpio Sun • Aries Moon');
    expect(profile.solar_essence).toContain('Scorpio');
    expect(profile.lunar_essence).toContain('Aries');
    expect(profile.combination_synthesis).toBeDefined();
    expect(Array.isArray(profile.default_behaviors)).toBe(true);
    expect(profile.default_behaviors.length).toBeGreaterThan(0);
    expect(profile.shadow_pattern).toBeDefined();
    expect(profile.upgrade_teaser).toBeDefined();
    expect(profile.generated_at).toBeDefined();
  });

  it('fetches combination profile from Supabase when found', async () => {
    const mockRow = {
      id: 'uuid-123',
      sun_sign: 'Leo',
      moon_sign: 'Sagittarius',
      combination_title: 'Leo Sun • Sagittarius Moon — The Luminary Archer',
      solar_essence: 'Radiant Fire',
      lunar_essence: 'Expansive Horizons',
      combination_synthesis: 'High fire synthesis.',
      default_behaviors: ['Bold visionary'],
      shadow_pattern: 'Restlessness',
      upgrade_teaser: 'Upgrade now',
      generated_at: '2026-09-28T12:00:00Z',
      created_at: '2026-09-28T12:00:00Z',
      updated_at: '2026-09-28T12:00:00Z',
    };

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockRow, error: null });
    const eqMoonMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqSunMock = vi.fn().mockReturnValue({ eq: eqMoonMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqSunMock });

    vi.mocked(supabase.from).mockReturnValue({
      select: selectMock,
    } as any);

    const profile = await fetchCombinationProfile('Leo', 'Sagittarius');
    expect(profile.combination_title).toBe('Leo Sun • Sagittarius Moon — The Luminary Archer');
    expect(profile.id).toBe('uuid-123');
  });

  it('falls back to astronomical generator when record is not found', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqMoonMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqSunMock = vi.fn().mockReturnValue({ eq: eqMoonMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqSunMock });

    vi.mocked(supabase.from).mockReturnValue({
      select: selectMock,
    } as any);

    const profile = await fetchCombinationProfile('Cancer', 'Pisces');
    expect(profile.sun_sign).toBe('Cancer');
    expect(profile.moon_sign).toBe('Pisces');
    expect(profile.combination_title).toBeDefined();
  });

  it('upsertCombinationProfile handles Supabase upsert', async () => {
    const sample = generateDefaultCombinationProfile('Taurus', 'Virgo');
    const singleMock = vi.fn().mockResolvedValue({ data: { ...sample, id: 'upserted-id' }, error: null });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const upsertMock = vi.fn().mockReturnValue({ select: selectMock });

    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
    } as any);

    const res = await upsertCombinationProfile(sample);
    expect(res.success).toBe(true);
    expect(res.data?.sun_sign).toBe('Taurus');
  });
});

describe('Batch Combination Generator (Gemini API & Parser)', () => {
  it('generates system and user prompts matching astrological metadata', async () => {
    const { buildSystemPrompt, buildUserPrompt } = await import('../../scripts/batch-generate-combinations');
    const systemPrompt = buildSystemPrompt();
    expect(systemPrompt).toContain('Moonday Live');
    expect(systemPrompt).toContain('psychologically penetrating');

    const userPrompt = buildUserPrompt('Scorpio', 'Aries');
    expect(userPrompt).toContain('Sun Sign: Scorpio');
    expect(userPrompt).toContain('Moon Sign: Aries');
    expect(userPrompt).toContain('Pluto / Mars');
    expect(userPrompt).toContain('Water');
  });

  it('parses clean and markdown-wrapped JSON payloads correctly', async () => {
    const { parseAndValidateResponse } = await import('../../scripts/batch-generate-combinations');
    const mockJson = JSON.stringify({
      combination_title: 'Scorpio Sun • Aries Moon — The Primal Catalyst',
      solar_essence: 'Outward Expression: Scorpio drive.',
      lunar_essence: 'Inner Sanctuary: Aries instincts.',
      combination_synthesis: 'High impact synthesis.',
      default_behaviors: ['b1', 'b2', 'b3', 'b4', 'b5'],
      shadow_pattern: 'Impatience under stress.',
      upgrade_teaser: 'Upgrade teaser text.',
    });

    const wrappedInMarkdown = `\`\`\`json\n${mockJson}\n\`\`\``;
    const parsed = parseAndValidateResponse(wrappedInMarkdown, 'Scorpio', 'Aries');

    expect(parsed.combination_title).toBe('Scorpio Sun • Aries Moon — The Primal Catalyst');
    expect(parsed.default_behaviors.length).toBe(5);
    expect(parsed.sun_sign).toBe('Scorpio');
    expect(parsed.moon_sign).toBe('Aries');
  });

  it('normalizes behavioral array to exactly 5 items when fewer are returned', async () => {
    const { parseAndValidateResponse } = await import('../../scripts/batch-generate-combinations');
    const partialJson = JSON.stringify({
      combination_title: 'Gemini Sun • Taurus Moon — The Articulate Builder',
      solar_essence: 'Gemini agility.',
      lunar_essence: 'Taurus grounding.',
      combination_synthesis: 'Air and earth synergy.',
      default_behaviors: ['Communicates clearly', 'Seeks material security'],
      shadow_pattern: 'Restlessness meets stubbornness.',
      upgrade_teaser: 'Upgrade to daily blueprint.',
    });

    const parsed = parseAndValidateResponse(partialJson, 'Gemini', 'Taurus');
    expect(parsed.default_behaviors.length).toBe(5);
    expect(parsed.default_behaviors[0]).toBe('Communicates clearly');
    expect(parsed.default_behaviors[1]).toBe('Seeks material security');
  });

  it('runs batch dry-run mode smoothly', async () => {
    const { runBatchGeneration } = await import('../../scripts/batch-generate-combinations');
    const result = await runBatchGeneration({
      dryRun: true,
      limit: 3,
      delayMs: 0,
    });

    expect(result.total).toBe(3);
    expect(result.successful).toBe(3);
    expect(result.failed).toBe(0);
  });
});
