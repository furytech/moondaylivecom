/**
 * scripts/regen-flagged-triads.ts
 *
 * Rewrites ONLY the flagged lines of stored triad_states rows so daily content makes no body, health or medical claims
 * (src/lib/dailyContentGuard.ts) and follows docs/language-glossary.md: translate, never soften. Lines that are already
 * clean are passed to the model as context and never touched.
 *
 *   physical_guidance  -> new pace-and-energy guidance (when to push, when to slow down, what activity suits the day)
 *   every other field  -> a minimal rewrite: only the medical or clinical wording changes, and each term is replaced by
 *                         its glossary phrase (lived experience, same meaning), never deleted or swapped for a vague stand-in
 *
 * Rows that the 12-row pilot already rewrote are re-checked against the glossary: a non-energy line whose ORIGINAL (from
 * the backup table) had a clinical term is redone from the original, and an energy line that now fails the energy-line
 * rules (for example UK spelling) is regenerated.
 *
 * A row is written only while every column being changed still equals the text this script read. The rollback is
 * triad_states_backup_2026_10_21.
 *
 * Modes
 *   --measure                       counts only, no API calls, no writes
 *   (default) --dry-run --sample=24 reads rows, calls Gemini, writes a before/after report, never writes to the database
 *   --run [--batch=200]             the full regeneration (writes). Resumable: the plan is recomputed from the database.
 *
 *   npx tsx scripts/regen-flagged-triads.ts --measure
 *   npx tsx scripts/regen-flagged-triads.ts --dry-run --sample=24 --out=<folder>
 *   npx tsx scripts/regen-flagged-triads.ts --run --out=<folder>
 *
 * Stops when more than 5% of API calls fail or more than 10% of rows fail every retry (judged after 40 of each).
 * Needs GEMINI_API_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local; Telegram updates if TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are set.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { BODY_CLAIM_TERMS, findBodyClaims } from '../src/lib/dailyContentGuard';
import { assignVariety, findUnassignedCrutches, varietyInstruction, windowProblems, WINDOW } from './lib/triadVariety';
import { judgeRewrites, QuotaExhausted, isDailyQuota, JUDGE_MODEL, Overloaded, OVERLOAD_PATIENCE_MS, waitOrGiveUp, type Patience } from './lib/rewriteJudge';
import { GLOSSARY_PROMPT, SUGGESTED_PHRASE, TRANSLATION_KEYS, VAGUE_SUBSTITUTES, findUkSpelling, requiredTranslation } from './lib/languageGlossary';

for (const f of ['.env.local', '.env']) {
    const p = path.resolve(process.cwd(), f);
    if (fs.existsSync(p)) dotenv.config({ path: p });
}

// ── Config ────────────────────────────────────────────────────────────────────
const MODEL        = JUDGE_MODEL; // gemini-3.6-flash: one model for the writer and the editor, no mixing
const PACING_MS    = 200;
const MAX_RETRIES  = 5;
const GEMINI_KEY   = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TG_TOKEN     = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID   = process.env.TELEGRAM_CHAT_ID;
const BACKUP_TABLE = 'triad_states_backup_2026_10_21';
// USD per million tokens: Google's published gemini-3.8-flash price through 2026-12-31 (as given by the owner). Thinking tokens bill as output.
const RATE_IN = 0.75, RATE_OUT = 3.75;

const arg = (name: string, fallback?: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const flag = (name: string) => process.argv.includes(`--${name}`);
const SAMPLE      = Number(arg('sample', '24'));
const OUT         = arg('out', '.')!;
const BATCH       = Number(arg('batch', '200'));
const CONCURRENCY = Number(arg('concurrency', '6'));
/** Hard spending cap in dollars: no new API call starts once the tokens used so far cost this much. */
const BUDGET_USD  = Number(arg('budget-usd', '20'));
const RETRY_REVIEW = flag('retry-review');
const LIMIT       = Number(arg('limit', '0'));
/** Stop starting new rows once this many API calls (drafts and editor reads) have been made; 0 = no budget. For a free-tier daily quota. */
const MAX_CALLS   = Number(arg('max-calls', '0'));
const RUN         = flag('run');
const MEASURE     = flag('measure');

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

