/**
 * scripts/lib/phraseVariants.ts
 *
 * Rotation of glossary replacement phrases. Within one Sun/Moon combination (its 12 Triad rows) no single phrasing may appear more
 * than MAX_PER_COMBINATION times. Each glossary phrase has alternative wordings that keep the exact meaning; the writer is told
 * which phrasings are already used in the combination and must pick another. Counting covers all six text fields of the 12 rows.
 *
 * Detection is by pattern, one pattern per phrasing, written so that two phrasings of a family never match the same words.
 */

export const MAX_PER_COMBINATION = 2;

export interface Variant {
    id: string;
    /** How it reads in a sentence (shown to the writer) */
    display: string;
    re: RegExp;
}
export interface Family {
    id: string;
    /** Guard labels (src/lib/dailyContentGuard.ts) whose rewrites use this family */
    labels: string[];
    what: string;
    variants: Variant[];
}

const v = (id: string, display: string, re: RegExp): Variant => ({ id, display, re });

export const FAMILIES: Family[] = [
    {
        id: 'warmth', labels: ['chest / belly'], what: 'a calming breath or sensation instead of "breathe into your belly" / "warm your chest"',
        variants: [
            v('warmth1', 'letting a sense of warmth gather and settle', /sense of warmth[^.,;]{0,12}settl/gi),
            v('warmth2', 'allowing a quiet warmth to gather and settle', /quiet warmth[^.,;]{0,12}settl/gi),
            v('warmth3', 'letting a soft warmth collect and settle within you', /soft warmth[^.,;]{0,12}settl/gi),
            v('warmth4', 'inviting a steady warmth to gather and settle', /steady warmth[^.,;]{0,12}settl/gi),
            v('warmth5', 'feeling a gentle warmth spread and settle', /gentle warmth[^.,;]{0,12}settl/gi),
            v('warmth6', 'letting warmth gather slowly and settle', /warmth gather\w* slowly[^.,;]{0,12}settl/gi),
        ],
    },
    {
        id: 'heart', labels: ['chest / belly'], what: 'a hand over the heart',
        variants: [
            v('heart1', 'rest one hand over your heart as a quiet gesture of kindness to yourself', /hand[^.;]{0,25}over your heart[^.;]{0,25}gesture of kindness/gi),
            v('heart2', 'place a hand over your heart, a small act of kindness toward yourself', /(?:place|lay|put)[^.;]{0,20}hand[^.;]{0,20}over your heart(?![^.;]{0,25}gesture of (?:self-)?kindness)/gi),
            v('heart3', 'let one hand rest over your heart as a gentle gesture of self-kindness', /gentle gesture of self-kindness/gi),
            v('heart4', 'with a hand resting over your heart, offer yourself quiet kindness', /resting over your heart(?![^.;]{0,25}gesture of (?:self-)?kindness)/gi),
            v('heart5', 'cup a hand over your heart as a soft reminder of kindness to yourself', /cup[^.;]{0,20}over your heart/gi),
        ],
    },
    {
        id: 'sensitivity', labels: ['nervous system'], what: 'the noun form of "nervous system" ("your nervous system", "soothe your nervous system")',
        variants: [
            v('sens1', 'your sensitivity to everything coming at you', /sensitivity to everything coming at you/gi),
            v('sens2', 'your sensitivity to everything the day sends your way', /sensitivity to everything the day sends/gi),
            v('sens3', 'your sensitivity to all that the day brings', /sensitivity to all that the day brings/gi),
            v('sens4', 'how deeply you feel everything coming at you', /how deeply you feel everything/gi),
            v('sens5', 'how sensitively you take in everything the day brings', /how sensitively you take in/gi),
        ],
    },
    {
        id: 'clause', labels: ['nervous system'], what: 'the clause form of "nervous system" (only where a whole clause fits)',
        variants: [
            v('clause1', "how you take in and process the day's events, and how much they stir or settle your mood", /how you take in and process/gi),
            v('clause2', "the way you take in and work through the day's events", /way you take in and work through/gi),
            v('clause3', 'how you absorb and process what the day brings', /how you absorb and process/gi),
        ],
    },
    {
        id: 'anxiety', labels: ['anxiety'], what: '"anxiety" / "anxieties"',
        variants: [
            v('anx1', "a restless, uneasy worry that's hard to set down", /restless,? uneasy worr\w*[^.;]{0,30}hard to set down/gi),
            v('anx2', 'an uneasy, restless worry that does not easily settle', /uneasy,? restless worr/gi),
            v('anx3', "a restless worry you can't quite put down", /restless worr\w* you can/gi),
            v('anx4', 'an uneasy worry that keeps circling and is hard to set down', /keeps circling/gi),
            v('anx5', "a nagging, restless unease that's hard to set down", /nagging,? restless unease/gi),
            v('anx6', 'a restless, uneasy worry that is hard to let go of', /hard to let go of/gi),
        ],
    },
    {
        id: 'keyedup', labels: ['stress chemistry'], what: '"adrenaline", "cortisol", "fight-or-flight"',
        variants: [
            v('key1', 'that keyed-up, braced-for-impact feeling', /keyed-up,? braced-for-impact/gi),
            v('key2', 'your on-alert mode', /on-alert mode/gi),
            v('key3', 'that wound-up, braced-for-impact feeling', /wound-up,? braced/gi),
            v('key4', 'that keyed-up, on-alert feeling', /keyed-up,? on-alert/gi),
            v('key5', 'that revved-up, on-edge feeling', /revved-up/gi),
        ],
    },
    {
        id: 'somatic', labels: ['somatic / body tension'], what: '"somatic" / "body tension" (no body parts)',
        variants: [
            v('som1', 'the stress you carry and feel physically', /stress you carry and feel physically/gi),
            v('som2', 'the stress you hold and feel physically', /stress you hold and feel physically/gi),
            v('som3', 'the physical weight of the stress you carry', /physical weight of the stress/gi),
            v('som4', 'the stress you carry in a physical way', /stress you carry in a physical way/gi),
        ],
    },
    {
        id: 'hypochondria', labels: ['hypochondria'], what: '"hypochondria"',
        variants: [
            v('hyp1', 'turning every small twinge into a worst-case story', /small twinge into a worst-case story/gi),
            v('hyp2', 'imagining the worst about your health', /imagining the worst about your health/gi),
            v('hyp3', 'spinning each small twinge into a worst-case scenario', /twinge into a worst-case scenario/gi),
            v('hyp4', 'reading every little twinge as proof of the worst', /little twinge as proof/gi),
        ],
    },
    {
        id: 'tides', labels: ['hormones'], what: '"hormones"',
        variants: [
            v('tide1', 'your natural emotional tides', /natural emotional tides/gi),
            v('tide2', 'the natural ebb and flow of your emotions', /ebb and flow of your emotions/gi),
            v('tide3', 'the natural rise and fall of your moods', /rise and fall of your moods/gi),
        ],
    },
    {
        id: 'circulation', labels: ['circulation'], what: '"circulation" / "blood flow"',
        variants: [
            v('circ1', 'your energy moving freely instead of feeling stuck', /energy moving freely instead of feeling stuck/gi),
            v('circ2', 'your energy flowing freely rather than feeling stuck', /flowing freely rather than feeling stuck/gi),
            v('circ3', 'your energy moving without getting stuck', /energy moving without getting stuck/gi),
        ],
    },
    {
        id: 'cleansing', labels: ['hygiene / clinical phrasing'], what: '"bodily hygiene" in a bathing or washing context',
        variants: [
            v('clean1', 'a simple cleansing ritual', /simple cleansing ritual/gi),
            v('clean2', 'a quiet cleansing ritual', /quiet cleansing ritual/gi),
            v('clean3', 'a simple washing ritual', /simple washing ritual/gi),
            v('clean4', 'a simple ritual of cleansing', /ritual of cleansing/gi),
        ],
    },
];

