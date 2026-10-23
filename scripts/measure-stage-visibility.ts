/**
 * scripts/measure-stage-visibility.ts
 *
 * Read-only. For the Sun/Moon combinations in --combos-file, applies the live display filter (stripBodyClaims, as DailyForecast does)
 * to every stored Triad field and counts what a reader would lose:
 *   - rows that lose a whole field (the block disappears)
 *   - rows that lose some sentences of a field
 *
 *   npx tsx scripts/measure-stage-visibility.ts --combos-file=<json> [--from-json=<backup export>]
 *
 * Without --from-json it reads the live triad_states table (service role).
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { stripBodyClaims } from '../src/lib/dailyContentGuard';

for (const f of ['.env.local', '.env']) {
    const p = path.resolve(process.cwd(), f);
    if (fs.existsSync(p)) dotenv.config({ path: p });
}
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const FIELDS = ['physical_guidance', 'emotional_guidance', 'spiritual_guidance', 'daily_ritual', 'shadow_activation', 'integration_invitation'] as const;

async function load(): Promise<any[]> {
    const fromJson = arg('from-json');
    if (fromJson) {
        const parsed = JSON.parse(fs.readFileSync(fromJson, 'utf8'));
        return Array.isArray(parsed) ? parsed : (Object.values(parsed).find(Array.isArray) as any[]);
    }
    const supabase = createClient(process.env.VITE_SUPABASE_URL || 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const rows: any[] = [];
    for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from('triad_states').select('id, natal_sun_sign, natal_moon_sign, transiting_moon_sign, ' + FIELDS.join(', ')).order('triad_number').range(from, from + 999);
        if (error) throw error;
        rows.push(...(data as any[]));
        if (!data || data.length < 1000) break;
    }
    return rows;
}

async function main() {
    // Without --combos-file the whole table is measured.
    const comboFile = arg('combos-file');
    const combos = comboFile ? new Set((JSON.parse(fs.readFileSync(comboFile, 'utf8')) as string[][]).map(([s, m]) => `${s}|${m}`)) : null;
    const rows = (await load()).filter((r) => !combos || combos.has(`${r.natal_sun_sign}|${r.natal_moon_sign}`));
    let rowsLosingField = 0, rowsLosingSentences = 0, fieldsGone = 0, fieldsPartial = 0;
    const perField: Record<string, number> = {};
    for (const r of rows) {
        let gone = false, partial = false;
        for (const f of FIELDS) {
            const text: string = r[f] ?? '';
            if (!text) continue;
            const shown = stripBodyClaims(text);
            if (shown === '') { gone = true; fieldsGone++; perField[f] = (perField[f] ?? 0) + 1; }
            else if (shown !== text) { partial = true; fieldsPartial++; }
        }
        if (gone) rowsLosingField++;
        if (partial) rowsLosingSentences++;
    }
    console.log(JSON.stringify({
        source: arg('from-json') ? 'backup export' : 'live table',
        rows: rows.length,
        rowsLosingAWholeField: rowsLosingField,
        fieldsGone,
        fieldsGonePerColumn: perField,
        rowsLosingSomeSentences: rowsLosingSentences,
        fieldsWithSentencesDropped: fieldsPartial,
    }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
