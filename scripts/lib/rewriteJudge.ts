/**
 * scripts/lib/rewriteJudge.ts
 *
 * A second read of a rewritten row. The rule-based gates can confirm that a glossary phrase is present and that no clinical
 * term is left, but not that the sentence still reads naturally or that the meaning survived. This asks the model to act as a
 * copy editor. One call covers every rewritten line of a row.
 */
import { GLOSSARY } from './languageGlossary';

/** One model for the whole run (the writer in regen-flagged-triads.ts uses the same constant). */
export const JUDGE_MODEL = 'gemini-3.6-flash';

/**
 * How long one row may spend waiting out a busy service (503 and the like) in one pass: 3 minutes. When it is used up the row
 * gives up for this pass, keeps its current text, and the run moves on; later passes try it again.
 */
export const OVERLOAD_PATIENCE_MS = 180000;
/** What the API answered, by status, across writer and editor calls (so a concurrency test can show whether 429s appear). */
export const httpStats = { ok: 0, rateLimited429: 0, dailyQuota429: 0, busy503: 0, other5xx: 0, other: 0 };
export function countStatus(status: number, dailyQuota = false): void {
    if (status === 200) httpStats.ok++;
    else if (status === 429) dailyQuota ? httpStats.dailyQuota429++ : httpStats.rateLimited429++;
    else if (status === 503) httpStats.busy503++;
    else if (status >= 500) httpStats.other5xx++;
    else httpStats.other++;
}
export interface Patience { ms: number; }
export class Overloaded extends Error {
    constructor(detail: string) { super(`service busy, gave up on this row: ${detail}`); this.name = 'Overloaded'; }
}
const nap = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Back off (2s, 4s, 8s... up to 30s) from this row's patience, or throw Overloaded when it would run out. */
export async function waitOrGiveUp(p: Patience, attempt: number, spentMs: number, detail: string): Promise<void> {
    p.ms -= spentMs;
    const wait = Math.min(2000 * Math.pow(2, attempt), 30000);
    if (p.ms - wait < 0) throw new Overloaded(detail.slice(0, 160));
    p.ms -= wait;
    await nap(wait);
}
const APPROVED = GLOSSARY.flatMap((g) => g.say).map((s) => `"${s}"`).join(', ');

/** The API key's daily quota is used up (free tier: requests per day). Waiting a few minutes will not help, so callers stop. */
export class QuotaExhausted extends Error {
    constructor(detail: string) {
        super(`Gemini daily quota exhausted: ${(detail.match(/Quota exceeded for metric[^\n]*/)?.[0] ?? detail).slice(0, 200)} ${detail.match(/retry in ([0-9hms.]+)/i)?.[0] ?? ''}`.trim());
        this.name = 'QuotaExhausted';
    }
}
export const isDailyQuota = (body: string): boolean => /free_tier|PerDay|per day|retry in \d+h/i.test(body);

export interface Tokens { prompt: number; output: number; thoughts: number; }
export interface JudgeItem { field: string; source: string; rewrite: string; }
export interface JudgeBatch { failures: Array<{ field: string; problems: string[] }>; tokens: Tokens; }

