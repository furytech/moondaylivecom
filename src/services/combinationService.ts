import { supabase } from '../lib/supabase';
import { CombinationProfile } from '../types';

const SIGN_ELEMENTS: Record<string, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  Aries: 'Fire',
  Leo: 'Fire',
  Sagittarius: 'Fire',
  Taurus: 'Earth',
  Virgo: 'Earth',
  Capricorn: 'Earth',
  Gemini: 'Air',
  Libra: 'Air',
  Aquarius: 'Air',
  Cancer: 'Water',
  Scorpio: 'Water',
  Pisces: 'Water',
};

const SIGN_KEYWORDS: Record<string, { solar: string; lunar: string; shadow: string }> = {
  Aries: {
    solar: 'Dynamic initiative, pioneering spirit, and courageous leadership.',
    lunar: 'Instinctive, fast-acting emotional processing, and passion for new starts.',
    shadow: 'Impatience and reactive defensiveness when progress stalls.',
  },
  Taurus: {
    solar: 'Steadfast persistence, sensory mastery, and value creation.',
    lunar: 'Grounded emotional stability, craving comfort, security, and tranquility.',
    shadow: 'Resistance to sudden shifts and attachment to comfort zones.',
  },
  Gemini: {
    solar: 'Intellectual agility, curiosity, and versatile communication.',
    lunar: 'Mentally processing feelings through dialogue, wit, and connection.',
    shadow: 'Scattered emotional focus and overthinking instinctual needs.',
  },
  Cancer: {
    solar: 'Protective devotion, intuitive wisdom, and home sanctuary building.',
    lunar: 'Deep oceanic empathy, protective instincts, and cyclical emotional tides.',
    shadow: 'Retreating into emotional shells and holding onto past grievances.',
  },
  Leo: {
    solar: 'Creative radiance, magnanimous confidence, and heart-centered warmth.',
    lunar: 'Generous emotional warmth, needing authentic appreciation and loyalty.',
    shadow: 'Vulnerability to bruised pride and craving external validation.',
  },
  Virgo: {
    solar: 'Analytical refinement, practical devotion, and system optimization.',
    lunar: 'Processing feelings through organization, mindful discernment, and service.',
    shadow: 'Over-criticizing emotional imperfections and nervous perfectionism.',
  },
  Libra: {
    solar: 'Diplomatic grace, aesthetic equilibrium, and relational harmony.',
    lunar: 'Craving emotional peace, mutual respect, and reciprocal partnerships.',
    shadow: 'Indecision and sacrificing authentic needs to maintain external peace.',
  },
  Scorpio: {
    solar: 'Transformative power, penetrating focus, and raw authenticity.',
    lunar: 'Intense psychological depth, fierce loyalty, and alchemical healing.',
    shadow: 'Suspicion, emotional guarding, and fear of vulnerability.',
  },
  Sagittarius: {
    solar: 'Expansive vision, philosophical optimism, and quest for truth.',
    lunar: 'Processing emotions through freedom, humor, travel, and wide horizons.',
    shadow: 'Restlessness and bypassing uncomfortable emotions with toxic positivity.',
  },
  Capricorn: {
    solar: 'Architectural mastery, enduring ambition, and structural integrity.',
    lunar: 'Disciplined emotional maturity, self-sufficiency, and steadfast resilience.',
    shadow: 'Bottling emotions beneath stoic duty and harsh self-reliance.',
  },
  Aquarius: {
    solar: 'Visionary innovation, humanitarian ideals, and individual sovereignty.',
    lunar: 'Objective emotional perspective, valuing truth, independence, and solidarity.',
    shadow: 'Detachment from immediate personal intimacy and abstracting feelings.',
  },
  Pisces: {
    solar: 'Mystic imagination, boundless compassion, and transcendent artistry.',
    lunar: 'Deeply empathic, porous emotional boundaries, and artistic sensitivity.',
    shadow: 'Escapism, absorbing collective grief, and blurring energetic boundaries.',
  },
};

/**
 * Generates an archetype title and comprehensive synthesis for any of the 144 Sun/Moon combinations.
 */
