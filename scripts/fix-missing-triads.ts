import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });

const MODEL      = 'gemini-3.5-flash-lite';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'] as const;
const ELEMENT: Record<string,string> = {
    Aries:'Fire',Leo:'Fire',Sagittarius:'Fire',
    Taurus:'Earth',Virgo:'Earth',Capricorn:'Earth',
    Gemini:'Air',Libra:'Air',Aquarius:'Air',
    Cancer:'Water',Scorpio:'Water',Pisces:'Water',
};
const MODALITY: Record<string,string> = {
    Aries:'Cardinal',Cancer:'Cardinal',Libra:'Cardinal',Capricorn:'Cardinal',
    Taurus:'Fixed',Leo:'Fixed',Scorpio:'Fixed',Aquarius:'Fixed',
    Gemini:'Mutable',Virgo:'Mutable',Sagittarius:'Mutable',Pisces:'Mutable',
};

function triadNumber(sun: string, moon: string, transit: string): number {
    const si = SIGNS.indexOf(sun as typeof SIGNS[number]);
    const mi = SIGNS.indexOf(moon as typeof SIGNS[number]);
    const ti = SIGNS.indexOf(transit as typeof SIGNS[number]);
    return si * 144 + mi * 12 + ti + 1;
}

const MISSING = [
    { sun: 'Aries',       moon: 'Cancer', transit: 'Aries'  },
    { sun: 'Capricorn',   moon: 'Cancer', transit: 'Cancer' },
    { sun: 'Gemini',      moon: 'Cancer', transit: 'Libra'  },
    { sun: 'Sagittarius', moon: 'Gemini', transit: 'Gemini' },
    { sun: 'Scorpio',     moon: 'Taurus', transit: 'Leo'    },
];

function buildPrompt(sun: string, moon: string, title: string, transit: string, num: number): string {
    return `You are a depth astrologer writing daily guidance for Moonday Live.

BLUEPRINT: ${sun} Sun + ${moon} Moon — "${title}"
  Natal Sun element: ${ELEMENT[sun]}
  Natal Moon element: ${ELEMENT[moon]}

TODAY'S TRANSITING MOON: ${transit} (${ELEMENT[transit]} · ${MODALITY[transit]})
TRIAD NUMBER: #${num} of 1,728

Write the daily Triad state for this exact combination. Consider how the transiting ${transit} Moon moves through the lens of a ${sun} Sun + ${moon} Moon Blueprint.

Return ONLY valid JSON, no markdown:
{
  "physical_guidance": "2-3 sentences specific to this Blueprint under ${transit} Moon.",
  "emotional_guidance": "2-3 sentences on emotional tone for this Blueprint under ${transit} Moon.",
  "spiritual_guidance": "2-3 sentences on spiritual invitation of this transit for this Blueprint.",
  "daily_ritual": "One specific actionable practice (2-3 sentences) for this Blueprint under ${transit} Moon.",
  "shadow_activation": "1-2 sentences on which shadow pattern this ${transit} transit activates.",
  "integration_invitation": "1-2 sentences on the shadow work opportunity in this transit."
}`;
}

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
    if (res.status === 429) {
        await new Promise(r => setTimeout(r, 30000 * Math.pow(2, attempt)));
        return callGemini(prompt, attempt + 1);
    }
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const clean = text.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim();
    try { return JSON.parse(clean); }
    catch {
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error('Could not parse JSON');
    }
}

async function main() {
    if (!GEMINI_KEY) { console.error('GEMINI_API_KEY not set'); process.exit(1); }
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY!);

    console.log('Fixing 5 missing triad states...\n');

    for (const { sun, moon, transit } of MISSING) {
        const { data: profile } = await supabase
            .from('combination_profiles')
            .select('combination_title')
            .eq('sun_sign', sun)
            .eq('moon_sign', moon)
            .single();

        const title    = profile?.combination_title ?? `${sun} Sun ${moon} Moon`;
        const triadNum = triadNumber(sun, moon, transit);

        process.stdout.write(`${sun} Sun • ${moon} Moon → ${transit} (#${triadNum})... `);

        try {
            const result = await callGemini(buildPrompt(sun, moon, title, transit, triadNum));
            const { error } = await supabase.from('triad_states').upsert({
                natal_sun_sign:          sun,
                natal_moon_sign:         moon,
                transiting_moon_sign:    transit,
                triad_number:            triadNum,
                combination_title:       title,
                physical_guidance:       result.physical_guidance,
                emotional_guidance:      result.emotional_guidance,
                spiritual_guidance:      result.spiritual_guidance,
                daily_ritual:            result.daily_ritual,
                shadow_activation:       result.shadow_activation,
                integration_invitation:  result.integration_invitation,
                generated_at:            new Date().toISOString(),
                updated_at:              new Date().toISOString(),
            }, { onConflict: 'natal_sun_sign,natal_moon_sign,transiting_moon_sign' });

            if (error) throw error;
            console.log('SAVED');
        } catch (err: any) {
            console.log(`FAILED: ${err?.message?.slice(0,80)}`);
        }

        await new Promise(r => setTimeout(r, 1200));
    }

    console.log('\nDone. Verify with: SELECT COUNT(*) FROM triad_states;');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