/** new = fresh energy line; rewrite = glossary translation of a flagged line; redo = pilot line redone from the original; energy-redo = pilot energy line that fails the energy rules */
type Kind = 'new' | 'rewrite' | 'redo' | 'energy-redo';
interface Job {
    row: Row;
    fields: Field[];
    kinds: Partial<Record<Field, Kind>>;
    /** The text to translate (the original when a pilot line is redone), by field */
    source: Partial<Record<Field, string>>;
}

const RULES = `CONTENT RULES (these override everything else):
- Speak to mood, energy, focus, pace, relationships and behaviour.
- Plain everyday self-care is welcome: take a slow walk, rest early, drink some water, stretch, step outside.
- Never use medical, clinical or diagnostic language: no body systems, symptoms, organs, conditions, diagnoses, treatments or health advice, and never explain a mechanism inside the body.
- Warm and specific to this Blueprint, never generic. Reflective, not predictive. Nothing fear-based. US spelling.`;

// ── Planning ──────────────────────────────────────────────────────────────────
const clean = (t: string | null | undefined) => findBodyClaims(t).length === 0;

/** Why a stored energy line fails the energy-line rules (these apply to the pilot's new lines, not to untouched originals). */
function energyProblems(row: Row, text: string): string[] {
    const found = [...findUnassignedCrutches(text, assignVariety(row))];
    const uk = findUkSpelling(text);
    if (uk) found.push(`UK spelling "${uk}"`);
    for (const v of VAGUE_SUBSTITUTES) if (v.test(text)) found.push(`vague stand-in ${v.source}`);
    return found;
}

function planJob(row: Row, orig: Row | undefined): Job | null {
    const job: Job = { row, fields: [], kinds: {}, source: {} };
    for (const f of FIELDS) {
        const live = row[f] ?? '';
        if (!live) continue;
        const original = orig?.[f] ?? live;
        const changed = original !== live; // the pilot rewrote this column
        if (f === 'physical_guidance') {
            if (!clean(live)) { job.fields.push(f); job.kinds[f] = 'new'; job.source[f] = live; }
            else if (changed && energyProblems(row, live).length) { job.fields.push(f); job.kinds[f] = 'energy-redo'; job.source[f] = original; }
            continue;
        }
        if (!clean(live)) { job.fields.push(f); job.kinds[f] = changed ? 'redo' : 'rewrite'; job.source[f] = changed ? original : live; }
        else if (changed && !clean(original)) { job.fields.push(f); job.kinds[f] = 'redo'; job.source[f] = original; }
    }
    return job.fields.length ? job : null;
}

// ── Prompt ────────────────────────────────────────────────────────────────────
function instructionFor(f: Field, job: Job): string {
    const row = job.row;
    const sun = row.natal_sun_sign, moon = row.natal_moon_sign, transit = row.transiting_moon_sign;
    if (f === 'physical_guidance') {
        return `"physical_guidance": "2-3 sentences of PACE-AND-ENERGY guidance: how this ${transit} Moon transit sets the energy of the day for this Blueprint, when to push and when to slow down, and what kind of activity suits the day. ${varietyInstruction(assignVariety(row))} Warm and specific to how a ${sun}/${moon} person experiences ${transit} energy, not generic moon-in-sign information. No medical language."`;
    }
    const src = job.source[f]!;
    return `"${f}": "A minimal rewrite of the ${LABEL[f]} text below. Keep every word that is not medical, clinical or diagnostic exactly as written, and keep its meaning, voice, imagery and length. Replace each medical or clinical term with its glossary phrase (translate, never soften), adjusting only the grammar. TEXT TO REWRITE: ${JSON.stringify(src)}"`;
}

function buildPrompt(job: Job): string {
    const row = job.row;
    const sun = row.natal_sun_sign, moon = row.natal_moon_sign, transit = row.transiting_moon_sign;
    const context = FIELDS.filter((f) => !job.fields.includes(f) && row[f]).map((f) => `- ${LABEL[f]}: ${row[f]}`).join('\n');
    return `You are a depth astrologer writing daily guidance for Moonday Live.

BLUEPRINT: ${sun} Sun + ${moon} Moon — "${row.combination_title ?? ''}"
  Natal Sun element: ${ELEMENT[sun]} | Natal Moon element: ${ELEMENT[moon]}

TODAY'S TRANSITING MOON: ${transit} (${ELEMENT[transit]} · ${MODALITY[transit]})
TRIAD NUMBER: #${row.triad_number ?? ''} of 1,728

The rest of today's guidance for this exact combination is already written. Match its voice and do not repeat it:
${context || '(none)'}

${RULES}

${GLOSSARY_PROMPT}

Write ONLY these fields:
{
  ${job.fields.map((f) => instructionFor(f, job)).join(',\n  ')}
}

Return ONLY valid JSON with exactly those keys, no markdown, no explanation.`;
}

