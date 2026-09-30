import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CombinationProfile } from '../src/types';

// ======================================================================
// 1. ZODIAC CONSTANTS & ASTROLOGICAL METADATA
// ======================================================================

export const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export interface SignMetadata {
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  ruler: string;
  modality: 'Cardinal' | 'Fixed' | 'Mutable';
  polarity: 'Diurnal (Yang)' | 'Nocturnal (Yin)';
}

export const SIGN_METADATA: Record<ZodiacSign, SignMetadata> = {
  Aries: { element: 'Fire', ruler: 'Mars', modality: 'Cardinal', polarity: 'Diurnal (Yang)' },
  Taurus: { element: 'Earth', ruler: 'Venus', modality: 'Fixed', polarity: 'Nocturnal (Yin)' },
  Gemini: { element: 'Air', ruler: 'Mercury', modality: 'Mutable', polarity: 'Diurnal (Yang)' },
  Cancer: { element: 'Water', ruler: 'The Moon', modality: 'Cardinal', polarity: 'Nocturnal (Yin)' },
  Leo: { element: 'Fire', ruler: 'The Sun', modality: 'Fixed', polarity: 'Diurnal (Yang)' },
  Virgo: { element: 'Earth', ruler: 'Mercury', modality: 'Mutable', polarity: 'Nocturnal (Yin)' },
  Libra: { element: 'Air', ruler: 'Venus', modality: 'Cardinal', polarity: 'Diurnal (Yang)' },
  Scorpio: { element: 'Water', ruler: 'Pluto / Mars', modality: 'Fixed', polarity: 'Nocturnal (Yin)' },
  Sagittarius: { element: 'Fire', ruler: 'Jupiter', modality: 'Mutable', polarity: 'Diurnal (Yang)' },
  Capricorn: { element: 'Earth', ruler: 'Saturn', modality: 'Cardinal', polarity: 'Nocturnal (Yin)' },
  Aquarius: { element: 'Air', ruler: 'Uranus / Saturn', modality: 'Fixed', polarity: 'Diurnal (Yang)' },
  Pisces: { element: 'Water', ruler: 'Neptune / Jupiter', modality: 'Mutable', polarity: 'Nocturnal (Yin)' },
};

// ======================================================================
// 2. ENVIRONMENT CONFIGURATION & CLIENT INITIALIZATION
// ======================================================================

export function loadEnvFiles(): void {
  const envPaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch {
        // Ignore file read errors
      }
    }
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  loadEnvFiles();
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ======================================================================
// 3. MASTER PROMPTS & PROMPT BUILDERS
// ======================================================================

export function buildSystemPrompt(): string {
  return `You are the master astrological synthesis engine for Moonday Live — an editorial luxury astrology platform.
Voice & Cadence Rules:
- Sophisticated, psychologically penetrating, grounded, and free of generic AI clichés (avoid words like "tapestry", "beacon", "dance of celestial energies", "testament").
- Tone is perceptive, warm, and empowering, bridging traditional Hellenistic astrological principles (sect, element, planetary rulerships, modality) with modern psychological integration.
- Ground insights in concrete behavioral patterns, emotional instincts, cognitive frameworks, and actionable somatic remedies.
- Strictly output a valid JSON object matching the requested schema with no surrounding Markdown code fences or extra text.`;
}

