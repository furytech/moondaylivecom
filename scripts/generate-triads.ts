/**
 * scripts/generate-triads.ts
 *
 * Generates all 1,728 Triad daily states:
 *   144 Blueprint profiles × 12 transiting moon signs
 *
 * Each Triad state contains:
 *   - physical_guidance    : how this transit affects the body
 *   - emotional_guidance   : how this transit affects emotional tone
 *   - spiritual_guidance   : how this transit affects spiritual practice
 *   - daily_ritual         : one specific actionable practice
 *   - shadow_activation    : which shadow pattern this transit may trigger
 *   - integration_invitation : the shadow work opportunity within the transit
 *
 * Model:   gemini-3.5-flash-lite
 * Run:     $env:GEMINI_API_KEY="..."; npm run generate:triads -- --skip-existing
 * Resume:  same command — skip-existing skips already-generated states
 *
 * Telegram alerts fire on: start, every 100, rate limit hit, complete, fatal error
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// ── Env ──────────────────────────────────────────────────────────────────────
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath      = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
if (fs.existsSync(envPath))      dotenv.config({ path: envPath });

// ── Config ────────────────────────────────────────────────────────────────────
const MODEL           = 'gemini-3.5-flash-lite';
const PACING_MS       = 1200;   // ms between calls — stays well under rate limits
const MAX_RETRIES     = 4;
const TELEGRAM_ALERT_EVERY = 100; // send Telegram update every N completions

const GEMINI_KEY      = process.env.GEMINI_API_KEY;
const SUPABASE_URL    = process.env.VITE_SUPABASE_URL || 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co';
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const TG_TOKEN        = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID      = process.env.TELEGRAM_CHAT_ID;

// ── Constants ─────────────────────────────────────────────────────────────────
const SIGNS = [
    'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
    'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
] as const;

const ELEMENT: Record<string, string> = {
    Aries:'Fire', Leo:'Fire', Sagittarius:'Fire',
    Taurus:'Earth', Virgo:'Earth', Capricorn:'Earth',
    Gemini:'Air', Libra:'Air', Aquarius:'Air',
    Cancer:'Water', Scorpio:'Water', Pisces:'Water',
};

const MODALITY: Record<string, string> = {
    Aries:'Cardinal', Cancer:'Cardinal', Libra:'Cardinal', Capricorn:'Cardinal',
    Taurus:'Fixed', Leo:'Fixed', Scorpio:'Fixed', Aquarius:'Fixed',
    Gemini:'Mutable', Virgo:'Mutable', Sagittarius:'Mutable', Pisces:'Mutable',
};

// Deterministic triad number: 1–1,728
function triadNumber(sunSign: string, moonSign: string, transitSign: string): number {
    const si = SIGNS.indexOf(sunSign as typeof SIGNS[number]);
    const mi = SIGNS.indexOf(moonSign as typeof SIGNS[number]);
    const ti = SIGNS.indexOf(transitSign as typeof SIGNS[number]);
    return si * 144 + mi * 12 + ti + 1;
}

// ── Telegram ──────────────────────────────────────────────────────────────────
async function tgSend(msg: string): Promise<void> {
    if (!TG_TOKEN || !TG_CHAT_ID) return;
    try {
        await fetch(
            `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TG_CHAT_ID, text: msg, parse_mode: 'HTML' }),
            }
        );
    } catch { /* non-fatal */ }
}