export function generateDefaultCombinationProfile(sunSign: string, moonSign: string): CombinationProfile {
  const sunKey = sunSign in SIGN_KEYWORDS ? sunSign : 'Aries';
  const moonKey = moonSign in SIGN_KEYWORDS ? moonSign : 'Aries';

  const sunData = SIGN_KEYWORDS[sunKey];
  const moonData = SIGN_KEYWORDS[moonKey];
  const sunElement = SIGN_ELEMENTS[sunKey] || 'Fire';
  const moonElement = SIGN_ELEMENTS[moonKey] || 'Water';

  const combinationTitle = `${sunSign} Sun • ${moonSign} Moon — The ${getArchetypeName(sunSign, moonSign)}`;
  const solarEssence = `Outward Expression: Driven by ${sunSign}'s ${sunData.solar.toLowerCase()}`;
  const lunarEssence = `Inner Sanctuary: Anchored in ${moonSign}'s ${moonData.lunar.toLowerCase()}`;
  const combinationSynthesis = `Your conscious life force (${sunSign} Sun) operates in harmony with your instinctual emotional core (${moonSign} Moon). Where ${sunSign} illuminates your outer purpose and ambitions in the ${sunElement} realm, ${moonSign} provides the hidden gravitational foundation in ${moonElement}. When you integrate these energies, you bridge outward ambition with deep emotional fulfillment.`;

  const defaultBehaviors = [
    `Consciously projects ${sunSign} vitality while instinctually seeking ${moonSign} comfort.`,
    `Processes unexpected stress through ${moonSign}'s subconscious emotional lens.`,
    `Achieves highest productivity when ${sunSign} goals honor ${moonSign}'s emotional rhythms.`,
    `Balances ${sunElement} outward drive with ${moonElement} internal resilience.`,
  ];

  const shadowPattern = `Under extreme exhaustion, you may alternate between ${sunData.shadow.toLowerCase()} and ${moonData.shadow.toLowerCase()}`;
  const upgradeTeaser = `Unlock your Sovereign Daily Blueprint to receive personalized transit alerts tuned to your ${sunSign}/${moonSign} synergy.`;

  return {
    sun_sign: sunSign,
    moon_sign: moonSign,
    combination_title: combinationTitle,
    solar_essence: solarEssence,
    lunar_essence: lunarEssence,
    combination_synthesis: combinationSynthesis,
    default_behaviors: defaultBehaviors,
    shadow_pattern: shadowPattern,
    upgrade_teaser: upgradeTeaser,
    generated_at: new Date().toISOString(),
  };
}

function getArchetypeName(sun: string, moon: string): string {
  if (sun === moon) return `Double ${sun} Sovereign`;
  const sunElement = SIGN_ELEMENTS[sun] || 'Fire';
  const moonElement = SIGN_ELEMENTS[moon] || 'Water';

  if (sunElement === moonElement) return `Harmonic ${sunElement} Catalyst`;
  if ((sunElement === 'Fire' && moonElement === 'Air') || (sunElement === 'Air' && moonElement === 'Fire')) {
    return 'Electric Luminary';
  }
  if ((sunElement === 'Earth' && moonElement === 'Water') || (sunElement === 'Water' && moonElement === 'Earth')) {
    return 'Fertile Alchemist';
  }
  return `${sun}-${moon} Integrator`;
}

/**
 * Fetch matching combination profile from Supabase table `combination_profiles`.
 * Falls back to dynamic astronomical generation if row is not yet seeded.
 */
export async function fetchCombinationProfile(
  sunSign: string,
  moonSign: string
): Promise<CombinationProfile> {
  const normalizedSun = sunSign.trim();
  const normalizedMoon = moonSign.trim();

  if (import.meta.env.VITE_SUPABASE_URL) {
    try {
      const { data, error } = await supabase
        .from('combination_profiles')
        .select('*')
        .eq('sun_sign', normalizedSun)
        .eq('moon_sign', normalizedMoon)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          sun_sign: data.sun_sign,
          moon_sign: data.moon_sign,
          combination_title: data.combination_title,
          solar_essence: data.solar_essence,
          lunar_essence: data.lunar_essence,
          combination_synthesis: data.combination_synthesis,
          default_behaviors: Array.isArray(data.default_behaviors) ? data.default_behaviors : [],
          shadow_pattern: data.shadow_pattern,
          upgrade_teaser: data.upgrade_teaser,
          generated_at: data.generated_at,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    } catch (err) {
      console.warn('[combinationService] Error fetching combination profile from DB, falling back to generator:', err);
    }
  }

  return generateDefaultCombinationProfile(normalizedSun, normalizedMoon);
}

/**
 * Persists or updates a combination profile record in Supabase.
 */
export async function upsertCombinationProfile(
  profile: CombinationProfile
): Promise<{ success: boolean; data?: CombinationProfile; error?: string }> {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    return { success: true, data: profile };
  }

  try {
    const payload = {
      sun_sign: profile.sun_sign,
      moon_sign: profile.moon_sign,
      combination_title: profile.combination_title,
      solar_essence: profile.solar_essence,
      lunar_essence: profile.lunar_essence,
      combination_synthesis: profile.combination_synthesis,
      default_behaviors: profile.default_behaviors,
      shadow_pattern: profile.shadow_pattern || null,
      upgrade_teaser: profile.upgrade_teaser || null,
      generated_at: profile.generated_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('combination_profiles')
      .upsert(payload, { onConflict: 'sun_sign,moon_sign' })
      .select()
      .single();

    if (error) {
      console.error('[combinationService] Upsert error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as CombinationProfile };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during combination profile upsert';
    return { success: false, error: message };
  }
}