export function buildUserPrompt(sunSign: string, moonSign: string): string {
  const sunMeta = SIGN_METADATA[sunSign as ZodiacSign] || {
    element: 'Fire',
    ruler: 'Sun',
    modality: 'Cardinal',
    polarity: 'Diurnal',
  };
  const moonMeta = SIGN_METADATA[moonSign as ZodiacSign] || {
    element: 'Water',
    ruler: 'Moon',
    modality: 'Cardinal',
    polarity: 'Nocturnal',
  };

  return `Generate the comprehensive natal Sun/Moon combination profile for:
Sun Sign: ${sunSign} (Element: ${sunMeta.element}, Ruler: ${sunMeta.ruler}, Modality: ${sunMeta.modality}, Polarity: ${sunMeta.polarity})
Moon Sign: ${moonSign} (Element: ${moonMeta.element}, Ruler: ${moonMeta.ruler}, Modality: ${moonMeta.modality}, Polarity: ${moonMeta.polarity})

Output a single valid JSON object with the following exact keys:
{
  "combination_title": "${sunSign} Sun • ${moonSign} Moon — [Evocative 2-4 word Archetype Title, e.g. The Strategic Alchemist]",
  "solar_essence": "Outward Expression: [2-3 sentences articulating how ${sunSign} drives conscious purpose, outer vitality, and life direction through its ${sunMeta.element} element and ${sunMeta.ruler} rulership]",
  "lunar_essence": "Inner Sanctuary: [2-3 sentences illuminating how ${moonSign} governs instinctive needs, emotional processing, and private refuge via ${moonMeta.element} and ${moonMeta.ruler}]",
  "combination_synthesis": "[2-3 substantive, high-resonance paragraphs exploring the dynamic interplay between ${sunSign}'s conscious ambition and ${moonSign}'s nocturnal emotional baseline. Detail both the natural synergy and the inherent friction between these two signs, and how the individual integrates them into sovereign mastery]",
  "default_behaviors": [
    "[Concrete behavioral habit 1: How they initiate projects and make decisions]",
    "[Concrete behavioral habit 2: How they process emotional conflict and vulnerability]",
    "[Concrete behavioral habit 3: How they navigate social dynamics and intimate relationships]",
    "[Concrete behavioral habit 4: How they handle stress, pressure, and setbacks]",
    "[Concrete behavioral habit 5: How they replenish vital energy and maintain equilibrium]"
  ],
  "shadow_pattern": "[2-3 sentences identifying the specific shadow trap when ${sunSign} ego demands clash with ${moonSign} emotional insecurity under stress, followed by the exact somatic or psychological remedy to restore equilibrium]",
  "upgrade_teaser": "[1-2 compelling sentences inviting them to unlock their Sovereign Daily Blueprint to align with active planetary transits tuned to their ${sunSign} Sun and ${moonSign} Moon frequency]"
}`;
}

// ======================================================================
// 4. JSON RESPONSE PARSER & SCHEMA VALIDATOR
// ======================================================================

export interface RawCombinationResponse {
  combination_title: string;
  solar_essence: string;
  lunar_essence: string;
  combination_synthesis: string;
  default_behaviors: string[];
  shadow_pattern: string;
  upgrade_teaser: string;
}

