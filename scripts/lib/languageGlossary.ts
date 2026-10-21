/**
 * scripts/lib/languageGlossary.ts
 *
 * The code side of docs/language-glossary.md ("translate, never soften"). Used by every script that writes or
 * rewrites daily content:
 *   - GLOSSARY_PROMPT goes into the prompt, so the model translates instead of deleting or softening
 *   - TRANSLATION_KEYS lets a script confirm that a rewrite of a flagged line actually contains the glossary phrase
 *     for the term it replaced (a vague stand-in such as "your deeper instincts" fails)
 *   - VAGUE_SUBSTITUTES are stand-ins earlier drafts used that lose the meaning
 *   - findUkSpelling keeps the copy in US spelling
 *
 * Keep this file and docs/language-glossary.md in step.
 */

export interface GlossaryEntry {
    /** What it replaces */
    from: string;
    /** Plain, lived-experience wording that keeps the exact meaning and function */
    say: string[];
}

export const GLOSSARY: GlossaryEntry[] = [
    { from: 'nervous system', say: ["how you take in and process the day's events, and how much they stir or settle your mood", 'your sensitivity to everything coming at you'] },
    { from: 'fight-or-flight, adrenaline, cortisol', say: ['that keyed-up, braced-for-impact feeling', 'your on-alert mode'] },
    { from: 'anxiety (the condition)', say: ["a restless, uneasy worry that's hard to set down"] },
    { from: 'depression (the condition)', say: ['a heavy, low mood that drains your motivation'] },
    { from: 'insomnia', say: ["a restless night where sleep won't come easily"] },
    { from: 'hypochondria', say: ['imagining the worst about your health', 'turning every small twinge into a worst-case story'] },
    { from: 'hormones', say: ['your natural emotional tides'] },
    { from: 'somatic / body tension', say: ['the stress you carry and feel physically, like tight shoulders or a clenched jaw'] },
    { from: 'immune system', say: ['your resilience, your ability to bounce back'] },
    { from: 'circulation, blood flow', say: ['your energy moving freely instead of feeling stuck'] },
    { from: 'clinical phrasing such as "bodily hygiene"', say: ['a simple cleansing ritual'] },
    { from: 'a foot bath', say: ['a warm foot soak scented with eucalyptus, as a ritual of release'] },
    { from: 'metabolize (as a figure for feelings)', say: ['work through', 'let it move through you and settle'] },
    { from: 'hand on belly / warm your chest', say: ['rest one hand over your heart as a quiet gesture of kindness to yourself', 'let a sense of warmth gather and settle'] },
];

/** Allowed as written: they are everyday gestures, not mechanisms. */
export const ALLOWED_AS_IS = ['a hand over the heart', 'a warm bath', 'a foot soak', 'slow breathing', 'scents like eucalyptus or frankincense'];

export const GLOSSARY_PROMPT = `TRANSLATE, NEVER SOFTEN. Every medical, clinical or diagnostic term must be replaced by a plain, descriptive phrase that keeps its exact meaning and function, described as lived experience (how it feels and how it affects mood, energy and reactions), never as anatomy or diagnosis. Do not delete the idea and do not swap in a vague stand-in ("your deeper instincts", "your inner waters", "your inner critic"): say what the term actually does. Use these phrasings, adjusting only the grammar to fit the sentence:
${GLOSSARY.map((g) => `- ${g.from} -> ${g.say.map((s) => `"${s}"`).join(' / ')}`).join('\n')}
Follow the same principle for any term not listed: describe how it feels and what it does to mood, energy and reactions. Allowed as written: ${ALLOWED_AS_IS.join(', ')}.
ADAPT THE GRAMMAR so every sentence still reads naturally: reword the clause around the glossary phrase (change the verb, the article or the word order), never paste a phrase where it does not fit. Examples:
- "exhausting your nervous system" -> "wearing down your sensitivity to everything coming at you"
- "soothe your nervous system" -> "soothe how the day's events land on you and stir your mood"
- "performance anxiety" -> "a restless, uneasy worry about performing that's hard to set down"
- "absorbing the ambient anxieties of everyone around you" -> "absorbing the restless, uneasy worries around you that are hard to set down"
- "severe hypochondria" -> "turning every small twinge into a worst-case story"
- "return to the quiet warmth of your own chest" -> "return to that quiet warmth, one hand resting over your heart as a gesture of kindness to yourself"
- "breathe into your lower belly" -> "take a slow breath and let a sense of warmth gather and settle"
- "prove to your nervous system that imperfection is survivable" -> "show yourself, in how you take in and process the day, that imperfection is survivable"`;

/**
 * For each guard label (src/lib/dailyContentGuard.ts) that has a glossary phrase: a pattern the rewrite must contain.
 * A rewrite of a line that contained the term passes only if it carries the glossary wording for it.
 */
