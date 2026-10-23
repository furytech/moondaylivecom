/**
 * scripts/audit-somatic-shifts.ts
 *
 * Read-only. Finds every stored line where "somatic" / "body tension" was replaced by one of the "stress you carry ... physically"
 * phrasings (scripts/lib/phraseVariants.ts, family "somatic"), and shows how the original word was used. "Somatic" is usually an
 * ADJECTIVE ("somatic stillness", "somatic surrender"); the glossary phrase is a NOUN ("the stress you carry and feel physically"),
 * so the replacement can change the meaning.
 *
 *   npx tsx scripts/audit-somatic-shifts.ts --from-json=<backup export> [--show=10]
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { FAMILIES } from './lib/phraseVariants';

for (const f of ['.env.local', '.env']) {
    const p = path.resolve(process.cwd(), f);
    if (fs.existsSync(p)) dotenv.config({ path: p });
}
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const FIELDS = ['physical_guidance', 'emotional_guidance', 'spiritual_guidance', 'daily_ritual', 'shadow_activation', 'integration_invitation'] as const;
const somatic = FAMILIES.find((f) => f.id === 'somatic')!;
const sentences = (t: string) => t.replace(/([.!?])\s+/g, '$1|SPLIT|').split('|SPLIT|').map((s) => s.trim()).filter(Boolean);

async function live(): Promise<any[]> {
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
    const backupRaw = JSON.parse(fs.readFileSync(arg('from-json')!, 'utf8'));
    const backup: any[] = Array.isArray(backupRaw) ? backupRaw : (Object.values(backupRaw).find(Array.isArray) as any[]);
    const orig = new Map(backup.map((r) => [r.id, r]));
    const rows = await live();
    const show = Number(arg('show') ?? '10');

    const hits: Array<{ row: any; field: string; before: string; after: string; head: string; kind: string }> = [];
    for (const r of rows) {
        for (const f of FIELDS) {
            const now: string = r[f] ?? '';
            if (!somatic.variants.some((v) => new RegExp(v.re.source, 'i').test(now))) continue;
            const was: string = orig.get(r.id)?.[f] ?? '';
            const bs = sentences(was), ns = sentences(now);
            // the sentence of the original that held the word, and the matching sentence now
            const i = bs.findIndex((s) => /somatic|body tension/i.test(s));
            const nsent = ns.find((s) => somatic.variants.some((v) => new RegExp(v.re.source, 'i').test(s))) ?? '';
            // When the original sentence had no "somatic", show the original sentence that shares the most words with the new one.
            const words = (s: string) => new Set(s.toLowerCase().match(/[a-z']+/g) ?? []);
            const overlap = (a: string) => { const wa = words(a), wb = words(nsent); let n = 0; for (const w of wa) if (wb.has(w)) n++; return n / Math.max(4, wa.size); };
            const bsent = i >= 0 ? bs[i] : (bs.length ? [...bs].sort((a, b) => overlap(b) - overlap(a))[0] : '');
            const foundSomatic = i >= 0;
            const m = bsent.match(/somatic\s+(\w+(?:\s+\w+)?)/i);
            const kind = !foundSomatic ? 'original not found' : /body tension/i.test(bsent) && !/somatic/i.test(bsent) ? 'noun: "body tension"' : m ? 'adjective: "somatic ' + m[1].split(' ')[0].toLowerCase() + '"' : 'other use of "somatic"';
            hits.push({ row: r, field: f, before: bsent, after: nsent, head: m ? m[1].split(' ')[0].toLowerCase() : '', kind });
        }
    }
    const byKind = new Map<string, number>();
    for (const h of hits) byKind.set(h.kind, (byKind.get(h.kind) ?? 0) + 1);
    const adjectiveCount = hits.filter((h) => h.kind.startsWith('adjective')).length;
    // Where the phrasing shows up in lines whose original had no "somatic" at all (usually the freshly written energy lines)
    const notFoundByField: Record<string, number> = {};
    for (const h of hits.filter((x) => x.kind === 'original not found')) notFoundByField[h.field] = (notFoundByField[h.field] ?? 0) + 1;
    console.log('"original not found" by column:', JSON.stringify(notFoundByField));
    const nf = hits.filter((x) => x.kind === 'original not found').slice(0, 3);
    nf.forEach((h) => console.log(`  e.g. ${h.field} (${h.row.natal_sun_sign}/${h.row.natal_moon_sign} ${h.row.transiting_moon_sign}):\n     BEFORE (closest original sentence): ${h.before}\n     NOW: ${h.after}`));
    console.log(JSON.stringify({ linesWithTheStressYouCarryPhrasing: hits.length, usedAsAdjectiveInOriginal: adjectiveCount, byKind: Object.fromEntries([...byKind.entries()].sort((a, b) => b[1] - a[1])) }, null, 2));
    console.log(`\n${Math.min(show, hits.length)} examples (adjectives first):\n`);
    const ordered = [...hits.filter((h) => h.kind.startsWith('adjective')), ...hits.filter((h) => !h.kind.startsWith('adjective'))];
    ordered.slice(0, show).forEach((h, i) => {
        console.log(`[${i + 1}] ${h.row.natal_sun_sign} Sun / ${h.row.natal_moon_sign} Moon, ${h.row.transiting_moon_sign} day, ${h.field}  (${h.kind})`);
        console.log(`  BEFORE: ${h.before}`);
        console.log(`  NOW:    ${h.after}\n`);
    });
}

main().catch((e) => { console.error(e); process.exit(1); });