const ALL_VARIANTS: Array<{ family: Family; variant: Variant }> = FAMILIES.flatMap((family) => family.variants.map((variant) => ({ family, variant })));

/** How many times each phrasing appears in `text`, by variant id. */
export function occurrences(text: string | null | undefined): Map<string, number> {
    const out = new Map<string, number>();
    if (!text) return out;
    for (const { variant } of ALL_VARIANTS) {
        const n = (text.match(variant.re) ?? []).length;
        if (n) out.set(variant.id, n);
    }
    return out;
}

export const variantById = new Map(ALL_VARIANTS.map(({ variant, family }) => [variant.id, { variant, family }]));

/** Per-combination tallies of every phrasing across all fields of all rows. */
export class PhraseLedger {
    private counts = new Map<string, number>();
    private key(combo: string, variantId: string) { return `${combo}#${variantId}`; }

    add(combo: string, text: string | null | undefined, sign = 1) {
        for (const [id, n] of occurrences(text)) this.counts.set(this.key(combo, id), (this.counts.get(this.key(combo, id)) ?? 0) + sign * n);
    }
    count(combo: string, variantId: string): number { return this.counts.get(this.key(combo, variantId)) ?? 0; }

    /**
     * Phrasings that would exceed the limit if `newTexts` replaced `oldTexts` in this combination.
     * Only phrasings the new texts actually use are reported.
     */
    overLimit(combo: string, oldTexts: Array<string | null | undefined>, newTexts: string[]): Array<{ id: string; display: string; total: number }> {
        const old = new Map<string, number>();
        for (const t of oldTexts) for (const [id, n] of occurrences(t)) old.set(id, (old.get(id) ?? 0) + n);
        const next = new Map<string, number>();
        for (const t of newTexts) for (const [id, n] of occurrences(t)) next.set(id, (next.get(id) ?? 0) + n);
        const out: Array<{ id: string; display: string; total: number }> = [];
        for (const [id, n] of next) {
            const total = this.count(combo, id) - (old.get(id) ?? 0) + n;
            if (total > MAX_PER_COMBINATION) out.push({ id, display: variantById.get(id)!.variant.display, total });
        }
        return out;
    }