export function parseAndValidateResponse(
  rawText: string,
  sunSign: string,
  moonSign: string
): CombinationProfile {
  let cleaned = rawText.trim();

  // Strip Markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  // Attempt to isolate JSON if extra text surrounds it
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  let parsed: Partial<RawCombinationResponse>;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse Gemini JSON response for ${sunSign}/${moonSign}: ${(err as Error).message}`);
  }

  // Validate and enforce schema fields
  const combination_title =
    parsed.combination_title?.trim() || `${sunSign} Sun • ${moonSign} Moon — The Integrated Sovereign`;
  const solar_essence =
    parsed.solar_essence?.trim() || `Outward Expression: Driven by conscious ${sunSign} purpose and vitality.`;
  const lunar_essence =
    parsed.lunar_essence?.trim() || `Inner Sanctuary: Anchored in ${moonSign}'s instinctive emotional refuge.`;
  const combination_synthesis =
    parsed.combination_synthesis?.trim() ||
    `Your conscious ${sunSign} Sun operates in deep synergy with your instinctual ${moonSign} Moon. Integrating these energies yields profound alignment.`;

  let default_behaviors: string[] = [];
  if (Array.isArray(parsed.default_behaviors)) {
    default_behaviors = parsed.default_behaviors
      .map((b) => (typeof b === 'string' ? b.trim() : JSON.stringify(b)))
      .filter(Boolean);
  }

  // Guarantee exactly 5 behaviors
  while (default_behaviors.length < 5) {
    const fallbacks = [
      `Navigates challenges by harmonizing ${sunSign} initiative with ${moonSign} emotional wisdom.`,
      `Protects inner peace while remaining faithful to ${sunSign} core ambitions.`,
      `Communicates authentic needs clearly without sacrificing emotional nuance.`,
      `Recovers equilibrium through solitary reflection and sensory grounding.`,
      `Maintains long-term consistency by honoring daily rhythmic cycles.`,
    ];
    default_behaviors.push(fallbacks[default_behaviors.length % fallbacks.length]);
  }
  if (default_behaviors.length > 5) {
    default_behaviors = default_behaviors.slice(0, 5);
  }

  const shadow_pattern =
    parsed.shadow_pattern?.trim() ||
    `Under fatigue, tension between ${sunSign} ego assertions and ${moonSign} emotional needs can trigger withdrawal or overcompensation. Grounding restores balance.`;

  const upgrade_teaser =
    parsed.upgrade_teaser?.trim() ||
    `Unlock your Sovereign Daily Blueprint to track personalized transit alerts tuned to your ${sunSign} Sun and ${moonSign} Moon signature.`;

  return {
    sun_sign: sunSign,
    moon_sign: moonSign,
    combination_title,
    solar_essence,
    lunar_essence,
    combination_synthesis,
    default_behaviors,
    shadow_pattern,
    upgrade_teaser,
    generated_at: new Date().toISOString(),
  };
}

// ======================================================================
// 5. GEMINI API CLIENT WITH RETRIES & EXPONENTIAL BACKOFF
// ======================================================================

export interface GeminiApiOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  maxRetries?: number;
}

