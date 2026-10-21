/**
 * scripts/lib/triadVariety.ts
 *
 * Keeps regenerated energy lines from all sounding alike. Each row is deterministically assigned:
 *   - 3 activity ideas drawn from a pool for the transiting Moon's element (the model anchors the day on ONE of them)
 *   - a pace shape for the transiting Moon's modality
 *   - a way to close the last sentence
 * and "a walk" / "an early night" are only allowed when they were among the assigned ideas.
 *
 * Pure and deterministic: the same row always gets the same assignment, so a resumed run is repeatable.
 */

export type Element = 'Fire' | 'Earth' | 'Air' | 'Water';
export type Modality = 'Cardinal' | 'Fixed' | 'Mutable';

export const ACTIVITY_POOLS: Record<Element, string[]> = {
    Fire: [
        'a bold first move on the thing you have been postponing',
        'a workout or a brisk bike ride',
        'saying yes to one spontaneous invitation',
        'a creative burst: draft, sketch or record something',
        'a playful, competitive game with someone',
        'clearing out one drawer or closet in a single fast sweep',
        'making the call you have been avoiding',
        'a dance break to a loud playlist',
        'starting a small project with a visible result by evening',
        'explaining or teaching something to a friend',
        'an outdoor errand in the sunlight',
        'pitching an idea out loud before you over-polish it',
    ],
    Earth: [
        'a block of uninterrupted, practical work',
        'cooking something from scratch',
        'tidying one zone until it is fully done',
        'tending plants or a bit of garden',
        'a budget or paperwork session',
        'mending or fixing one small thing',
        'a long, simple meal with someone',
        'an easy stretch routine at home',
        'writing tomorrow\'s plan on paper',
        'building or crafting something with your hands',
        'a visit to a place you know well',
        'a short walk to somewhere familiar',
    ],
    Air: [
        'a long conversation with someone you trust',
        'writing a letter, a list or a journal page',
        'reading something that stretches you',
        'brainstorming with a friend',
        'a change of scene: a café, a library or a new corner of town',
        'returning a call you owe',
        'learning one new thing for twenty minutes',
        'an hour offline with good music',
        'swapping ideas in a group chat',
        'sketching a plan on a single page',
        'a bike ride or an easy swim',
        'a short walk while you think out loud',
    ],
    Water: [
        'journaling about what you actually feel',
        'a warm bath and a quiet evening',
        'cooking for someone you love',
        'listening to music with nothing else going on',
        'a gentle creative evening: drawing, knitting or playing an instrument',
        'a check-in with one close friend',
        'a slow morning with tea before anything else',
        'rewatching a comforting film',
        'tidying your space until it feels like a sanctuary',
        'time near water, a fountain or the shore',
        'an early night',
        'a quiet hour before the day begins',
    ],
};

export const PACE_SHAPES: Record<Modality, string[]> = {
    Cardinal: ['start strong, then ease off', 'front-load the one thing that matters', 'a bold first move, then room to breathe', 'a short sprint, then a long pause'],
    Fixed: ['steady and sustained all day', 'stay with one thing without switching', 'a slow build to a strong middle', 'hold your ground and pace yourself'],
    Mutable: ['flex with the day and keep no fixed plan', 'short bursts between pauses', 'let the day change shape, but finish one thing', 'switch tasks freely and close one loop'],
};

export const CLOSINGS: string[] = [
    'end on a gentle question to the reader',
    'end on a time-of-day anchor ("by late afternoon…")',
    'end by naming one thing to decline today',
    'end by naming the kind of company that helps',
    'end by saying when the work is good enough to stop',
    'end with one small first step they can take in five minutes',
    'end with what to save for tomorrow',
    'end with a one-line reminder of what they do well',
    'end with a detail about the quality of the day (its light, its tempo, its mood)',
    'end with an invitation to notice one thing',
    'end with a single concrete image from the day',
    'end by naming what will feel different by evening',
    'end by naming one boundary to hold',
    'end with a short instruction in five words or fewer',
    'end by naming who to tell about your day',
    'end with a sign that the day is going well',
    'end with a contrast: not this, but that',
    'end with something to look forward to tonight or tomorrow',
    'end by naming a pace marker ("when you feel the first dip…")',
    'end with a small treat worth giving yourself',
    'end with a hint about what to leave unfinished',
    'end with the single most useful sentence of the day',
    'end with a promise that the feeling passes by nightfall',
    'end by naming one place that suits the day',
];

