/**
 * scripts/measure-phrase-reuse.ts
 *
 * Read-only. Counts how often each glossary phrasing (scripts/lib/phraseVariants.ts) appears across the 12 Triad rows of every
 * Sun/Moon combination in the live triad_states table, and lists the combinations that break the "at most twice" rule.
 *
 *   npx tsx scripts/measure-phrase-reuse.ts [--combos-file=<json>] [--family=warmth] [--from-json=<export>]
 *
 * --combos-file limits the report to those combinations; --family prints the per-combination counts of one family.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { FAMILIES, MAX_PER_COMBINATION, occurrences, variantById } from './lib/phraseVariants';

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
    const comboFile = arg('combos-file');
    const only = comboFile ? new Set((JSON.parse(fs.readFileSync(comboFile, 'utf8')) as string[][]).map(([s, m]) => `${s}|${m}`)) : null;
    const rows = (await load()).filter((r) => !only || only.has(`${r.natal_sun_sign}|${r.natal_moon_sign}`));

    // combination -> variant id -> count
    const byCombo = new Map<string, Map<string, number>>();
    for (const r of rows) {
        const combo = `${r.natal_sun_sign}|${r.natal_moon_sign}`;
        const m = byCombo.get(combo) ?? new Map<string, number>();
        for (const f of FIELDS) for (const [id, n] of occurrences(r[f])) m.set(id, (m.get(id) ?? 0) + n);
        byCombo.set(combo, m);
    }

    const family = arg('family');
    if (family) {
        const fam = FAMILIES.find((f) => f.id === family);
        if (!fam) { console.error(`unknown family ${family}; known: ${FAMILIES.map((f) => f.id).join(', ')}`); process.exit(1); }
        console.log(`Family "${fam.id}" (${fam.what}), occurrences per combination:\n`);
        let total = 0;
        for (const [combo, m] of [...byCombo.entries()].sort()) {
            const parts = fam.variants.map((v) => ({ id: v.id, n: m.get(v.id) ?? 0 })).filter((x) => x.n);
            const sum = parts.reduce((s, x) => s + x.n, 0);
            total += sum;
            console.log(`${combo.replace('|', ' Sun / ')} Moon: ${sum}${parts.length ? '  (' + parts.map((x) => `${x.id} x${x.n}`).join(', ') + ')' : ''}`);
        }
        console.log(`\nTotal across ${byCombo.size} combinations: ${total}`);
    }

    // Violations of the "at most twice" rule
    const violations: string[] = [];
    for (const [combo, m] of byCombo) for (const [id, n] of m) if (n > MAX_PER_COMBINATION) violations.push(`${combo.replace('|', ' Sun / ')} Moon: "${variantById.get(id)!.variant.display}" x${n}`);
    console.log(`\nCombinations: ${byCombo.size}. Phrasings used more than ${MAX_PER_COMBINATION} times in one combination: ${violations.length}`);
    violations.slice(0, 60).forEach((v) => console.log('  - ' + v));
    if (violations.length > 60) console.log(`  ... and ${violations.length - 60} more`);
}

main().catch((e) => { console.error(e); process.exit(1); });