export const TRANSLATION_KEYS: Record<string, RegExp> = {
    'nervous system': /take in and process|sensitivity to everything|stir or settle|stirs? (?:up )?your mood|settles? your mood|day'?s events (?:land|stir|settle)/i,
    'stress chemistry': /keyed-up|braced-for-impact|on-alert/i,
    anxiety: /(?:restless|uneasy)[^.]{0,25}worr|worr[^.]{0,40}hard to set down/i,
    depression: /heavy,? low mood/i,
    insomnia: /restless night/i,
    hypochondria: /imagining the worst about your health|worst-case story/i,
    hormones: /emotional tides/i,
    'somatic / body tension': /stress you carry|tight shoulders|clenched jaw/i,
    'immune / inflammation': /resilience|bounce back/i,
    circulation: /energy moving freely|moving freely/i,
    'hygiene / clinical phrasing': /cleansing ritual|ritual of release/i,
    'chest / belly': /hand over your heart|sense of warmth gather|warmth gather/i,
};

const phrase = (from: string): string => GLOSSARY.find((g) => g.from.startsWith(from))!.say[0];

/** The glossary wording to suggest when a rewrite of a flagged line is rejected, by guard label. */
export const SUGGESTED_PHRASE: Record<string, string> = {
    'nervous system': phrase('nervous system'),
    'stress chemistry': phrase('fight-or-flight'),
    anxiety: phrase('anxiety'),
    depression: phrase('depression'),
    insomnia: phrase('insomnia'),
    hypochondria: phrase('hypochondria'),
    hormones: phrase('hormones'),
    'somatic / body tension': phrase('somatic'),
    'immune / inflammation': phrase('immune'),
    circulation: phrase('circulation'),
    'hygiene / clinical phrasing': phrase('clinical phrasing'),
    'chest / belly': phrase('hand on belly'),
};

const GESTURE_ON_BODY = /\bhands?\b[^.]{0,60}\b(belly|chest|abdomen|womb|solar plexus)\b|\bwarm(?:th)?\b[^.]{0,30}\b(chest|belly)\b/i;

/**
 * The wording a rewrite of `source` must carry for guard label `label`, or null when any plain translation will do.
 * "Chest" and "belly" only need the glossary gesture when the line is about placing a hand there or warming it; a line that
 * only says "stored in your chest" is simply said another way.
 */
export function requiredTranslation(label: string, source: string): RegExp | null {
    if (label === 'chest / belly') return GESTURE_ON_BODY.test(source) ? TRANSLATION_KEYS[label] : null;
    // "reactive inflammation in your heart" is a figure of speech, not the immune system
    if (label === 'immune / inflammation') return /\bimmun/i.test(source) ? TRANSLATION_KEYS[label] : null;
    // "blood-red" is a color; only the flow of blood is the glossary's circulation
    if (label === 'circulation') return /circulat|blood\s*flow|bloodstream/i.test(source) ? TRANSLATION_KEYS[label] : null;
    return TRANSLATION_KEYS[label] ?? null;
}

/** Stand-ins earlier drafts used that lose the meaning of the term they replaced. */
export const VAGUE_SUBSTITUTES: RegExp[] = [
    /\binner waters\b/i, /\bdeeper instincts?\b/i, /\binner currents?\b/i, /\binternal currents?\b/i, /\binner tension\b/i,
    /\binner stamina\b/i, /\binner landscape\b/i, /\binner critic\b/i, /\binner core\b/i, /\bemotional core\b/i,
    /\bstillness reset\b/i, /\bdaily rhythm\b/i, /\bunderlying systems?\b/i,
];

const UK_STEMS =
    'realis|recognis|organis|apologis|summaris|prioritis|visualis|harmonis|minimis|maximis|finalis|energis|criticis|specialis|personalis|customis|stabilis|normalis|utilis|symbolis|crystallis|socialis|individualis|internalis|idealis|memoris|magnetis|sympathis|characteris|capitalis|centralis|generalis|mobilis|materialis|neutralis|spiritualis|sensitis|synchronis|emphasis(?=e)|synthesis(?=e)';

const UK_SPELLING = new RegExp(
    `\\b(?:\\w*(?:colour|honour|favour|behaviour|neighbour|labour|harbour|flavour|humour|rumour|vigour|rigour|savour|armour|odour)\\w*` +
        `|(?:${UK_STEMS})(?:e|ed|es|ing|ation|ations)` +
        `|centre[sd]?|theatre|metre|fibre|grey\\w*|analyse[sd]?|paralyse\\w*|catalogue|travell(?:ed|ing|er)|cancell(?:ed|ing)|labell(?:ed|ing)|modell(?:ed|ing)` +
        `|counsell(?:ed|ing|or)|fulfil|ageing|cosy|mould\\w*|programme|sceptic\\w*|whilst|amongst|learnt|spelt|burnt|dreamt|leant|licence|defence|offence|pretence|jewellery|draught|storey)\\b`,
    'i'
);

/** The first UK spelling in `text`, or null. */
export function findUkSpelling(text: string): string | null {
    return text.match(UK_SPELLING)?.[0] ?? null;
}
