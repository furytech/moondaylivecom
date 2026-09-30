/**
 * scripts/enrich-shadow-work.ts
 *
 * Enriches all 144 combination_profiles with the full three-layer portrait:
 *   Layer 1 — luminous_expression  : 5 highest-potential traits
 *   Layer 2 — shadow_behaviors     : 5 named Jungian shadows with element-specific integration
 *   Layer 3 — shadow_synthesis     : integration narrative / wholeness statement
 *
 * Model: gemini-3.1-flash-lite
 * Run:   $env:GEMINI_API_KEY="..."; npm run enrich:shadow -- --skip-existing
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env files — .env.local wins over .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath      = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
if (fs.existsSync(envPath))      dotenv.config({ path: envPath });

// ============================================================
// CONFIGURATION
// ============================================================

const MODEL          = 'gemini-3.1-flash-lite';
const PACING_DELAY   = 1000; // ms between calls
const MAX_RETRIES    = 3;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL   = process.env.VITE_SUPABASE_URL   || 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co';
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ============================================================
// ELEMENTAL FRAMEWORK
// ============================================================

const ELEMENT: Record<string, string> = {
    Aries: 'Fire',  Leo: 'Fire',  Sagittarius: 'Fire',
    Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
    Gemini: 'Air',  Libra: 'Air',  Aquarius: 'Air',
    Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

const ELEMENT_GUIDANCE: Record<string, string> = {
    Fire: `Fire signs transform shadow through DIRECT ACTION and passionate engagement.
Integration pathways must involve movement, creative fire, courageous confrontation, or physical expression.
Fire doesn't sit with darkness — it burns through it.
Practices: physical release rituals, expressive art, bold honest confrontation with the pattern, 
redirecting the shadow's energy into competitive challenge or leadership, courage acts.`,

    Earth: `Earth signs transform shadow through EMBODIMENT and tangible structure.
Integration pathways must be grounded, repeatable, and physically anchored.
Earth doesn't transcend the body — it heals through it.
Practices: somatic bodywork, physical rituals with objects, structured journaling with tracking, 
building new external habits that reflect internal shifts, working with the hands, nature immersion.`,

    Air: `Air signs transform shadow through NAMING and precise intellectual reframing.
Integration pathways must involve articulation, dialogue, and perspective-shifting.
Air doesn't feel its way through — it thinks its way to a new story.
Practices: naming the pattern with clinical precision, therapy or coaching conversation, 
research and reading about the pattern, writing essays about it, sharing the insight with trusted others, 
perspective-taking exercises.`,

    Water: `Water signs transform shadow through IMMERSION and emotional release.
Integration pathways must honor depth feeling, symbolic processing, and the unconscious.
Water doesn't manage emotion — it moves through the full depth of it.
Practices: depth emotional work, dream journaling and interpretation, art or music as feeling containers, 
somatic release through tears or movement, ritual and ceremony, depth therapy, 
sitting with the feeling rather than solving it.`,
};

// ============================================================
// PROMPT BUILDER
// ============================================================

function buildPrompt(
    sunSign:    string,
    moonSign:   string,
    title:      string,
    allTitles:  string[]
): string {
    const sunEl  = ELEMENT[sunSign];
    const moonEl = ELEMENT[moonSign];
    const cross  = sunEl !== moonEl;

    const elementSection = cross
        ? `CROSS-ELEMENT PAIRING — ${sunSign} Sun (${sunEl}) + ${moonSign} Moon (${moonEl})
Shadow integration pathways MUST honor BOTH elements simultaneously:

${sunEl} Sun — how they initiate and drive shadow work:
${ELEMENT_GUIDANCE[sunEl]}

${moonEl} Moon — how they emotionally process and integrate:
${ELEMENT_GUIDANCE[moonEl]}

Blend both approaches in every integration pathway. The Sun element drives HOW they engage;
the Moon element governs HOW they process and feel their way through it.`
        : `SAME-ELEMENT PAIRING — ${sunSign} Sun (${sunEl}) + ${moonSign} Moon (${sunEl})
This pairing is double-${sunEl}. Lean fully into ${sunEl} modality for all integration pathways:
${ELEMENT_GUIDANCE[sunEl]}`;

    const titleSample = allTitles.slice(0, 60).join('\n- ');

    return `You are a depth astrologer and certified Jungian analyst writing for Moonday Live —
a conscious astrology platform that treats shadow work as a genuine path to wholeness,
not a disclaimer. This content will be published to a paid audience who chose Moonday Live
specifically because it goes deeper than "here's your horoscope, mostly good news."

COMBINATION: ${sunSign} Sun + ${moonSign} Moon
ARCHETYPE TITLE: "${title}"

${elementSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHADOW BEHAVIOR NAMING — CRITICAL REQUIREMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Shadow behavior names must be mythologically specific and evocative.
They must NOT be generic [Adjective] [Noun] combinations.

WRONG: "The Emotional Avoider" / "The Defensive Strategist" / "The Perfectionist"
RIGHT: "The Architect of Unmapped Silences" / "The Sovereign Behind the Glass Wall" / 
       "The Oracle Who Refuses to Be Seen"

Draw from: mythology, natural phenomena, psychological archetypes, symbolic imagery,
the specific elemental tension of this sun/moon pairing.

Every name must be unique across all 144 combinations. Do not echo any of these titles:
- ${titleSample}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — return ONLY valid JSON, no markdown, no explanation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "luminous_expression": [
    "Trait 1 — specific to THIS ${sunSign} Sun + ${moonSign} Moon combination, not generic to either sign",
    "Trait 2",
    "Trait 3",
    "Trait 4",
    "Trait 5"
  ],
  "shadow_behaviors": [
    {
      "name": "Evocative mythological shadow name unique to this pairing",
      "pattern": "2-3 sentences describing exactly what this looks like in daily behavior and relationships — specific enough that the person recognizes themselves",
      "root": "2-3 sentences on the psychological origin — what wound, early adaptation, or survival strategy this behavior once served",
      "integration_pathways": [
        "Element-specific practice 1 — concrete and actionable, not vague",
        "Element-specific practice 2",
        "Element-specific practice 3",
        "Element-specific practice 4"
      ],
      "integration_gift": "1-2 sentences: the specific capacity this person gains when this shadow is consciously integrated — what they become capable of"
    },
    { ... shadow behavior 2 ... },
    { ... shadow behavior 3 ... },
    { ... shadow behavior 4 ... },
    { ... shadow behavior 5 ... }
  ],
  "shadow_synthesis": "3-4 sentences: the overarching integration narrative for this ${sunSign} Sun + ${moonSign} Moon combination. What does full wholeness look like when all five shadows are consciously owned? This should read as a destination worth working toward — earned, not given. End with the gift of this combination fully expressed."
}

REQUIREMENTS CHECKLIST:
✓ luminous_expression: 5 traits specific to this exact sun/moon pairing
✓ shadow_behaviors: exactly 5, all fields complete
✓ shadow names: mythologically evocative, unique, specific to ${sunSign}/${moonSign} energy
✓ integration_pathways: 4 per shadow, calibrated to ${sunEl} Sun / ${moonEl} Moon elements
✓ shadow_synthesis: affirming, transformation-focused, 3-4 sentences
✓ JSON only — no markdown fences, no preamble`;
}

// ============================================================
// GEMINI API
// ============================================================

async function callGemini(prompt: string, attempt = 0): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature:     0.88,
                maxOutputTokens: 4096,
                topP:            0.95,
            },
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        if (attempt < MAX_RETRIES) {
            const wait = 1500 * Math.pow(2, attempt);
            process.stdout.write(` [retry ${attempt + 1} in ${wait}ms]`);
            await sleep(wait);
            return callGemini(prompt, attempt + 1);
        }
        throw new Error(`Gemini ${res.status}: ${body}`);
    }

    const data  = await res.json();
    const text  = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text)   throw new Error('Empty Gemini response');

    const clean = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

    try {
        return JSON.parse(clean);
    } catch {
        // Second attempt with explicit JSON extraction
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error('Could not parse JSON from Gemini response');
    }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// MAIN
// ============================================================

async function main() {
    if (!GEMINI_API_KEY) { console.error('GEMINI_API_KEY not set'); process.exit(1); }
    if (!SUPABASE_KEY)   { console.error('Supabase key not set');   process.exit(1); }

    const supabase    = createClient(SUPABASE_URL, SUPABASE_KEY);
    const skipExist   = process.argv.includes('--skip-existing');

    console.log('='.repeat(70));
    console.log('MOONDAY LIVE — SHADOW WORK ENRICHMENT PASS');
    console.log(`Model: ${MODEL} | Skip existing: ${skipExist}`);
    console.log('='.repeat(70) + '\n');

    const { data: profiles, error } = await supabase
        .from('combination_profiles')
        .select('id, sun_sign, moon_sign, combination_title, shadow_behaviors')
        .order('sun_sign');

    if (error || !profiles) { console.error('Fetch failed:', error); process.exit(1); }

    const allTitles  = profiles.map(p => p.combination_title);
    const toProcess  = skipExist
        ? profiles.filter(p => !p.shadow_behaviors || (p.shadow_behaviors as any[]).length === 0)
        : profiles;

    console.log(`Total: ${profiles.length} | To process: ${toProcess.length} | Skipping: ${profiles.length - toProcess.length}\n`);

    let ok = 0, fail = 0;

    for (let i = 0; i < toProcess.length; i++) {
        const p     = toProcess[i];
        const idx   = String(i + 1).padStart(3, '0');
        const label = `${p.sun_sign} Sun • ${p.moon_sign} Moon`.padEnd(38);

        process.stdout.write(`[${idx}/${toProcess.length}] ✦ ${label}`);

        try {
            const t0     = Date.now();
            const prompt = buildPrompt(p.sun_sign, p.moon_sign, p.combination_title, allTitles);
            const result = await callGemini(prompt);

            const { error: upErr } = await supabase
                .from('combination_profiles')
                .update({
                    luminous_expression: result.luminous_expression,
                    shadow_behaviors:    result.shadow_behaviors,
                    shadow_synthesis:    result.shadow_synthesis,
                    updated_at:          new Date().toISOString(),
                })
                .eq('id', p.id);

            if (upErr) throw upErr;

            const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
            console.log(` -> SAVED (${elapsed}s) "${p.combination_title}"`);
            ok++;

        } catch (err: any) {
            console.log(` -> FAILED: ${err?.message ?? err}`);
            fail++;
        }

        if (i < toProcess.length - 1) await sleep(PACING_DELAY);
    }

    console.log('\n' + '='.repeat(70));
    console.log('SHADOW ENRICHMENT SUMMARY');
    console.log(`Total: ${toProcess.length} | Successful: ${ok} | Failed: ${fail}`);
    console.log('='.repeat(70));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });