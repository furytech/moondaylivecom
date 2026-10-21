/**
 * scripts/regen-flagged-triads.ts
 *
 * Rewrites ONLY the flagged lines of stored triad_states rows so daily content makes no medical or pseudo-medical
 * claims (see src/lib/dailyContentGuard.ts). Lines that are already clean are passed to the model as context and
 * never touched.
 *
 *   physical_guidance  -> new pace-and-energy guidance (when to push, when to slow down, what activity suits the day)
 *   every other field  -> a minimal rewrite that keeps its meaning, voice and length
 *
 * Modes
 *   Dry run (default). Reads rows and calls Gemini; writes nothing to the database. Saves a before/after report.
 *     npx tsx scripts/regen-flagged-triads.ts --dry-run --sample=24 --out=<folder>
 *
 *   Pilot write. Applies reviewed dry-run results (no new Gemini calls) for one row per transiting sign.
 *   Only the flagged columns are updated, and only if the stored text still equals the "before" text in the
 *   report, so nothing edited since the dry run is overwritten. The rollback is triad_states_backup_2026_10_21.
 *     npx tsx scripts/regen-flagged-triads.ts --write --apply-from=<dry-run-results.json> --pilot=12 --out=<folder>
 *
 *   The full run is not enabled in this version: --write requires --apply-from and --pilot.
 *
 * Needs GEMINI_API_KEY (dry run) and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { findBodyClaims } from '../src/lib/dailyContentGuard';
import { assignVariety, findUnassignedCrutches, fiveGrams, varietyInstruction, ACTIVITY_POOLS, CLOSINGS, OPENINGS, PACE_SHAPES } from './lib/triadVariety';

for (const f of ['.env.local', '.env']) {
    const p = path.resolve(process.cwd(), f);
    if (fs.existsSync(p)) dotenv.config({ path: p });
}

// ── Config ────────────────────────────────────────────────────────────────────
const MODEL       = 'gemini-3.5-flash-lite';
const PACING_MS   = 1200;
const MAX_RETRIES = 3;
const GEMINI_KEY  = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const arg = (name: string, fallback?: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const SAMPLE = Number(arg('sample', '24'));
const OUT    = arg('out', '.');
const WRITE  = process.argv.includes('--write');
const APPLY_FROM = arg('apply-from');
const PILOT  = Number(arg('pilot', '0'));
/** A five-word phrase may appear in at most this many accepted energy lines in one run. */
const MAX_PHRASE_ROWS = Number(arg('max-phrase-rows', '2'));

if (WRITE && (!APPLY_FROM || !PILOT)) {
    console.error('--write needs --apply-from=<dry-run-results.json> and --pilot=<n>. The full run is not enabled in this version.');
    process.exit(1);
}

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ELEMENT: Record<string, string> = { Aries:'Fire', Leo:'Fire', Sagittarius:'Fire', Taurus:'Earth', Virgo:'Earth', Capricorn:'Earth', Gemini:'Air', Libra:'Air', Aquarius:'Air', Cancer:'Water', Scorpio:'Water', Pisces:'Water' };
const MODALITY: Record<string, string> = { Aries:'Cardinal', Cancer:'Cardinal', Libra:'Cardinal', Capricorn:'Cardinal', Taurus:'Fixed', Leo:'Fixed', Scorpio:'Fixed', Aquarius:'Fixed', Gemini:'Mutable', Virgo:'Mutable', Sagittarius:'Mutable', Pisces:'Mutable' };

const FIELDS = ['physical_guidance', 'emotional_guidance', 'spiritual_guidance', 'daily_ritual', 'shadow_activation', 'integration_invitation'] as const;
type Field = (typeof FIELDS)[number];

const LABEL: Record<Field, string> = {
    physical_guidance: 'Energy and pace',
    emotional_guidance: 'Emotional tone',
    spiritual_guidance: 'Spiritual invitation',
    daily_ritual: 'Daily practice',
    shadow_activation: 'Shadow activation',
    integration_invitation: 'Integration invitation',
};

type Row = {
    id: string;
    natal_sun_sign: string;
    natal_moon_sign: string;
    transiting_moon_sign: string;
    triad_number: number | null;
    combination_title: string | null;
} & Record<Field, string | null>;

