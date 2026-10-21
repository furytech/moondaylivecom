/**
 * scripts/check-regen-output.ts
 *
 * Independent check of a dry-run report from regen-flagged-triads.ts. Read-only: touches no database and calls no API.
 *
 *   npx tsx scripts/check-regen-output.ts <dry-run-results.json> [--max-rows=2]
 *
 * Fails (exit 1) when any rewritten line has:
 *   - a five-word phrase that appears in more than --max-rows rows (energy lines, and separately every rewritten field)
 *   - a clipped or awkward opening, a missing full stop, an ellipsis
 *   - body or medical language (dailyContentGuard), body parts or sensations, or season / time-of-year words
 */
import * as fs from 'fs';
import { findBodyClaims } from '../src/lib/dailyContentGuard';
import { assignVariety, findStyleProblems, findUnassignedCrutches, fiveGrams } from './lib/triadVariety';

const file = process.argv.find((a, i) => i >= 2 && !a.startsWith('--'));
if (!file) { console.error('Usage: npx tsx scripts/check-regen-output.ts <dry-run-results.json> [--max-rows=2]'); process.exit(1); }
const maxRows = Number(process.argv.find((a) => a.startsWith('--max-rows='))?.split('=')[1] ?? '2');

const { results } = JSON.parse(fs.readFileSync(file, 'utf8')) as { results: any[] };
const done = results.filter((r) => r.after);
const problems: string[] = [];

// 1. Phrases of five or more words repeated across rows.
function repeated(label: string, lines: Array<{ n: number; text: string }>) {
    const rowsByGram = new Map<string, Set<number>>();
    for (const { n, text } of lines) for (const g of fiveGrams(text)) (rowsByGram.get(g) ?? rowsByGram.set(g, new Set()).get(g)!).add(n);
    const over = [...rowsByGram.entries()].filter(([, rows]) => rows.size > maxRows).sort((a, b) => b[1].size - a[1].size);
    console.log(`${label}: ${lines.length} lines, ${rowsByGram.size} distinct five-word phrases, ${over.length} used in more than ${maxRows} rows`);
    for (const [g, rows] of over.slice(0, 15)) { console.log(`   "${g}" in rows ${[...rows].join(', ')}`); problems.push(`${label}: "${g}" repeated in ${rows.size} rows`); }
}
repeated('Energy lines', done.filter((r) => r.after.physical_guidance).map((r) => ({ n: r.n, text: r.after.physical_guidance })));
repeated('All rewritten lines', done.flatMap((r) => Object.values(r.after as Record<string, string>).map((text) => ({ n: r.n, text }))));

// 2. Per-line problems.
for (const r of results) {
    if (!r.after) { problems.push(`row ${r.n}: no rewrite produced`); continue; }
    for (const [field, text] of Object.entries(r.after as Record<string, string>)) {
        const hits = [
            ...findBodyClaims(text).map((t) => `body/medical term (${t})`),
            ...(field === 'physical_guidance' ? findUnassignedCrutches(text, assignVariety({ triad_number: r.triadNumber ?? null, natal_sun_sign: r.sun, natal_moon_sign: r.moon, transiting_moon_sign: r.transit })) : findStyleProblems(text)),
        ];
        for (const h of hits) problems.push(`row ${r.n} ${r.sun}/${r.moon}→${r.transit} ${field}: ${h}`);
    }
}

console.log(problems.length ? `\n${problems.length} problem(s):\n` + problems.map((p) => ' - ' + p).join('\n') : '\nPASS: no repeated phrases, no clipped openings, no body or season language.');
process.exit(problems.length ? 1 : 0);