export async function callGeminiApi(
  sunSign: string,
  moonSign: string,
  apiKey: string,
  options: GeminiApiOptions = {}
): Promise<CombinationProfile> {
  const model = options.model || 'gemini-3.1-flash-lite';
  const maxTokens = options.maxTokens || 2500;
  const temperature = options.temperature ?? 0.7;
  const maxRetries = options.maxRetries ?? 3;

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(sunSign, moonSign);

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        const status = response.status;

        // Rate limit (429) or transient server errors (5xx) -> retry with exponential backoff
        if (status === 429 || (status >= 500 && status < 600)) {
          attempt++;
          if (attempt <= maxRetries) {
            const backoffMs = Math.pow(2, attempt) * 1000;
            console.warn(`[Gemini API] Status ${status} for ${sunSign}/${moonSign}. Retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})...`);
            await delay(backoffMs);
            continue;
          }
        }

        throw new Error(`Gemini API error (${status}): ${errorBody}`);
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text || '';

      if (!rawText) {
        throw new Error(`Empty response from Gemini API for ${sunSign}/${moonSign}`);
      }

      return parseAndValidateResponse(rawText, sunSign, moonSign);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      attempt++;
      if (attempt <= maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.warn(`[Gemini API] Network error for ${sunSign}/${moonSign}: ${lastError.message}. Retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
      }
    }
  }

  throw lastError || new Error(`Failed to generate combination for ${sunSign}/${moonSign} after ${maxRetries} retries.`);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ======================================================================
// 6. BATCH MATRIX ORCHESTRATION & UPSERT
// ======================================================================

export interface BatchOptions {
  limit?: number;
  delayMs?: number;
  skipExisting?: boolean;
  dryRun?: boolean;
  filterSun?: string;
  filterMoon?: string;
  apiKey?: string;
}

export async function runBatchGeneration(options: BatchOptions = {}): Promise<{
  total: number;
  successful: number;
  skipped: number;
  failed: number;
  errors: Array<{ pair: string; error: string }>;
}> {
  loadEnvFiles();
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  const delayMs = options.delayMs ?? 750;
  const supabase = getSupabaseClient();

  if (!apiKey && !options.dryRun) {
    throw new Error('GEMINI_API_KEY environment variable is required to run batch generation (or pass --dry-run for simulation).');
  }

  // Build the 144 sign pair matrix
  const matrix: Array<{ sun: ZodiacSign; moon: ZodiacSign }> = [];
  for (const sun of ZODIAC_SIGNS) {
    if (options.filterSun && sun.toLowerCase() !== options.filterSun.toLowerCase()) continue;
    for (const moon of ZODIAC_SIGNS) {
      if (options.filterMoon && moon.toLowerCase() !== options.filterMoon.toLowerCase()) continue;
      matrix.push({ sun, moon });
    }
  }

  const queue = options.limit ? matrix.slice(0, options.limit) : matrix;
  const total = queue.length;

  console.log('======================================================================');
  console.log(`MOONDAY LIVE — BATCH COMBINATION PROFILE GENERATOR`);
  console.log(`Model: gemini-2.5-flash | Total Combinations to Process: ${total}`);
  console.log(`Pacing Delay: ${delayMs}ms | Skip Existing: ${!!options.skipExisting} | Dry Run: ${!!options.dryRun}`);
  console.log('======================================================================\n');

  let successful = 0;
  let skipped = 0;
  let failed = 0;
  const errors: Array<{ pair: string; error: string }> = [];

  // If skipExisting is requested, fetch all existing combination profiles in one query
  const existingSet = new Set<string>();
  if (options.skipExisting && supabase) {
    try {
      const { data, error } = await supabase
        .from('combination_profiles')
        .select('sun_sign, moon_sign, combination_synthesis');

      if (!error && data) {
        for (const row of data) {
          if (row.combination_synthesis && row.combination_synthesis.length > 50) {
            existingSet.add(`${row.sun_sign}:${row.moon_sign}`);
          }
        }
        console.log(`Found ${existingSet.size} pre-existing combination profiles in Supabase.`);
      }
    } catch (err) {
      console.warn('Could not query existing profiles to skip:', err);
    }
  }

  for (let idx = 0; idx < queue.length; idx++) {
    const { sun, moon } = queue[idx];
    const pairLabel = `${sun} Sun • ${moon} Moon`;
    const progressTag = `[${(idx + 1).toString().padStart(3, '0')}/${total}]`;
    const key = `${sun}:${moon}`;

    if (options.skipExisting && existingSet.has(key)) {
      console.log(`${progressTag} ⏭️  ${pairLabel.padEnd(36)} -> SKIPPED (already seeded)`);
      skipped++;
      continue;
    }

    const startTime = Date.now();

    try {
      let profile: CombinationProfile;

      if (options.dryRun) {
        // In dry-run mode, synthesize a mock profile without calling the Gemini API
        profile = {
          sun_sign: sun,
          moon_sign: moon,
          combination_title: `${sun} Sun • ${moon} Moon — The Archetypal Luminary (Dry Run)`,
          solar_essence: `Outward Expression: Powered by ${sun}'s conscious vitality.`,
          lunar_essence: `Inner Sanctuary: Guided by ${moon}'s instinctive sanctuary.`,
          combination_synthesis: `Dry run synthesis for ${sun}/${moon}. High-resonance architectural alignment between conscious ${sun} drive and instinctual ${moon} needs.`,
          default_behaviors: [
            `Behavior 1 for ${sun}/${moon}`,
            `Behavior 2 for ${sun}/${moon}`,
            `Behavior 3 for ${sun}/${moon}`,
            `Behavior 4 for ${sun}/${moon}`,
            `Behavior 5 for ${sun}/${moon}`,
          ],
          shadow_pattern: `Shadow trap under extreme tension for ${sun}/${moon}.`,
          upgrade_teaser: `Unlock your Sovereign Daily Blueprint for ${sun} Sun and ${moon} Moon.`,
          generated_at: new Date().toISOString(),
        };
      } else {
        profile = await callGeminiApi(sun, moon, apiKey!);
      }

      // Persist to Supabase if client is available and not in pure dryRun
      if (supabase && !options.dryRun) {
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

        const { error } = await supabase
          .from('combination_profiles')
          .upsert(payload, { onConflict: 'sun_sign,moon_sign' });

        if (error) {
          throw new Error(`Database upsert failed for ${pairLabel}: ${error.message}`);
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`${progressTag} ✨ ${pairLabel.padEnd(36)} -> SAVED (${elapsed}s) "${profile.combination_title}"`);
      successful++;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`${progressTag} ❌ ${pairLabel.padEnd(36)} -> FAILED: ${errMsg}`);
      failed++;
      errors.push({ pair: pairLabel, error: errMsg });
    }

    // Apply delay between calls if there are subsequent items
    if (idx < queue.length - 1 && delayMs > 0) {
      await delay(delayMs);
    }
  }

  console.log('\n======================================================================');
  console.log(`BATCH GENERATION SUMMARY`);
  console.log(`Total: ${total} | Successful: ${successful} | Skipped: ${skipped} | Failed: ${failed}`);
  if (errors.length > 0) {
    console.log(`Errors encountered:`);
    errors.forEach((e) => console.log(` - ${e.pair}: ${e.error}`));
  }
  console.log('======================================================================\n');

  return { total, successful, skipped, failed, errors };
}