// ── Gemini ────────────────────────────────────────────────────────────────────
interface Usage { prompt: number; output: number; thoughts: number; }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const addUsage = (a: Usage, b: Usage) => { a.prompt += b.prompt; a.output += b.output; a.thoughts += b.thoughts; };
const costUSD = (u: Usage) => (u.prompt * RATE_IN + (u.output + u.thoughts) * RATE_OUT) / 1_000_000;

async function callGemini(prompt: string, patience: Patience): Promise<{ json: Record<string, string>; usage: Usage }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
    for (let attempt = 0; ; attempt++) {
        const t = Date.now();
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.8, maxOutputTokens: 8192, topP: 0.92, responseMimeType: 'application/json' },
            }),
        });
        if (res.status === 429) {
            const body = await res.text();
            if (isDailyQuota(body)) throw new QuotaExhausted(body);
            await waitOrGiveUp(patience, attempt, Date.now() - t, `429 ${body.slice(0, 120)}`);
            continue;
        }
        if (!res.ok) {
            const body = (await res.text()).slice(0, 200);
            // 503 "high demand" and other server-side errors: back off briefly; when this row's patience (about 20s) is used up
            // waitOrGiveUp throws Overloaded and the row goes on the needs-review list.
            if (res.status >= 500) { await waitOrGiveUp(patience, attempt, Date.now() - t, `${res.status} ${body}`); continue; }
            throw new Error(`Gemini ${res.status}: ${body}`);
        }
        const data = await res.json();
        const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const um = data?.usageMetadata ?? {};
        const usage: Usage = { prompt: um.promptTokenCount ?? 0, output: um.candidatesTokenCount ?? 0, thoughts: um.thoughtsTokenCount ?? 0 };
        const stripped = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        try { return { json: JSON.parse(stripped), usage }; }
        catch {
            const m = stripped.match(/\{[\s\S]*\}/);
            if (m) { try { return { json: JSON.parse(m[0]), usage }; } catch { /* fall through */ } }
            if (attempt < 3) continue;
            throw new Error('Could not parse JSON from Gemini response');
        }
    }
}

// ── Validation ────────────────────────────────────────────────────────────────
/** Everything wrong with a draft; an empty list means it can be accepted. `recent` is the last (WINDOW - 1) accepted energy lines. */
function validate(job: Job, json: Record<string, string>, recent: string[]): string[] {
    const problems: string[] = [];
    for (const f of job.fields) {
        const text = typeof json[f] === 'string' ? json[f].trim() : '';
        if (!text) { problems.push(`${f} missing`); continue; }
        const source = job.source[f] ?? '';
        const hits = findBodyClaims(text);
        if (hits.length) problems.push(`${f}: still contains ${hits.join(', ')}`);
        const uk = findUkSpelling(text);
        if (uk && findUkSpelling(source) !== uk) problems.push(`${f}: use US spelling instead of "${uk}"`);
        for (const v of VAGUE_SUBSTITUTES) if (v.test(text) && !v.test(source)) problems.push(`${f}: "${text.match(v)![0]}" is a vague stand-in, say what the term actually does`);
        if (f === 'physical_guidance') {
            if (text.length > 900) problems.push(`${f} too long`);
            for (const c of findUnassignedCrutches(text, assignVariety(job.row))) problems.push(c.startsWith('a ') || c.startsWith('an ') ? `used ${c} without being assigned it` : `problem: ${c}`);
            problems.push(...windowProblems(text, recent));
        } else {
            if (text.length > Math.max(900, source.length * 1.3)) problems.push(`${f} too long`);
            if (text === source) problems.push(`${f} unchanged`);
            for (const label of findBodyClaims(source)) {
                const key = requiredTranslation(label, source);
                if (key && !key.test(text)) problems.push(`${f}: replace "${label}" with the glossary wording, e.g. "${SUGGESTED_PHRASE[label]}"`);
            }
        }
    }
    return problems;
}

