/**
 * scripts/lib/rewriteJudge.ts
 *
 * A second read of a rewritten line. The rule-based gates can confirm that a glossary phrase is present and that no clinical
 * term is left, but not that the sentence still reads naturally ("exhausting how you take in and process the day's events...")
 * or that the meaning survived. This asks the model to act as a copy editor and say whether the replaced wording works.
 */
/** The API key's daily quota is used up (free tier: requests per day). Waiting a few minutes will not help, so callers stop. */
export class QuotaExhausted extends Error {
    constructor(detail: string) {
        super(`Gemini daily quota exhausted: ${(detail.match(/Quota exceeded for metric[^\n]*/)?.[0] ?? detail).slice(0, 200)} ${detail.match(/retry in ([0-9hms.]+)/i)?.[0] ?? ''}`.trim());
        this.name = 'QuotaExhausted';
    }
}
export const isDailyQuota = (body: string): boolean => /free_tier|PerDay|per day|retry in \d+h/i.test(body);

export interface JudgeResult { ok: boolean; problems: string[]; tokens: { prompt: number; output: number; thoughts: number }; }

import { GLOSSARY } from './languageGlossary';

const MODEL = 'gemini-3.5-flash-lite';
const APPROVED = GLOSSARY.flatMap((g) => g.say).map((s) => `"${s}"`).join(', ');

const judgePrompt = (source: string, rewrite: string) => `You are a strict copy editor. A line of astrology guidance was rewritten so that medical, clinical or diagnostic wording is replaced by plain, lived-experience wording. Everything else should be unchanged.

SOURCE:
${JSON.stringify(source)}

REWRITE:
${JSON.stringify(rewrite)}

Judge ONLY the places where the rewrite differs from the source. Ignore awkwardness that is already in the source. The rewrite fails if any changed passage:
1. is ungrammatical or reads unnaturally (a pasted phrase that does not fit the sentence, a doubled article such as "the ambient a ...", a verb that cannot take the new phrase, a clause that no longer makes sense);
2. changes the meaning or function of the original instead of translating it (a gesture, an instruction or a feeling replaced by something different or vague);
3. still contains or introduces medical, clinical, diagnostic or anatomical wording (organs, nervous system, hormones, symptoms, conditions).
These phrasings are APPROVED replacements and must never be failed for their wording (a hand over the heart, tight shoulders, a clenched jaw, slow breathing, a warm bath or foot soak, eucalyptus, frankincense, or any of: ${APPROVED}). Fail them only if the sentence around them is ungrammatical or the meaning changed.
Do not fail the rewrite for style preferences or for being longer than the source. Return ONLY JSON: {"ok": true|false, "problems": ["short description of each defect and the exact words, empty when ok"]}`;

export async function judgeRewrite(source: string, rewrite: string, apiKey: string): Promise<JudgeResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    for (let attempt = 0; ; attempt++) {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: judgePrompt(source, rewrite) }] }],
                generationConfig: { temperature: 0, maxOutputTokens: 1024, responseMimeType: 'application/json' },
            }),
        });
        if (res.status === 429) {
            const body = await res.text();
            if (isDailyQuota(body)) throw new QuotaExhausted(body);
            if (attempt < 4) { await new Promise((r) => setTimeout(r, 30000 * Math.pow(2, attempt))); continue; }
            throw new Error(`Gemini judge 429: ${body.slice(0, 200)}`);
        }
        if (!res.ok) {
            if (attempt < 3) { await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt))); continue; }
            throw new Error(`Gemini judge ${res.status}: ${(await res.text()).slice(0, 200)}`);
        }
        const data = await res.json();
        const um = data?.usageMetadata ?? {};
        const tokens = { prompt: um.promptTokenCount ?? 0, output: um.candidatesTokenCount ?? 0, thoughts: um.thoughtsTokenCount ?? 0 };
        const text: string = (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        try {
            const j = JSON.parse(text);
            const problems = Array.isArray(j.problems) ? j.problems.map(String).filter(Boolean) : [];
            return { ok: j.ok === true && problems.length === 0, problems, tokens };
        } catch {
            if (attempt < 3) continue;
            throw new Error('Could not parse judge response');
        }
    }
}
