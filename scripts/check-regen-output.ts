/**
 * scripts/check-regen-output.ts
 *
 * Independent check of a report from regen-flagged-triads.ts (dry-run-results.json or run-log.jsonl). Read-only: touches no
 * database and calls no API. It re-reads the rewritten text and applies the rules again, so a bug in the generator's own
 * gate cannot hide a problem.
 *
 *   npx tsx scripts/check-regen-output.ts <dry-run-results.json | run-log.jsonl>
 *
 * Fails (exit 1) when any rewritten line has:
 *   - body, medical, clinical, diagnosis or condition language (dailyContentGuard)
 *   - a clinical term replaced by a vague stand-in instead of the glossary wording (docs/language-glossary.md)
 *   - UK spelling, or a vague stand-in that the original did not have
 *   - an energy line with an assigned-crutch, a body part (legs, pulse, heartbeat), a season word, a copied idea,
 *     a clipped or awkward opening, or an ellipsis
 * and, over any 24 consecutive energy lines (in the order they were accepted):
 *   - a five-word phrase in more than 2 lines
 *   - a three-word opening on more than 2 lines (two-word opening on more than 3)
 */
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { judgeRewrite } from './lib/rewriteJudge';
import { findBodyClaims } from '../src/lib/dailyContentGuard';
import { assignVariety, findUnassignedCrutches, windowProblems, WINDOW } from './lib/triadVariety';
import { VAGUE_SUBSTITUTES, findUkSpelling, SUGGESTED_PHRASE, requiredTranslation } from './lib/languageGlossary';

const file = process.argv.find((a, i) => i >= 2 && !a.startsWith('--'));
if (!file) { console.error('Usage: npx tsx scripts/check-regen-output.ts <dry-run-results.json | run-log.jsonl>'); process.exit(1); }

const raw = fs.readFileSync(file, 'utf8');
const results: any[] = file.endsWith('.jsonl')
    ? raw.split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l))
    : JSON.parse(raw).results;
const done = results.filter((r) => r.after);
const problems: string[] = [];
const who = (r: any) => `row ${r.n ?? r.seq} ${r.sun}/${r.moon}→${r.transit}`;

// 1. Per-line rules.
for (const r of results) {
    if (!r.after) { problems.push(`${who(r)}: no rewrite produced`); continue; }
    for (const [field, text] of Object.entries(r.after as Record<string, string>)) {
        const source: string = r.source?.[field] ?? r.before?.[field] ?? '';
        const found: string[] = [];
        for (const t of findBodyClaims(text)) found.push(`still contains ${t}`);
        const uk = findUkSpelling(text);
        if (uk && findUkSpelling(source) !== uk) found.push(`UK spelling "${uk}"`);
        for (const v of VAGUE_SUBSTITUTES) if (v.test(text) && !v.test(source)) found.push(`vague stand-in "${text.match(v)![0]}"`);
        if (field === 'physical_guidance') {
            found.push(...findUnassignedCrutches(text, assignVariety({ triad_number: r.triadNumber ?? null, natal_sun_sign: r.sun, natal_moon_sign: r.moon, transiting_moon_sign: r.transit })));
            if (text.length > 900) found.push('longer than 900 characters');
        } else {
            if (text === source) found.push('unchanged');
            for (const label of findBodyClaims(source)) {
                const key = requiredTranslation(label, source);
                if (key && !key.test(text)) found.push(`"${label}" not translated with the glossary wording (e.g. "${SUGGESTED_PHRASE[label]}")`);
            }
        }
        for (const f of found) problems.push(`${who(r)} ${field}: ${f}`);
    }
}

// 2. Variety across every window of 24 consecutive energy lines, in acceptance order.
const energy = done
    .filter((r) => r.after.physical_guidance)
    .sort((a, b) => (a.seq ?? a.n) - (b.seq ?? b.n))
    .map((r) => ({ r, text: r.after.physical_guidance as string }));
let windowHits = 0;
energy.forEach(({ r, text }, i) => {
    const previous = energy.slice(Math.max(0, i - (WINDOW - 1)), i).map((e) => e.text);
    for (const p of windowProblems(text, previous)) { windowHits++; problems.push(`${who(r)} energy line: ${p}`); }
});

const openings = new Map<string, number>();
energy.forEach(({ text }) => { const o = text.toLowerCase().split(/\s+/).slice(0, 3).join(' '); openings.set(o, (openings.get(o) ?? 0) + 1); });
const top = [...openings.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

// 3. Optional second opinion on grammar and meaning of every rewritten non-energy line (calls the API: pass --judge).
async function judgeAll() {
    if (!process.argv.includes('--judge')) return;
    for (const f of ['.env.local', '.env']) if (fs.existsSync(f)) dotenv.config({ path: f });
    if (!process.env.GEMINI_API_KEY) { problems.push('--judge needs GEMINI_API_KEY'); return; }
    let judged = 0;
    for (const r of done) {
        for (const [field, text] of Object.entries(r.after as Record<string, string>)) {
            if (field === 'physical_guidance') continue;
            const verdict = await judgeRewrite(r.source?.[field] ?? r.before?.[field] ?? '', text, process.env.GEMINI_API_KEY);
            judged++;
            if (!verdict.ok) problems.push(`${who(r)} ${field}: editor read: ${verdict.problems.join(' / ') || 'rejected'}`);
        }
    }
    console.log(`Editor read of ${judged} rewritten non-energy lines.`);
}

async function main() {
    await judgeAll();
    report();
}

function report() {
console.log(`Checked ${results.length} rows (${done.length} rewritten), ${energy.length} energy lines.`);
console.log(`Most common three-word openings: ${top.map(([o, n]) => `"${o}" ×${n}`).join(', ')}`);
console.log(`Variety violations in 24-line windows: ${windowHits}`);
console.log(problems.length ? `\n${problems.length} problem(s):\n` + problems.slice(0, 80).map((p) => ' - ' + p).join('\n') + (problems.length > 80 ? `\n ... and ${problems.length - 80} more` : '') : '\nPASS: no body, clinical or diagnostic language, glossary wording used, US spelling, no repeated phrases or openings.');
process.exit(problems.length ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