// ── Prompt ────────────────────────────────────────────────────────────────────
function buildPrompt(
    sunSign: string,
    moonSign: string,
    combinationTitle: string,
    transitSign: string,
    triadNum: number,
): string {
    const natalSunEl  = ELEMENT[sunSign];
    const natalMoonEl = ELEMENT[moonSign];
    const transitEl   = ELEMENT[transitSign];
    const transitMod  = MODALITY[transitSign];

    return `You are a depth astrologer writing daily guidance for Moonday Live.

BLUEPRINT: ${sunSign} Sun + ${moonSign} Moon — "${combinationTitle}"
  Natal Sun element: ${natalSunEl}
  Natal Moon element: ${natalMoonEl}

TODAY'S TRANSITING MOON: ${transitSign} (${transitEl} · ${transitMod})
TRIAD NUMBER: #${triadNum} of 1,728

Write the daily Triad state for this exact combination.
Consider how the transiting ${transitSign} Moon (${transitEl} energy) moves through
the lens of a person whose core Blueprint is ${sunSign} Sun + ${moonSign} Moon.

The ${transitEl} transit through a ${natalSunEl}/${natalMoonEl} Blueprint creates a
specific friction or flow that must be named precisely.

Return ONLY valid JSON, no markdown, no explanation:

{
  "physical_guidance": "2-3 sentences: how this ${transitSign} Moon transit physically affects this Blueprint today. Specific body systems, energy level, sensory experience. NOT generic moon-in-sign information — this must reflect how a ${sunSign}/${moonSign} person specifically experiences ${transitSign} energy in the body.",
  "emotional_guidance": "2-3 sentences: the emotional tone and undercurrent for this Blueprint under ${transitSign} Moon. How the natal ${natalMoonEl} Moon meets the transiting ${transitEl} energy. Where tension or ease arises.",
  "spiritual_guidance": "2-3 sentences: the spiritual invitation of this transit for this Blueprint. What deeper pattern or soul lesson this ${transitSign} transit activates specifically within the ${sunSign}/${moonSign} nature.",
  "daily_ritual": "One specific, actionable practice (2-3 sentences) calibrated to both the Blueprint's dominant element (${natalSunEl}/${natalMoonEl}) and the transiting ${transitSign} energy. Not generic — something this specific combination would actually do.",
  "shadow_activation": "1-2 sentences: which shadow pattern from this Blueprint is most likely to be activated or triggered by the ${transitSign} Moon transit, and how it tends to show up today.",
  "integration_invitation": "1-2 sentences: the shadow work opportunity embedded in this transit — what this Blueprint can consciously practice to move from shadow activation toward integration today."
}`;
}