/**
 * The copy-editor read of a row's final draft: ONE call covering every rewritten (non-energy) line. It runs only on a draft that
 * already passed every rule-based check. A row it rejects is not retried: it keeps its current text and goes on the review list.
 */
async function judgeRow(job: Job, json: Record<string, string>, used: Usage, patience: Patience): Promise<string[]> {
    const items = job.fields.filter((f) => f !== 'physical_guidance').map((f) => ({ field: f, source: job.source[f]!, rewrite: json[f].trim() }));
    if (!items.length) return [];
    S.calls++;
    try {
        const { failures, tokens } = await judgeRewrites(items, GEMINI_KEY!, patience);
        track(used, tokens);
        return failures.map((x) => `${x.field}: ${x.problems.join(' / ')}`);
    } catch (err) {
        if (err instanceof QuotaExhausted) { stopReason = stopReason || err.message; return ['quota exhausted']; }
        if (err instanceof Overloaded) return ['service busy'];
        S.callFailures++;
        return [`editor check unavailable (${(err as Error).message})`];
    }
}

// ── Data ──────────────────────────────────────────────────────────────────────
async function loadAll(table: string): Promise<Row[]> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY!);
    const rows: Row[] = [];
    // The API returns 1,000 rows at most per request, so page through.
    for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
            .from(table)
            .select('id, natal_sun_sign, natal_moon_sign, transiting_moon_sign, triad_number, combination_title, ' + FIELDS.join(', '))
            .order('triad_number')
            .range(from, from + 999);
        if (error) throw error;
        rows.push(...(data as unknown as Row[]));
        if (!data || data.length < 1000) break;
    }
    return rows;
}

/** The untouched rows from before any rewrite: the JSON export taken with the backup table (service_role has no grant on the table itself). */
function loadBackup(): Promise<Row[]> {
    const file = arg('backup-file');
    if (!file) return loadAll(BACKUP_TABLE);
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    const list = Array.isArray(parsed) ? parsed : (parsed.rows ?? parsed.data ?? (Object.values(parsed)[0] as Row[]));
    return Promise.resolve(list as Row[]);
}

async function plan(): Promise<{ rows: Row[]; jobs: Job[] }> {
    const [rows, backup] = await Promise.all([loadAll('triad_states'), loadBackup()]);
    const byId = new Map(backup.map((r) => [r.id, r]));
    const jobs = rows.map((r) => planJob(r, byId.get(r.id))).filter(Boolean) as Job[];
    return { rows, jobs };
}

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

function summarizePlan(rows: Row[], jobs: Job[]) {
    const perField = Object.fromEntries(FIELDS.map((f) => [f, jobs.filter((j) => j.fields.includes(f)).length]));
    const perKind: Record<string, number> = {};
    for (const j of jobs) for (const f of j.fields) perKind[j.kinds[f]!] = (perKind[j.kinds[f]!] ?? 0) + 1;
    const flaggedRows = rows.filter((r) => FIELDS.some((f) => !clean(r[f]))).length;
    const perTerm = Object.fromEntries(BODY_CLAIM_TERMS.map((t) => [t.term, rows.filter((r) => FIELDS.some((f) => t.re.test(r[f] ?? ''))).length]).filter(([, n]) => (n as number) > 0));
    return { totalRows: rows.length, rowsWithFlaggedLines: flaggedRows, rowsToProcess: jobs.length, linesToProcessPerField: perField, linesToProcessPerKind: perKind, rowsFlaggedPerTerm: perTerm };
}

// ── Processing ────────────────────────────────────────────────────────────────
const S = { rows: 0, written: 0, stale: 0, failedRows: 0, editorRejected: 0, calls: 0, callFailures: 0, attempts: 0, firstTry: 0, retriedRows: 0, usage: { prompt: 0, output: 0, thoughts: 0 } as Usage };
const recentEnergy: string[] = [];
let seq = 0;
let stopReason = '';

function checkStop() {
    if (stopReason) return;
    if (S.calls >= 40 && S.callFailures / S.calls > 0.05) stopReason = `more than 5% of API calls failed (${S.callFailures} of ${S.calls})`;
    else if (S.rows >= 40 && S.failedRows / S.rows > 0.10) stopReason = `more than 10% of rows failed every retry (${S.failedRows} of ${S.rows})`;
}

async function tgSend(msg: string) {
    if (!TG_TOKEN || !TG_CHAT_ID) return;
    try {
        await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TG_CHAT_ID, text: msg }),
        });
    } catch { /* non-fatal */ }
}

