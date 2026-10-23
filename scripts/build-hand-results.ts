/**
 * scripts/build-hand-results.ts
 *
 * Turns hand-written replacements into a results file in the same format as a dry run, so they pass through the same checker and
 * the same writer (regen-flagged-triads.ts --apply-from=... --confirm-write). Read-only: it writes no database rows.
 *
 *   npx tsx scripts/build-hand-results.ts --rows=<hand14.json> --proposals=<proposals.json> --review=<needs-review.jsonl> --out=<results.json>
 *
 * proposals.json maps "1".."n" (the row's position in the --rows file) to { field: newText }. For every row the script checks:
 *   - the checker rules (scripts/lib/outputChecks.ts)
 *   - that the stored text still equals the text the --rows file recorded (so nothing newer is overwritten)
 *   - the "at most twice per Sun/Moon combination" phrase rule against the live table
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { rowProblems } from './lib/outputChecks';
import { PhraseLedger, MAX_PER_COMBINATION } from './lib/phraseVariants';

for (const f of ['.env.local', '.env']) {
    const p = path.resolve(process.cwd(), f);
    if (fs.existsSync(p)) dotenv.config({ path: p });
}
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const FIELDS = ['physical_guidance', 'emotional_guidance', 'spiritual_guidance', 'daily_ritual', 'shadow_activation', 'integration_invitation'] as const;

async function main() {
    const rows = JSON.parse(fs.readFileSync(arg('rows')!, 'utf8')) as any[];
    const proposals = JSON.parse(fs.readFileSync(arg('proposals')!, 'utf8')) as Record<string, Record<string, string>>;
    const review = new Map(fs.readFileSync(arg('review')!, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)).map((r) => [r.id, r]));

    const supabase = createClient(process.env.VITE_SUPABASE_URL || 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const live: any[] = [];
    for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from('triad_states').select('id, natal_sun_sign, natal_moon_sign, transiting_moon_sign, ' + FIELDS.join(', ')).order('triad_number').range(from, from + 999);
        if (error) throw error;
        live.push(...(data as any[]));
        if (!data || data.length < 1000) break;
    }
    const byId = new Map(live.map((r) => [r.id, r]));
    const ledger = new PhraseLedger();
    for (const r of live) for (const f of FIELDS) ledger.add(`${r.natal_sun_sign}|${r.natal_moon_sign}`, r[f]);

    const results: any[] = [];
    let bad = 0;
    rows.forEach((row, i) => {
        const key = String(i + 1);
        const prop = proposals[key];
        const meta = review.get(row.id);
        const now = byId.get(row.id);
        if (!prop || !meta || !now) { console.log(`[${key}] ${row.row}: missing proposal, review entry or live row`); bad++; return; }
        const flagged = Object.keys(row.fields);
        const missing = flagged.filter((f) => !prop[f]);
        const extra = Object.keys(prop).filter((f) => !flagged.includes(f));
        const before: Record<string, string> = {};
        const source: Record<string, string> = {};
        const stale: string[] = [];
        for (const f of flagged) {
            before[f] = now[f];
            source[f] = row.fields[f].source;
            if (now[f] !== row.fields[f].liveNow) stale.push(f);
        }
        const result = { n: i + 1, id: row.id, triadNumber: meta.triadNumber, sun: meta.sun, moon: meta.moon, transit: meta.transit, flagged, kinds: meta.kinds, before, source, after: prop, status: 'hand' };
        const problems = [
            ...missing.map((f) => `${f}: no replacement given`),
            ...extra.map((f) => `${f}: not a flagged field of this row`),
            ...stale.map((f) => `${f}: the stored text changed since the review file was made`),
            ...rowProblems(result as any),
        ];
        const combo = `${meta.sun}|${meta.moon}`;
        for (const over of ledger.overLimit(combo, flagged.map((f) => now[f]), Object.values(prop))) problems.push(`phrasing "${over.display}" would appear ${over.total} times in this combination (max ${MAX_PER_COMBINATION})`);
        if (problems.length) bad++;
        console.log(`[${key}] ${row.row}: ${problems.length ? 'PROBLEMS' : 'passes'}${problems.map((p) => '\n     - ' + p).join('')}`);
        if (!problems.length) { ledger.replace(combo, flagged.map((f) => now[f]), Object.values(prop)); }
        results.push(result);
    });
    fs.writeFileSync(arg('out')!, JSON.stringify({ stats: { hand: true, rows: results.length }, results }, null, 2));
    console.log(`\n${results.length - bad} of ${rows.length} rows pass every rule. Results file: ${arg('out')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