export const OPENINGS: string[] = [
    'open with a time of day',
    'open with a verb about pace (rush, drift, build, settle, spark)',
    'open by contrasting their Sun and Moon in one clause',
    'open with the first thing they will notice this morning',
    'open by addressing them directly with "you"',
    'open with a single-word mood, then a comma',
    'open with what the day asks of them',
    'open with an image of weather or terrain that matches the pace (no medical imagery)',
    'open with the element of the Moon (fire, earth, air or water) and what it does to the day',
    'open with the best use of the first hour',
    'open with what to protect today',
    'open with what the day rewards',
];

// Phrases earlier drafts leaned on in almost every line.
export const BANNED_PHRASES: Array<{ label: string; re: RegExp }> = [
    { label: '"the atmosphere"', re: /\bthe atmosphere\b/i },
    { label: '"it is fine to"', re: /\bit(?:'s| is) (?:perfectly |completely )?(?:fine|okay|ok) to\b/i },
    { label: '"permission to"', re: /\bpermission to\b/i },
    { label: '"high-octane"', re: /\bhigh-octane\b/i },
];

export interface VarietyInput {
    triad_number: number | null;
    natal_sun_sign: string;
    natal_moon_sign: string;
    transiting_moon_sign: string;
}

export interface Assignment {
    activities: string[];
    paceShape: string;
    opening: string;
    closing: string;
    walkAllowed: boolean;
    earlyNightAllowed: boolean;
}

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const ELEMENT: Record<string, Element> = { Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire', Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth', Gemini: 'Air', Libra: 'Air', Aquarius: 'Air', Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water' };
const MODALITY: Record<string, Modality> = { Aries: 'Cardinal', Cancer: 'Cardinal', Libra: 'Cardinal', Capricorn: 'Cardinal', Taurus: 'Fixed', Leo: 'Fixed', Scorpio: 'Fixed', Aquarius: 'Fixed', Gemini: 'Mutable', Virgo: 'Mutable', Sagittarius: 'Mutable', Pisces: 'Mutable' };

export function assignVariety(row: VarietyInput): Assignment {
    const sun = SIGNS.indexOf(row.natal_sun_sign);
    const moon = SIGNS.indexOf(row.natal_moon_sign);
    const transit = row.transiting_moon_sign;
    const n = row.triad_number ?? sun * 144 + moon * 12 + SIGNS.indexOf(transit) + 1;

    const pool = ACTIVITY_POOLS[ELEMENT[transit]];
    const start = (n * 5 + sun * 3 + moon) % pool.length;
    const activities = [pool[start], pool[(start + 4) % pool.length], pool[(start + 8) % pool.length]];
    const shapes = PACE_SHAPES[MODALITY[transit]];
    return {
        activities,
        paceShape: shapes[(n + sun) % shapes.length],
        opening: OPENINGS[(n * 7 + moon * 5 + sun) % OPENINGS.length],
        closing: CLOSINGS[(n * 3 + sun * 7 + moon) % CLOSINGS.length],
        walkAllowed: activities.some((a) => /\bwalk\b/i.test(a)),
        earlyNightAllowed: activities.some((a) => /early night/i.test(a)),
    };
}

const WALK = /\bwalk(s|ed|ing)?\b/i;
const EARLY_NIGHT = /\b(early night|rest early|rest earlier|bed early|early to bed|early evening in|early evening of)\b/i;

/** What the draft leaned on that was not assigned to this row. Empty means it is within its assignment. */
export function findUnassignedCrutches(text: string, a: Assignment): string[] {
    const found: string[] = [];
    if (WALK.test(text) && !a.walkAllowed) found.push('a walk');
    if (EARLY_NIGHT.test(text) && !a.earlyNightAllowed) found.push('an early night');
    for (const b of BANNED_PHRASES) if (b.re.test(text)) found.push(b.label);
    return found;
}

/** The prompt fragment that tells the model which ideas, pace and closing to use for this row. */
export function varietyInstruction(a: Assignment): string {
    return [
        `Anchor the day on ONE of these activity ideas, adapted to this Blueprint (do not list all three): ${a.activities.join(' | ')}.`,
        `Do NOT suggest a walk or an early night unless one of the ideas above is exactly that.`,
        `Pace shape for the day: ${a.paceShape}.`,
        `Open this way: ${a.opening}. Close the last sentence this way: ${a.closing}.`,
        `Never use the phrases "the atmosphere", "it is fine to" or "permission to". Keep it to 2-3 sentences and about 420 characters.`,
    ].join(' ');
}