    /** Swap a row's old texts for its accepted new texts. */
    replace(combo: string, oldTexts: Array<string | null | undefined>, newTexts: string[]) {
        for (const t of oldTexts) this.add(combo, t, -1);
        for (const t of newTexts) this.add(combo, t, +1);
    }
}

/** The "phrase rotation" part of the prompt: for the families this job's lines need, which phrasings are free in this combination. */
export function rotationPrompt(combo: string, ledger: PhraseLedger, labelsNeeded: Set<string>, oldTexts: Array<string | null | undefined>, rotationSeed: number): string {
    const lines: string[] = [];
    // Do not count the lines this job replaces: they are going away.
    const old = new Map<string, number>();
    for (const t of oldTexts) for (const [id, n] of occurrences(t)) old.set(id, (old.get(id) ?? 0) + n);
    for (const family of FAMILIES) {
        if (!family.labels.some((l) => labelsNeeded.has(l))) continue;
        const rows = family.variants.map((vr, i) => {
            const used = ledger.count(combo, vr.id) - (old.get(vr.id) ?? 0);
            return { vr, used, i };
        });
        const free = rows.filter((r) => r.used < MAX_PER_COMBINATION);
        const preferred = free.length ? free[rotationSeed % free.length].vr : null;
        lines.push(`- ${family.what}: ${rows.map((r) => `"${r.vr.display}" (used ${r.used}x${r.used >= MAX_PER_COMBINATION ? ', FULL: do not use' : ''})`).join('; ')}.${preferred ? ` Prefer: "${preferred.display}".` : ' Every listed phrasing is used up: say it in another plain way that keeps the exact meaning.'}`);
    }
    if (!lines.length) return '';
    return `PHRASE ROTATION for this Sun/Moon combination. Across its 12 daily readings, no single phrasing may appear more than ${MAX_PER_COMBINATION} times. Use only the phrasings listed (adapting the grammar), never one marked FULL:\n${lines.join('\n')}`;
}