interface Result {
    n: number; seq: number | null; id: string; triadNumber: number | null; sun: string; moon: string; transit: string; title: string | null;
    flagged: Field[]; kinds: Partial<Record<Field, Kind>>; attempts: number; rejections: string[]; usage: Usage;
    before: Record<string, string | null>; source: Record<string, string>; after: Record<string, string> | null;
    /**
     * quota = the API quota or the dollar budget ran out mid-row: nothing was written and the row is simply still to do.
     * failed / error / review = the row keeps its current text and goes on the needs-review list (review = the editor read rejected the final draft).
     */
    status: 'dry-run' | 'written' | 'stale' | 'failed' | 'error' | 'review' | 'quota';
    /** The last rejected draft, kept for rows that went on the needs-review list */
    lastDraft?: Record<string, string>;
    /** Wall-clock milliseconds this row took, including retries and the editor read */
    ms?: number;
}

const NEEDS_REVIEW: Result['status'][] = ['failed', 'error', 'review'];
/** Count tokens against the row and against the run as they are used, so the dollar budget sees calls still in flight. */
const track = (used: Usage, u: Usage) => { addUsage(used, u); addUsage(S.usage, u); };

async function processJob(job: Job, n: number, write: boolean, supabase: ReturnType<typeof createClient> | null): Promise<Result> {
    const row = job.row;
    let prompt = buildPrompt(job);
    let after: Record<string, string> | null = null;
    let attempts = 0;
    const used: Usage = { prompt: 0, output: 0, thoughts: 0 };
    const rejections: string[] = [];
    let status: Result['status'] = 'failed';
    let lastDraft: Record<string, string> | undefined;
    const t0 = Date.now();
    const patience: Patience = { ms: OVERLOAD_PATIENCE_MS }; // time this row may spend waiting out a busy service

    while (attempts <= MAX_RETRIES && !after) {
        if (costUSD(S.usage) >= BUDGET_USD) { stopReason = stopReason || `dollar budget of $${BUDGET_USD} reached`; status = 'quota'; break; }
        attempts++;
        let res;
        S.calls++;
        try { res = await callGemini(prompt, patience); }
        catch (err) {
            if (err instanceof QuotaExhausted) { stopReason = stopReason || err.message; status = 'quota'; rejections.push(err.message); break; }
            // A busy service costs nothing and is not an API failure: the row waits briefly, then goes on the needs-review list.
            if (err instanceof Overloaded) { status = 'error'; rejections.push(err.message); break; }
            S.callFailures++; status = 'error'; rejections.push(`API error: ${(err as Error).message}`); break;
        }
        track(used, res.usage);
        lastDraft = res.json;
        let problems = validate(job, res.json, recentEnergy.slice(-(WINDOW - 1)));
        if (problems.length === 0) {
            // One editor read of the final draft (grammar and meaning of every rewritten line). If it rejects, the row is
            // not retried: it keeps its current text and goes on the needs-review list.
            const editor = await judgeRow(job, res.json, used, patience);
            if (editor.includes('quota exhausted')) { status = 'quota'; break; }
            if (editor.includes('service busy')) { status = 'error'; rejections.push('editor read unavailable: service busy, gave up on this row'); break; }
            if (editor.length) { status = 'review'; rejections.push(`editor: ${editor.join('; ')}`); break; }
            // The variety window may have moved while waiting.
            problems = validate(job, res.json, recentEnergy.slice(-(WINDOW - 1)));
        }
        // Validate and accept in one synchronous step so the variety window is exact when workers run side by side.
        if (problems.length === 0) {
            after = Object.fromEntries(job.fields.map((f) => [f, res.json[f].trim()]));
            if (after.physical_guidance) recentEnergy.push(after.physical_guidance);
            break;
        }
        rejections.push(problems.join('; '));
        prompt += `\n\nYOUR LAST DRAFT WAS REJECTED (${problems.join('; ')}). Rewrite those fields fixing exactly that: translate each clinical term with its glossary phrase (never drop it or use a vague stand-in), keep plain self-care, put activities and pace in your own words, use US spelling, and keep each under 900 characters.`;
        await sleep(PACING_MS);
    }

    if (after) {
        status = 'dry-run';
        if (write) {
            // Write only the changed columns, and only while each still equals the text this script read.
            let q = (supabase as any).from('triad_states').update({ ...after, updated_at: new Date().toISOString() }).eq('id', row.id);
            for (const f of job.fields) q = q.eq(f, row[f]);
            const { data, error } = await q.select('id');
            if (error) throw error;
            status = (data?.length ?? 0) === 1 ? 'written' : 'stale';
        }
    } else if (status !== 'error' && status !== 'quota' && status !== 'review') status = 'failed';

    if (status === 'quota') {
        // Not a failure: the daily quota ran out, nothing was written, and the next run picks this row up again.
        return { n, seq: null, id: row.id, triadNumber: row.triad_number, sun: row.natal_sun_sign, moon: row.natal_moon_sign, transit: row.transiting_moon_sign, title: row.combination_title, flagged: job.fields, kinds: job.kinds, attempts, rejections, usage: used, before: {}, source: {}, after: null, status };
    }
    S.rows++; S.attempts += attempts;
    if (status === 'written') S.written++;
    if (status === 'stale') S.stale++;
    if (NEEDS_REVIEW.includes(status)) S.failedRows++;
    if (status === 'review') S.editorRejected++;
    if (after && attempts === 1) S.firstTry++;
    if (attempts > 1) S.retriedRows++;
    checkStop();

    return {
        n, seq: after ? ++seq : null, id: row.id, triadNumber: row.triad_number, sun: row.natal_sun_sign, moon: row.natal_moon_sign, transit: row.transiting_moon_sign,
        title: row.combination_title, flagged: job.fields, kinds: job.kinds, attempts, rejections, usage: used,
        before: Object.fromEntries(job.fields.map((f) => [f, row[f]])), source: job.source as Record<string, string>, after, status,
        ms: Date.now() - t0,
        ...(after ? {} : { lastDraft }),
    };
}