const RULES = `CONTENT RULES (these override everything else):
- Speak to mood, energy, focus, pace, relationships and behaviour.
- Plain everyday self-care is welcome: take a slow walk, rest early, drink some water, stretch, step outside.
- Never use medical or pseudo-medical language: no body systems, symptoms, organs, nervous system, circulation, spinal fluid, hormones, diagnoses, treatments or health advice, and never explain a mechanism inside the body.
- Warm and specific to this Blueprint, never generic. Reflective, not predictive. Nothing fear-based.`;

function instructionFor(field: Field, row: Row): string {
    const sun = row.natal_sun_sign, moon = row.natal_moon_sign, transit = row.transiting_moon_sign;
    if (field === 'physical_guidance') {
        return `"physical_guidance": "2-3 sentences of PACE-AND-ENERGY guidance: how this ${transit} Moon transit sets the energy of the day for this Blueprint, when to push and when to slow down, and what kind of activity suits the day. ${varietyInstruction(assignVariety(row))} Warm and specific to how a ${sun}/${moon} person experiences ${transit} energy, not generic moon-in-sign information. No medical language."`;
    }
    return `"${field}": "A minimal rewrite of the ${LABEL[field]} text below. Keep its meaning, voice, imagery and length; change only the wording that is medical or pseudo-medical. TEXT TO REWRITE: ${JSON.stringify(row[field])}"`;
}

function buildPrompt(row: Row, flagged: Field[]): string {
    const sun = row.natal_sun_sign, moon = row.natal_moon_sign, transit = row.transiting_moon_sign;
    const context = FIELDS.filter((f) => !flagged.includes(f) && row[f])
        .map((f) => `- ${LABEL[f]}: ${row[f]}`)
        .join('\n');
    return `You are a depth astrologer writing daily guidance for Moonday Live.

BLUEPRINT: ${sun} Sun + ${moon} Moon — "${row.combination_title ?? ''}"
  Natal Sun element: ${ELEMENT[sun]} | Natal Moon element: ${ELEMENT[moon]}

TODAY'S TRANSITING MOON: ${transit} (${ELEMENT[transit]} · ${MODALITY[transit]})
TRIAD NUMBER: #${row.triad_number ?? ''} of 1,728

The rest of today's guidance for this exact combination is already written. Match its voice and do not repeat it:
${context || '(none)'}

${RULES}

Write ONLY these fields:
{
  ${flagged.map((f) => instructionFor(f, row)).join(',\n  ')}
}

Return ONLY valid JSON with exactly those keys, no markdown, no explanation.`;
}

interface Usage { prompt: number; output: number; thoughts: number; }

async function callGemini(prompt: string): Promise<{ json: Record<string, string>; usage: Usage }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
    for (let attempt = 0; ; attempt++) {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.8, maxOutputTokens: 2048, topP: 0.92, responseMimeType: 'application/json' },
            }),
        });
        if (res.status === 429 && attempt < 4) { await sleep(30000 * Math.pow(2, attempt)); continue; }
        if (!res.ok) {
            if (attempt < 3) { await sleep(2000 * Math.pow(2, attempt)); continue; }
            throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
        }
        const data = await res.json();
        const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const um = data?.usageMetadata ?? {};
        const usage: Usage = { prompt: um.promptTokenCount ?? 0, output: um.candidatesTokenCount ?? 0, thoughts: um.thoughtsTokenCount ?? 0 };
        const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        try { return { json: JSON.parse(clean), usage }; }
        catch {
            const m = clean.match(/\{[\s\S]*\}/);
            if (m) return { json: JSON.parse(m[0]), usage };
            if (attempt < 3) continue;
            throw new Error('Could not parse JSON from Gemini response');
        }
    }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function flaggedFields(row: Row): Field[] {
    return FIELDS.filter((f) => findBodyClaims(row[f]).length > 0);
}

async function loadAllRows(): Promise<Row[]> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY!);
    const rows: Row[] = [];
    // The API returns 1,000 rows at most per request, so page through.
    for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
            .from('triad_states')
            .select('id, natal_sun_sign, natal_moon_sign, transiting_moon_sign, triad_number, combination_title, ' + FIELDS.join(', '))
            .order('triad_number')
            .range(from, from + 999);
        if (error) throw error;
        rows.push(...(data as unknown as Row[]));
        if (!data || data.length < 1000) break;
    }
    return rows;
}