const judgePrompt = (items: JudgeItem[]) => `You are a strict copy editor. Lines of astrology guidance were rewritten so that medical, clinical or diagnostic wording is replaced by plain, lived-experience wording. Everything else should be unchanged.

${items.map((it, i) => `LINE ${i + 1} (${it.field})\nSOURCE: ${JSON.stringify(it.source)}\nREWRITE: ${JSON.stringify(it.rewrite)}`).join('\n\n')}

For each line, judge ONLY the places where the rewrite differs from the source. Ignore awkwardness that is already in the source. A line fails if any changed passage:
1. is ungrammatical or reads unnaturally (a pasted phrase that does not fit the sentence, a doubled article such as "the ambient a ...", a verb that cannot take the new phrase, a clause that no longer makes sense);
2. changes the meaning or function of the original instead of translating it (a gesture, an instruction or a feeling replaced by something different or vague);
3. still contains or introduces medical, clinical, diagnostic or anatomical wording (organs, nervous system, hormones, symptoms, conditions);
4. is missing a connecting word (by, from, while, as, to, and so on) so that a clause runs straight into the next ("wearing down your sensitivity trying to solve..." instead of "...by trying to solve...");
5. has a clause whose meaning is unclear on first read, or a long glossary clause used where a short noun fits ("tending how you take in and process the day's events", "offering generosity to soothe how you take in...");
6. adds a body part, body region or physical sensation that the SOURCE did not have (for example "upper body", "lower back", "hips", "pelvis", "jaw", "shoulders", "tight", "clenched"). The only body meaning allowed is the approved "the stress you carry and feel physically" and the hand over the heart;
7. uses an approved glossary phrase that fits the grammar but not the meaning, so the sentence says something that makes no sense (for example "cool the heated Air element in your sensitivity to everything coming at you": a sensitivity is something you have, nothing sits inside it); or uses "cleansing ritual" for something that is not about bathing or washing (for example "sleep hygiene" must be "sleep routine").
These phrasings are APPROVED replacements and must never be failed for their wording (a hand over the heart, slow breathing, a warm bath or foot soak, eucalyptus, frankincense, "the stress you carry and feel physically", or any of: ${APPROVED}). Fail them only if the sentence around them is ungrammatical, makes no sense, or the meaning changed.
The heart (as in "a hand over your heart") and "a sense of warmth gather and settle" are approved glossary wording and are never an added body part or sensation, even when the source named the chest or belly instead.
Moving where a held object rests is NOT a failure: "hold a stone against your chest" becoming "hold a stone as you rest a hand over your heart" is fine.
Do not fail a line for style preferences or for being longer than the source. Each problem you report should say exactly what to change so the writer can fix it in one revision.
Return ONLY JSON: {"results": [{"line": 1, "ok": true|false, "problems": ["short description of each defect and the exact words; empty when ok"]}, ...]} with one entry per line.`;

export async function judgeRewrites(items: JudgeItem[], apiKey: string, patience: Patience = { ms: OVERLOAD_PATIENCE_MS }): Promise<JudgeBatch> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${JUDGE_MODEL}:generateContent?key=${apiKey}`;
    for (let attempt = 0; ; attempt++) {
        const t = Date.now();
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: judgePrompt(items) }] }],
                generationConfig: { temperature: 0, maxOutputTokens: 8192, thinkingConfig: { thinkingLevel: 'minimal' }, responseMimeType: 'application/json' },
            }),
        });
        if (res.status === 429) {
            const body = await res.text();
            countStatus(429, isDailyQuota(body));
            if (isDailyQuota(body)) throw new QuotaExhausted(body);
            await waitOrGiveUp(patience, attempt, Date.now() - t, `editor 429 ${body.slice(0, 120)}`);
            continue;
        }
        countStatus(res.status);
        if (!res.ok) {
            const body = (await res.text()).slice(0, 200);
            if (res.status >= 500) { await waitOrGiveUp(patience, attempt, Date.now() - t, `editor ${res.status} ${body}`); continue; }
            throw new Error(`Gemini judge ${res.status}: ${body}`);
        }
        const data = await res.json();
        const um = data?.usageMetadata ?? {};
        const tokens: Tokens = { prompt: um.promptTokenCount ?? 0, output: um.candidatesTokenCount ?? 0, thoughts: um.thoughtsTokenCount ?? 0 };
        const text: string = (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        try {
            const results: any[] = JSON.parse(text).results ?? [];
            const failures = items.flatMap((it, i) => {
                const r = results.find((x) => Number(x.line) === i + 1);
                if (!r) return [{ field: it.field, problems: ['editor gave no verdict'] }];
                const problems = Array.isArray(r.problems) ? r.problems.map(String).filter(Boolean) : [];
                return r.ok === true && problems.length === 0 ? [] : [{ field: it.field, problems: problems.length ? problems : ['editor rejected it'] }];
            });
            return { failures, tokens };
        } catch {
            if (attempt < 3) continue;
            throw new Error('Could not parse judge response');
        }
    }
}

/** One line at a time, for the checker's --judge option. */
export async function judgeRewrite(source: string, rewrite: string, apiKey: string): Promise<{ ok: boolean; problems: string[]; tokens: Tokens }> {
    const { failures, tokens } = await judgeRewrites([{ field: 'line', source, rewrite }], apiKey);
    return { ok: failures.length === 0, problems: failures.flatMap((f) => f.problems), tokens };
}