// ── Gemini API ────────────────────────────────────────────────────────────────
async function callGemini(prompt: string, attempt = 0): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.82, maxOutputTokens: 1024, topP: 0.92 },
        }),
    });

    // Rate limit — exponential backoff + Telegram alert on first hit
    if (res.status === 429) {
        const wait = 30000 * Math.pow(2, attempt);
        if (attempt === 0) {
            await tgSend(`⏸ <b>Moonday Triad Generator</b>\nRate limit hit. Waiting ${wait / 1000}s before retry.`);
        }
        process.stdout.write(` [rate-limit wait ${wait / 1000}s]`);
        await sleep(wait);
        return callGemini(prompt, attempt + 1);
    }

    if (!res.ok) {
        const body = await res.text();
        if (attempt < MAX_RETRIES) {
            await sleep(2000 * Math.pow(2, attempt));
            return callGemini(prompt, attempt + 1);
        }
        throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) throw new Error('Empty Gemini response');

    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    try {
        return JSON.parse(clean);
    } catch {
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error('Could not parse JSON from Gemini response');
    }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    if (!GEMINI_KEY)   { console.error('GEMINI_API_KEY not set'); process.exit(1); }
    if (!SUPABASE_KEY) { console.error('Supabase key not set');   process.exit(1); }

    const supabase   = createClient(SUPABASE_URL, SUPABASE_KEY);
    const skipExist  = process.argv.includes('--skip-existing');

    console.log('='.repeat(72));
    console.log('MOONDAY LIVE — TRIAD STATE GENERATOR');
    console.log(`Model: ${MODEL} | Skip existing: ${skipExist}`);
    console.log(`Total to generate: 1,728 (144 Blueprints × 12 transiting signs)`);
    console.log('='.repeat(72) + '\n');

    // Load all 144 combination profiles
    const { data: profiles, error: pErr } = await supabase
        .from('combination_profiles')
        .select('id, sun_sign, moon_sign, combination_title')
        .order('sun_sign');

    if (pErr || !profiles?.length) {
        console.error('Failed to fetch combination profiles:', pErr);
        process.exit(1);
    }
    console.log(`Loaded ${profiles.length} Blueprint profiles.\n`);

    // Load existing triad states if skipping
    let existingSet = new Set<string>();
    if (skipExist) {
        const { data: existing } = await supabase
            .from('triad_states')
            .select('natal_sun_sign, natal_moon_sign, transiting_moon_sign');
        if (existing) {
            existing.forEach(r => existingSet.add(`${r.natal_sun_sign}|${r.natal_moon_sign}|${r.transiting_moon_sign}`));
        }
        console.log(`Skipping ${existingSet.size} already-generated states.\n`);
    }

    // Build work queue: 144 profiles × 12 transiting signs = 1,728
    const queue: Array<{ profile: typeof profiles[0]; transit: string; triadNum: number }> = [];
    for (const profile of profiles) {
        for (const transit of SIGNS) {
            const key = `${profile.sun_sign}|${profile.moon_sign}|${transit}`;
            if (skipExist && existingSet.has(key)) continue;
            queue.push({
                profile,
                transit,
                triadNum: triadNumber(profile.sun_sign, profile.moon_sign, transit),
            });
        }
    }

    const total = queue.length;
    const skipped = 1728 - total;
    console.log(`Queue: ${total} to generate | ${skipped} skipped\n`);

    await tgSend(
        `🌙 <b>Moonday Triad Generator Started</b>\n` +
        `Model: ${MODEL}\n` +
        `To generate: ${total} | Skipping: ${skipped}\n` +
        `Estimated time: ~${Math.round(total * 1.2 / 60)} minutes`
    );

    let ok = 0, fail = 0, failedItems: string[] = [];

    for (let i = 0; i < queue.length; i++) {
        const { profile, transit, triadNum } = queue[i];
        const idx   = String(i + 1).padStart(4, '0');
        const label = `${profile.sun_sign} Sun • ${profile.moon_sign} Moon → ${transit}`.padEnd(48);

        process.stdout.write(`[${idx}/${total}] ✦ ${label}`);

        try {
            const t0     = Date.now();
            const prompt = buildPrompt(
                profile.sun_sign,
                profile.moon_sign,
                profile.combination_title,
                transit,
                triadNum,
            );

            const result = await callGemini(prompt);

            const { error: upErr } = await supabase
                .from('triad_states')
                .upsert({
                    natal_sun_sign:        profile.sun_sign,
                    natal_moon_sign:       profile.moon_sign,
                    transiting_moon_sign:  transit,
                    triad_number:          triadNum,
                    combination_title:     profile.combination_title,
                    physical_guidance:     result.physical_guidance,
                    emotional_guidance:    result.emotional_guidance,
                    spiritual_guidance:    result.spiritual_guidance,
                    daily_ritual:          result.daily_ritual,
                    shadow_activation:     result.shadow_activation,
                    integration_invitation: result.integration_invitation,
                    generated_at:          new Date().toISOString(),
                    updated_at:            new Date().toISOString(),
                }, { onConflict: 'natal_sun_sign,natal_moon_sign,transiting_moon_sign' });

            if (upErr) throw upErr;

            const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
            console.log(` -> SAVED (${elapsed}s) #${triadNum}`);
            ok++;

            // Telegram checkpoint every N completions
            if (ok % TELEGRAM_ALERT_EVERY === 0) {
                const pct = ((ok / total) * 100).toFixed(1);
                await tgSend(
                    `🌙 <b>Triad Generator Update</b>\n` +
                    `✅ ${ok}/${total} complete (${pct}%)\n` +
                    `❌ ${fail} failed\n` +
                    `Last: #${triadNum} — ${profile.sun_sign}/${profile.moon_sign} → ${transit}`
                );
            }

        } catch (err: any) {
            const msg = err?.message ?? String(err);
            console.log(` -> FAILED: ${msg.slice(0, 80)}`);
            failedItems.push(`${profile.sun_sign}/${profile.moon_sign} → ${transit}`);
            fail++;

            // Telegram alert on failure
            if (fail <= 5 || fail % 10 === 0) {
                await tgSend(
                    `⚠️ <b>Triad Generator Error</b>\n` +
                    `${profile.sun_sign}/${profile.moon_sign} → ${transit}\n` +
                    `Error: ${msg.slice(0, 100)}\n` +
                    `Total failures so far: ${fail}`
                );
            }
        }

        if (i < queue.length - 1) await sleep(PACING_MS);
    }

    // Final summary
    const summary =
        `\n${'='.repeat(72)}\n` +
        `TRIAD GENERATION COMPLETE\n` +
        `Total: ${total} | Successful: ${ok} | Failed: ${fail}\n` +
        (failedItems.length ? `\nFailed combos:\n${failedItems.slice(0, 20).join('\n')}` : '') +
        `\n${'='.repeat(72)}`;

    console.log(summary);

    await tgSend(
        `🌕 <b>Triad Generator Complete</b>\n` +
        `✅ ${ok} generated\n` +
        `❌ ${fail} failed\n` +
        (fail > 0 ? `Re-run with --skip-existing to retry failures.` : `All 1,728 states populated.`)
    );
}

main().catch(err => {
    console.error('Fatal:', err);
    tgSend(`🚨 <b>Triad Generator Fatal Error</b>\n${String(err).slice(0, 200)}`);
    process.exit(1);
});