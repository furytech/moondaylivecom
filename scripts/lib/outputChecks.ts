/**
 * scripts/lib/outputChecks.ts
 *
 * The per-row rules shared by the independent checker (check-regen-output.ts) and by the writer (regen-flagged-triads.ts
 * --apply-from), so a row is only ever written when the checker would pass it.
 */
import { findBodyClaims } from '../../src/lib/dailyContentGuard';
import { assignVariety, findUnassignedCrutches, findBodyRegions, findBodySensations, findPredictions } from './triadVariety';
import { VAGUE_SUBSTITUTES, findUkSpelling, SUGGESTED_PHRASE, requiredTranslation, findAwkwardGlossaryUse } from './languageGlossary';

export interface ResultLike {
    triadNumber?: number | null;
    sun: string;
    moon: string;
    transit: string;
    source?: Record<string, string>;
    before?: Record<string, string | null>;
    after: Record<string, string> | null;
}

/** Every rule a rewritten row breaks, as "field: reason". Empty means the row passes. (Variety across rows is checked separately.) */
export function rowProblems(r: ResultLike): string[] {
    const out: string[] = [];
    if (!r.after) return ['no rewrite produced'];
    for (const [field, text] of Object.entries(r.after)) {
        const source: string = r.source?.[field] ?? r.before?.[field] ?? '';
        const found: string[] = [];
        for (const t of findBodyClaims(text)) found.push(`still contains ${t}`);
        const uk = findUkSpelling(text);
        if (uk && findUkSpelling(source) !== uk) found.push(`UK spelling "${uk}"`);
        for (const v of VAGUE_SUBSTITUTES) if (v.test(text) && !v.test(source)) found.push(`vague stand-in "${text.match(v)![0]}"`);
        for (const a of findAwkwardGlossaryUse(text)) found.push(a);
        if (field === 'physical_guidance') {
            found.push(...findUnassignedCrutches(text, assignVariety({ triad_number: r.triadNumber ?? null, natal_sun_sign: r.sun, natal_moon_sign: r.moon, transiting_moon_sign: r.transit })));
            if (text.length > 900) found.push('longer than 900 characters');
        } else {
            if (text === source) found.push('unchanged');
            const sourceRegions = findBodyRegions(source);
            for (const region of findBodyRegions(text)) if (!sourceRegions.includes(region)) found.push(`new body region "${region}" that the original did not mention`);
            const sourceSensations = findBodySensations(source);
            for (const s of findBodySensations(text)) if (!sourceSensations.includes(s)) found.push(`new body sensation "${s}" that the original did not mention`);
            if (findPredictions(text).length > findPredictions(source).length) found.push(`new prediction "${findPredictions(text).at(-1)}"`);
            for (const label of findBodyClaims(source)) {
                const key = requiredTranslation(label, source);
                if (key && !key.test(text)) found.push(`"${label}" not translated with the glossary wording (e.g. "${SUGGESTED_PHRASE[label]}")`);
            }
        }
        for (const f of found) out.push(`${field}: ${f}`);
    }
    return out;
}