/** Two rows per transiting sign: one where only the energy line is flagged, one where other lines are flagged too. */
function pickSample(rows: Row[], perSign: number): Row[] {
    const picked: Row[] = [];
    SIGNS.forEach((transit, ti) => {
        const flagged = rows.filter((r) => r.transiting_moon_sign === transit && flaggedFields(r).length > 0);
        const onlyPhysical = flagged.filter((r) => flaggedFields(r).length === 1);
        const several = flagged.filter((r) => flaggedFields(r).length > 1);
        const take = (pool: Row[], offset: number) => (pool.length ? pool[(ti * 7 + offset) % pool.length] : undefined);
        const chosen = [take(onlyPhysical, 0), take(several, 3), take(flagged, 11)].filter(Boolean) as Row[];
        const unique = [...new Map(chosen.map((r) => [r.id, r])).values()];
        picked.push(...unique.slice(0, perSign));
    });
    return picked;
}

/**
 * Pilot write: applies the reviewed "after" text from a dry-run report to one row per transiting sign.
 * Only the flagged columns change, and only while the stored text still equals the report's "before" text.
 */
async function applyPilot() {
    const report = JSON.parse(fs.readFileSync(APPLY_FROM!, 'utf8')) as { results: any[] };
    // A row is held back if any of its lines shares a five-word phrase with more than MAX_PHRASE_ROWS rows of the report.
    const rowsByGram = new Map<string, Set<number>>();
    for (const x of report.results) for (const text of Object.values((x.after ?? {}) as Record<string, string>)) for (const g of fiveGrams(text)) (rowsByGram.get(g) ?? rowsByGram.set(g, new Set()).get(g)!).add(x.n);
    const repeats = (x: any) => Object.values(x.after as Record<string, string>).some((text) => [...fiveGrams(text)].some((g) => (rowsByGram.get(g)?.size ?? 0) > MAX_PHRASE_ROWS));
    // One row per transiting sign: prefer the row with the most flagged columns, so the pilot exercises the other columns too.
    const picked: any[] = [];
    for (const sign of SIGNS) {
        const candidates = report.results.filter((x) => x.transit === sign && x.after && !repeats(x)).sort((a, b) => b.flagged.length - a.flagged.length || a.n - b.n);
        if (candidates[0]) picked.push(candidates[0]);
    }
    if (picked.length > PILOT) picked.length = PILOT;
    console.log(`PILOT WRITE: ${picked.length} rows (one per transiting sign), flagged columns only.\n`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY!);
    const log: any[] = [];
    for (const r of picked) {
        const cols = r.flagged as Field[];
        const after: Record<string, string> = r.after;
        // Refuse anything that is not clean, whatever the report says.
        const bad = cols.flatMap((f) => findBodyClaims(after[f]).map((t) => `${f}: ${t}`));
        if (bad.length) throw new Error(`Row ${r.id} fails the body-claims guard (${bad.join(', ')}); nothing more is written.`);

        let q = supabase.from('triad_states').update({ ...after, updated_at: new Date().toISOString() }).eq('id', r.id);
        for (const f of cols) q = q.eq(f, r.before[f]);
        const { data, error } = await q.select('id');
        if (error) throw error;
        const updated = data?.length ?? 0;
        console.log(`${r.sun} Sun • ${r.moon} Moon → ${r.transit}: ${cols.join(', ')} ${updated === 1 ? 'updated' : 'NOT UPDATED (stored text changed or row missing)'}`);
        log.push({ id: r.id, sun: r.sun, moon: r.moon, transit: r.transit, columns: cols, updated: updated === 1, before: r.before, after });
    }
    fs.mkdirSync(OUT!, { recursive: true });
    fs.writeFileSync(path.join(OUT!, 'pilot-write-log.json'), JSON.stringify(log, null, 2));
    const failed = log.filter((l) => !l.updated).length;
    console.log(`\n${log.length - failed} of ${log.length} rows updated. Log: ${path.join(OUT!, 'pilot-write-log.json')}`);
    if (failed) process.exit(1);
}