async function runPool<T>(items: T[], size: number, fn: (item: T, index: number) => Promise<void>) {
    let next = 0;
    await Promise.all(Array.from({ length: size }, async () => {
        while (!stopReason) {
            if (MAX_CALLS && S.calls >= MAX_CALLS) { stopReason = `call budget of ${MAX_CALLS} reached (resume later with the same command)`; return; }
            const i = next++;
            if (i >= items.length) return;
            await fn(items[i], i);
            await sleep(PACING_MS);
        }
    }));
}

// ── Dry-run sample ────────────────────────────────────────────────────────────
const score = (j: Job) => {
    const redo = j.fields.filter((f) => j.kinds[f] === 'redo' || j.kinds[f] === 'energy-redo').length;
    const labels = new Set(j.fields.flatMap((f) => (f === 'physical_guidance' ? [] : findBodyClaims(j.source[f]))).filter((l) => TRANSLATION_KEYS[l]));
    return redo * 3 + labels.size * 2 + j.fields.length;
};

/** Per transiting sign: the row that exercises the most (pilot redo, glossary terms, several lines) and a plain energy-only row. */
function pickSample(jobs: Job[], perSign: number): Job[] {
    const picked: Job[] = [];
    for (const sign of SIGNS) {
        const inSign = jobs.filter((j) => j.row.transiting_moon_sign === sign);
        const hardest = [...inSign].sort((a, b) => score(b) - score(a) || hash(a.row.id) - hash(b.row.id))[0];
        const plain = inSign.filter((j) => j !== hardest && j.fields.length === 1 && j.fields[0] === 'physical_guidance').sort((a, b) => hash(a.row.id) - hash(b.row.id))[0];
        const rest = inSign.filter((j) => j !== hardest && j !== plain).sort((a, b) => score(b) - score(a))[0];
        picked.push(...[hardest, plain, rest].filter(Boolean).slice(0, perSign) as Job[]);
    }
    return picked;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1); }
    fs.mkdirSync(OUT, { recursive: true });
    const { rows, jobs } = await plan();
    const planSummary = summarizePlan(rows, jobs);
    console.log(JSON.stringify(planSummary, null, 2));
    if (MEASURE) return;
    if (!GEMINI_KEY) { console.error('GEMINI_API_KEY not set'); process.exit(1); }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const started = Date.now();

    if (!RUN) {
        const sample = pickSample(jobs, Math.max(1, Math.round(SAMPLE / SIGNS.length))).slice(0, SAMPLE);
        console.log(`\nDRY RUN: ${sample.length} sample rows. Nothing is written to the database.\n`);
        const results: Result[] = [];
        await runPool(sample, CONCURRENCY, async (job, i) => {
            const r = await processJob(job, i + 1, false, null);
            results[i] = r;
            console.log(`[${String(i + 1).padStart(2, '0')}/${sample.length}] ${r.sun} Sun • ${r.moon} Moon → ${r.transit}  fields: ${r.flagged.join(', ')}  ${r.after ? `ok (${r.attempts} attempt${r.attempts > 1 ? 's' : ''})` : 'FAILED'}`);
        });
        const done = results.filter(Boolean);
        const ok = done.filter((r) => r.after);
        const wallSeconds = (Date.now() - started) / 1000;
        // Project to every row that needs work, weighting the two kinds of row (energy line only vs rows with rewritten lines) by their real counts.
        const isEnergyOnly = (fields: Field[]) => fields.length === 1 && fields[0] === 'physical_guidance';
        const classOf = (r: { flagged: Field[] }) => (isEnergyOnly(r.flagged) ? 'energyOnly' : 'withRewrites');
        const planCount = { energyOnly: jobs.filter((j) => isEnergyOnly(j.fields)).length, withRewrites: jobs.filter((j) => !isEnergyOnly(j.fields)).length };
        const perClass = (['energyOnly', 'withRewrites'] as const).map((c) => {
            // Rows that finished only: a row that gave up on a busy service costs nothing and would make the projection look cheap.
            const rs = done.filter((r) => classOf(r) === c && r.after);
            const n = Math.max(1, rs.length);
            return { c, sampled: rs.length, planRows: planCount[c], meanCostUSD: rs.reduce((s, r) => s + costUSD(r.usage), 0) / n, meanRowSeconds: rs.reduce((s, r) => s + (r.ms ?? 0), 0) / n / 1000, meanCalls: rs.reduce((s, r) => s + r.attempts, 0) / n };
        });
        const projectedCostUSD = perClass.reduce((s, p) => s + p.meanCostUSD * p.planRows, 0);
        const projectedRowSeconds = perClass.reduce((s, p) => s + p.meanRowSeconds * p.planRows, 0);
        const stats = {
            plan: planSummary,
            model: MODEL, concurrency: CONCURRENCY,
            sampled: done.length, succeeded: ok.length, needsReview: done.length - ok.length,
            needsReviewDetail: done.filter((r) => !r.after).map((r) => ({ n: r.n, status: r.status, row: `${r.sun}/${r.moon}→${r.transit}`, why: (r.rejections.at(-1) ?? '').slice(0, 300) })),
            editorRejected: S.editorRejected,
            passedFirstTry: S.firstTry, totalDraftCalls: S.attempts, totalApiCalls: S.calls,
            tokens: S.usage, sampleCostUSD: +costUSD(S.usage).toFixed(4),
            timing: {
                wallSeconds: +wallSeconds.toFixed(1),
                wallSecondsPerRow: +(wallSeconds / Math.max(1, done.length)).toFixed(1),
                meanSecondsPerRowLatency: +(done.reduce((s, r) => s + (r.ms ?? 0), 0) / Math.max(1, done.length) / 1000).toFixed(1),
            },
            projection: {
                rows: jobs.length,
                perClass: perClass.map((p) => ({ ...p, meanCostUSD: +p.meanCostUSD.toFixed(4), meanRowSeconds: +p.meanRowSeconds.toFixed(1), meanCalls: +p.meanCalls.toFixed(2) })),
                totalCostUSD: +projectedCostUSD.toFixed(2),
                totalMinutesAtThisConcurrency: +(projectedRowSeconds / CONCURRENCY / 60).toFixed(0),
                note: 'The sample is built from the hardest rows plus plain energy-only rows, so this leans high. Time assumes throughput scales with concurrency.',
            },
            ratesUSDPerMillion: { input: RATE_IN, output: RATE_OUT },
        };
        fs.writeFileSync(path.join(OUT, 'dry-run-results.json'), JSON.stringify({ stats, results: done }, null, 2));
        const md: string[] = [`# Triad regeneration: dry run (${new Date().toISOString().slice(0, 10)})`, '', '```json', JSON.stringify(stats, null, 2), '```', ''];
        done.forEach((r) => {
            md.push(`## ${r.n}. ${r.sun} Sun • ${r.moon} Moon → ${r.transit} Moon${r.title ? ` — ${r.title}` : ''}`);
            md.push(`Lines: ${r.flagged.map((f) => `${f} (${r.kinds[f]})`).join(', ')} · attempts: ${r.attempts}`, '');
            for (const f of r.flagged) {
                md.push(`**${LABEL[f]}**`, '', `> BEFORE (stored now): ${r.before[f]}`, '');
                if (r.source[f] && r.source[f] !== r.before[f]) md.push(`> ORIGINAL (backup): ${r.source[f]}`, '');
                md.push(`> AFTER: ${r.after ? r.after[f] : '(failed)'}`, '');
            }
        });
        fs.writeFileSync(path.join(OUT, 'dry-run-samples.md'), md.join('\n'));
        console.log('\n' + JSON.stringify(stats, null, 2));
        return;
    }

    // ── Full run ──
    const logPath = path.join(OUT, 'run-log.jsonl');
    const reviewPath = path.join(OUT, 'needs-review.jsonl');
    // Resume: the plan is recomputed from the database, so rows already written drop out by themselves. Rows already on the
    // needs-review list are skipped (so a resume does not spend money on them again) unless --retry-review is passed.
    const reviewed = new Set<string>(
        !RETRY_REVIEW && fs.existsSync(reviewPath) ? fs.readFileSync(reviewPath, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l).id) : []
    );
    const queue = [...jobs].filter((j) => !reviewed.has(j.row.id)).sort((a, b) => hash(a.row.id) - hash(b.row.id)); // mixed order, so neighbours in the variety window differ
    const todo = LIMIT ? queue.slice(0, LIMIT) : queue;
    await tgSend(`Triad regeneration started: ${todo.length} rows in batches of ${BATCH}, budget $${BUDGET_USD}.`);
    console.log(`\nFULL RUN: ${todo.length} rows (${reviewed.size} on the needs-review list skipped), batches of ${BATCH}, concurrency ${CONCURRENCY}, budget $${BUDGET_USD}. Writes to triad_states.\n`);

    for (let b = 0; b < todo.length && !stopReason; b += BATCH) {
        const batch = todo.slice(b, b + BATCH);
        await runPool(batch, CONCURRENCY, async (job, i) => {
            const r = await processJob(job, b + i + 1, true, supabase);
            if (r.status !== 'quota') fs.appendFileSync(r.after ? logPath : reviewPath, JSON.stringify(r) + '\n');
            if ((S.rows % 25) === 0) console.log(`  ${S.rows}/${todo.length} rows · written ${S.written} · needs review ${S.failedRows} · stale ${S.stale} · $${costUSD(S.usage).toFixed(2)}`);
        });
        const line = `Batch ${Math.floor(b / BATCH) + 1}/${Math.ceil(todo.length / BATCH)} done: ${S.rows}/${todo.length} rows, written ${S.written}, failed ${S.failedRows}, stale ${S.stale}, cost so far $${costUSD(S.usage).toFixed(2)}.`;
        console.log(line);
        await tgSend(line);
    }

    const summary = {
        stoppedEarly: stopReason || null,
        model: MODEL, concurrency: CONCURRENCY, budgetUSD: BUDGET_USD,
        rowsPlanned: todo.length, rowsProcessed: S.rows, written: S.written, staleSkipped: S.stale, needsReview: S.failedRows, ofWhichEditorRejected: S.editorRejected,
        apiCalls: S.calls, apiCallFailures: S.callFailures, firstTryRows: S.firstTry, rowsNeedingRetry: S.retriedRows,
        tokens: S.usage, actualCostUSD: +costUSD(S.usage).toFixed(2),
        ratesUSDPerMillion: { input: RATE_IN, output: RATE_OUT },
        minutes: +((Date.now() - started) / 60000).toFixed(1),
    };
    fs.writeFileSync(path.join(OUT, 'run-summary.json'), JSON.stringify(summary, null, 2));
    console.log('\n' + JSON.stringify(summary, null, 2));
    await tgSend(stopReason ? `Triad regeneration STOPPED: ${stopReason}. Written so far: ${S.written}.` : `Triad regeneration complete: ${S.written} rows written, ${S.failedRows} failed, $${costUSD(S.usage).toFixed(2)}.`);
    if (stopReason) process.exit(2);
}

main().catch((err) => { console.error(err); process.exit(1); });