// ======================================================================
// 7. CLI RUNNER
// ======================================================================

function parseCliArgs(): BatchOptions {
  const options: BatchOptions = {
    dryRun:
      process.env.DRY_RUN === 'true' ||
      process.env.DRY_RUN === '1' ||
      process.env.npm_config_dry_run === 'true' ||
      process.env.npm_config_dryrun === 'true' ||
      process.env.npm_config_dry === 'true',
    skipExisting:
      process.env.SKIP_EXISTING === 'true' ||
      process.env.npm_config_skip_existing === 'true' ||
      process.env.npm_config_skipexisting === 'true',
  };

  if (process.env.npm_config_limit) {
    options.limit = parseInt(process.env.npm_config_limit, 10);
  }
  if (process.env.npm_config_delay) {
    options.delayMs = parseInt(process.env.npm_config_delay, 10);
  }
  if (process.env.npm_config_sun) {
    options.filterSun = process.env.npm_config_sun;
  }
  if (process.env.npm_config_moon) {
    options.filterMoon = process.env.npm_config_moon;
  }

  const rawArgs = process.argv.slice(2);
  for (const arg of rawArgs) {
    const trimmed = arg.trim().replace(/^['"]|['"]$/g, '');
    if (trimmed === '--dry-run' || trimmed === '--dryRun' || trimmed === '-d' || trimmed === 'dry-run') {
      options.dryRun = true;
    } else if (trimmed === '--skip-existing' || trimmed === '--skipExisting' || trimmed === '-s' || trimmed === 'skip-existing') {
      options.skipExisting = true;
    } else if (trimmed.startsWith('--limit=')) {
      options.limit = parseInt(trimmed.split('=')[1], 10);
    } else if (trimmed.startsWith('--delay=')) {
      options.delayMs = parseInt(trimmed.split('=')[1], 10);
    } else if (trimmed.startsWith('--sun=')) {
      options.filterSun = trimmed.split('=')[1];
    } else if (trimmed.startsWith('--moon=')) {
      options.filterMoon = trimmed.split('=')[1];
    }
  }

  return options;
}

if (process.argv[1] && (process.argv[1].endsWith('batch-generate-combinations.ts') || process.argv[1].includes('batch-generate-combinations'))) {
  const cliOptions = parseCliArgs();
  runBatchGeneration(cliOptions).catch((err) => {
    console.error('Fatal batch generation error:', err);
    process.exit(1);
  });
}