async function main() {
    if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1); }
    if (WRITE) { await applyPilot(); return; }
    if (!GEMINI_KEY) { console.error('GEMINI_API_KEY not set'); process.exit(1); }
    fs.mkdirSync(OUT!, { recursive: true });

    const rows = await loadAllRows();
    const needing = rows.filter((r) => flaggedFields(r).length > 0);
    console.log(`Rows: ${rows.length}. Rows with at least one flagged line: ${needing.length}.`);
    const perField = Object.fromEntries(FIELDS.map((f) => [f, rows.filter((r) => findBodyClaims(r[f]).length > 0).length]));
    console.log('Flagged lines per field:', perField);

    const sample = pickSample(rows, Math.max(1, Math.round(SAMPLE / SIGNS.length))).slice(0, SAMPLE);
    console.log(`DRY RUN: ${sample.length} sample rows. Nothing is written to the database.\n`);

    const results: any[] = [];
    const phraseRows = new Map<string, number>(); // five-word phrase -> accepted energy lines containing it
    let firstTry = 0;
    const tot: Usage = { prompt: 0, output: 0, thoughts: 0 };

    for (let i = 0; i < sample.length; i++) {
        const row = sample[i];
        const flagged = flaggedFields(row);
        const label = `${row.natal_sun_sign} Sun • ${row.natal_moon_sign} Moon → ${row.transiting_moon_sign}`;
        process.stdout.write(`[${String(i + 1).padStart(2, '0')}/${sample.length}] ${label.padEnd(46)} fields: ${flagged.join(', ')}`);

        let prompt = buildPrompt(row, flagged);
        let after: Record<string, string> | null = null;
        let attempts = 0;
        const used: Usage = { prompt: 0, output: 0, thoughts: 0 };
        const rejections: string[] = [];

        while (attempts <= MAX_RETRIES) {
            attempts++;
            const { json, usage } = await callGemini(prompt);
            used.prompt += usage.prompt; used.output += usage.output; used.thoughts += usage.thoughts;
            const missing = flagged.filter((f) => typeof json[f] !== 'string' || !json[f].trim());
            const hits = flagged.flatMap((f) => findBodyClaims(json[f]).map((t) => `${f}: ${t}`));
            const tooLong = flagged.filter((f) => (json[f]?.length ?? 0) > 900);
            const energyDraft = flagged.includes('physical_guidance') ? json.physical_guidance ?? '' : '';
            const crutches = energyDraft ? findUnassignedCrutches(energyDraft, assignVariety(row)) : [];
            const repeated = energyDraft ? [...fiveGrams(energyDraft)].filter((g) => (phraseRows.get(g) ?? 0) >= MAX_PHRASE_ROWS) : [];
            if (missing.length === 0 && hits.length === 0 && tooLong.length === 0 && crutches.length === 0 && repeated.length === 0) {
                after = Object.fromEntries(flagged.map((f) => [f, json[f].trim()]));
                if (energyDraft) for (const g of fiveGrams(after.physical_guidance)) phraseRows.set(g, (phraseRows.get(g) ?? 0) + 1);
                break;
            }
            const why = [
                ...missing.map((f) => `${f} missing`), ...hits, ...tooLong.map((f) => `${f} too long`),
                ...crutches.map((c) => (c.startsWith('a ') || c.startsWith('an ') ? `used ${c} without being assigned it` : `problem: ${c}`)),
                ...repeated.slice(0, 3).map((g) => `the phrase "${g}" is already used in other days`),
            ].join('; ');
            rejections.push(why);
            prompt += `\n\nYOUR LAST DRAFT WAS REJECTED (${why}). Rewrite those fields with no medical or pseudo-medical language (plain self-care suggestions are fine), put the activity and pace in your own words, and keep each under 900 characters.`;
            await sleep(PACING_MS);
        }

        tot.prompt += used.prompt; tot.output += used.output; tot.thoughts += used.thoughts;
        if (after && attempts === 1) firstTry++;
        console.log(after ? `  ok (${attempts} attempt${attempts > 1 ? 's' : ''})` : '  FAILED');

        results.push({
            n: i + 1, id: row.id, triadNumber: row.triad_number, sun: row.natal_sun_sign, moon: row.natal_moon_sign, transit: row.transiting_moon_sign,
            title: row.combination_title, flagged, attempts, rejections, usage: used,
            before: Object.fromEntries(flagged.map((f) => [f, row[f]])), after,
        });
        await sleep(PACING_MS);
    }

    // ── Report ────────────────────────────────────────────────────────────────
    const ok = results.filter((r) => r.after);
    const avg = (n: number) => Math.round(n / Math.max(1, results.length));
    const per = { prompt: avg(tot.prompt), output: avg(tot.output + tot.thoughts) };
    const cost = (inRate: number, outRate: number, n: number) =>
        ((per.prompt * n * inRate + per.output * n * outRate) / 1_000_000);
    const len = (f: Field, side: 'before' | 'after') => {
        const xs = ok.filter((r) => r[side][f]).map((r) => r[side][f].length).sort((a: number, b: number) => a - b);
        return xs.length ? xs[xs.length >> 1] : 0;
    };

    const energy = ok.map((r) => (r.after.physical_guidance ?? '') as string).filter(Boolean);
    const lastSentence = (x: string) => x.trim().split(/(?<=[.!?])\s+/).pop() ?? '';
    const firstWords = (x: string, n: number) => x.trim().toLowerCase().split(/\s+/).slice(0, n).join(' ');
    const tally = (xs: string[]) => {
        const m = new Map<string, number>();
        xs.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1));
        return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    };
    // How the assignments spread over every row that needs regeneration (the model picks one of three ideas each time).
    const offered = new Map<string, number>();
    const closingsUsed = new Map<string, number>();
    const shapesUsed = new Map<string, number>();
    for (const r of needing) {
        const a = assignVariety(r);
        a.activities.forEach((x) => offered.set(x, (offered.get(x) ?? 0) + 1));
        closingsUsed.set(a.closing, (closingsUsed.get(a.closing) ?? 0) + 1);
        shapesUsed.set(a.paceShape, (shapesUsed.get(a.paceShape) ?? 0) + 1);
    }
    const topOffered = [...offered.entries()].sort((a, b) => b[1] - a[1])[0];
    const variety = {
        sampleEnergyLines: energy.length,
        mentionWalk: energy.filter((x) => /\bwalk/i.test(x)).length,
        mentionEarlyNight: energy.filter((x) => /early night|rest early|bed early/i.test(x)).length,
        mentionWaterBreak: energy.filter((x) => /glass of (cool )?water|drink some water/i.test(x)).length,
        mostRepeatedOpening3Words: tally(energy.map((x) => firstWords(x, 3))),
        mostRepeatedClosing4Words: tally(energy.map((x) => firstWords(lastSentence(x), 4))),
        assignmentAcrossAllRows: {
            rows: needing.length,
            activityIdeas: Object.values(ACTIVITY_POOLS).flat().length,
            mostOfferedIdeaShareOfRows: `${((topOffered[1] / needing.length) * 100).toFixed(1)}% (${topOffered[0]}); the model picks one of three, so its real share is about a third of that`,
            openingStyles: OPENINGS.length,
            closingStyles: CLOSINGS.length,
            largestClosingStyleShare: `${((Math.max(...closingsUsed.values()) / needing.length) * 100).toFixed(1)}%`,
            paceShapes: Object.values(PACE_SHAPES).flat().length,
            largestPaceShapeShare: `${((Math.max(...shapesUsed.values()) / needing.length) * 100).toFixed(1)}%`,
        },
    };

    const stats = {
        variety,
        sampled: results.length, succeeded: ok.length, failed: results.length - ok.length,
        passedFirstTry: firstTry, totalAttempts: results.reduce((a, r) => a + r.attempts, 0),
        avgTokensPerRow: per, rowsNeedingRegen: needing.length,
        estimatedFullRunUSD: {
            at_0_10_in_0_40_out: +cost(0.10, 0.40, needing.length).toFixed(2),
            at_0_25_in_1_50_out: +cost(0.25, 1.50, needing.length).toFixed(2),
        },
        medianLength: {
            physical_guidance: { before: len('physical_guidance', 'before'), after: len('physical_guidance', 'after') },
        },
    };

    fs.writeFileSync(path.join(OUT!, 'dry-run-results.json'), JSON.stringify({ stats, results }, null, 2));

    const md: string[] = [`# Triad regeneration: dry run (${new Date().toISOString().slice(0, 10)})`, '', '```json', JSON.stringify(stats, null, 2), '```', ''];
    for (const r of results) {
        md.push(`## ${r.n}. ${r.sun} Sun • ${r.moon} Moon → ${r.transit} Moon${r.title ? ` — ${r.title}` : ''}`);
        md.push(`Flagged: ${r.flagged.join(', ')} · attempts: ${r.attempts}${r.rejections.length ? ` · rejected drafts: ${r.rejections.join(' | ')}` : ''}`, '');
        for (const f of r.flagged as Field[]) {
            md.push(`**${LABEL[f]}**`, '', `> BEFORE: ${r.before[f]}`, '', `> AFTER: ${r.after ? r.after[f] : '(failed)'}`, '');
        }
    }
    fs.writeFileSync(path.join(OUT!, 'dry-run-samples.md'), md.join('\n'));

    console.log('\n' + JSON.stringify(stats, null, 2));
    console.log(`\nSaved: ${path.join(OUT!, 'dry-run-samples.md')}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
