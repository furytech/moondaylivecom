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
 * How long one row may spend waiting out a busy service (503 and the like). When it is used up the row gives up, keeps its
 * current text, goes on the needs-review list, and the run moves on.
 */
export const OVERLOAD_PATIENCE_MS = 20000;
export interface Patience { ms: number; }
export class Overloaded extends Error {
    constructor(detail: string) { super(`service busy, gave up on this row: ${detail}`); this.name = 'Overloaded'; }
}
const nap = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Back off briefly (2s, 4s, 8s...) from this row's patience, or throw Overloaded when it would run out. */
export async function waitOrGiveUp(p: Patience, attempt: number, spentMs: number, detail: string): Promise<void> {
    p.ms -= spentMs;
    const wait = Math.min(2000 * Math.pow(2, attempt), 8000);
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
3. still contains or introduces medical, clinical, diagnostic or anatomical wording (organs, nervous system, hormones, symptoms, conditions).
These phrasings are APPROVED replacements and must never be failed for their wording (a hand over the heart, tight shoulders, a clenched jaw, slow breathing, a warm bath or foot soak, eucalyptus, frankincense, or any of: ${APPROVED}). Fail them only if the sentence around them is ungrammatical or the meaning changed.
Do not fail a line for style preferences or for being longer than the source.
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
            if (isDailyQuota(body)) throw new QuotaExhausted(body);
            await waitOrGiveUp(patience, attempt, Date.now() - t, `editor 429 ${body.slice(0, 120)}`);
            continue;
        }
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
