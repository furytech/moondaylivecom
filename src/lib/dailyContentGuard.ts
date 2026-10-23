// Daily content never makes body, health or medical claims. It speaks to mood, energy, focus, pace, relationships
// and behaviour.
//
// ALLOWED: plain, everyday self-care and activity suggestions ("take a slow walk", "rest early", "drink some water",
// "stretch", "step outside", "your body may want to slow down").
// BLOCKED: medical or pseudo-medical mechanism language: body systems, symptoms, organs, the nervous system,
// circulation, spinal fluid, hormones, diagnoses, treatments and health advice.
//
// Used in three places: the generator scripts (reject a draft that crosses the line), the Blueprint forecast
// (never show a stored line that crosses it), and a test that scans the static daily copy.

export interface BodyClaimTerm {
  /** What it is called in a report */
  term: string;
  re: RegExp;
}

const t = (term: string, re: RegExp): BodyClaimTerm => ({ term, re });

// Medical and health advice. Everyday figures of speech and craft words are not claims, but every health use stays flagged:
//  - "cure" is allowed only when its sentence is clearly about a material ("let the clay cure", "while the foundation cures"),
//    and never as "cure your anxiety / pain / ..." whatever else the sentence mentions
//  - "royal treatment" and "silent treatment" are idioms; any other "treatment" is flagged
//  - "heal" is flagged when its object is the body, an illness, pain, symptoms or an injury; "treat" when its object is an illness, pain,
//    symptoms or an injury ("treat your body like a temple" is an idiom and is allowed)
const CURING_MATERIALS = "concrete|clay|resin|paint|foundation|plaster|cement|mortar|glaze|epoxy|varnish|ceramic|pottery";
const HEALTH_OBJECTS = "anxiety|stress|pain|illness|illnesses|ills|ailments?|diseases?|loneliness|grief|worry|worries|fatigue|insomnia|sadness|depression";
const HEALTH_ONLY_OBJECTS = "illness|illnesses|disease|diseases|pain|symptoms?|ailments?|conditions?|injur\\w+|wounds?";
const MEDICAL_ADVICE = new RegExp(
  [
    "\\b(?:medical|medic(?:ation|ine)s?|doctor|diagnos\\w*|illness|disease|therapeutic|nausea|remed(?:y|ies)|prescri\\w*|supplements?|detox\\w*|dosage)\\b",
    "\\b(?<!(?:silent|royal)\\s)treatments?\\b",
    // the verb, unless the same line names a curing material anywhere before or after it
    `(?<![\\s\\S]*\\b(?:${CURING_MATERIALS})\\b[\\s\\S]*)\\bcure[sd]?\\b(?![\\s\\S]*\\b(?:${CURING_MATERIALS})\\b)`,
    // always flagged, whatever material is nearby: the noun ("a cure", "no cure", "cure for") and a cure of anxiety, pain and the like
    "\\b(?:a|an|the|no|any|your|their|its|true|real|only|natural)\\s+cures?\\b|\\bcures?\\s+for\\b",
    `\\bcures?\\s+(?:your\\s+|the\\s+|my\\s+)?(?:${HEALTH_OBJECTS})\\b`,
    // "heal your body" is a health claim; "treat your body like a temple" is an idiom about self-respect and is allowed
    `\\bheal(?:s|ed|ing)?\\s+(?:your\\s+|the\\s+|my\\s+)?(?:body|${HEALTH_ONLY_OBJECTS})\\b`,
    `\\btreat(?:s|ed|ing)?\\s+(?:your\\s+|the\\s+|my\\s+|a\\s+)?(?:${HEALTH_ONLY_OBJECTS})\\b`,
  ].join("|"),
  "i"
);

// Every label with a phrase in docs/language-glossary.md ("translate, never soften") is a place to translate the term
// into lived experience, not to delete it or swap in a vague stand-in. See scripts/lib/languageGlossary.ts.
export const BODY_CLAIM_TERMS: BodyClaimTerm[] = [
  t("nervous system", /\bnervous[\s-]+system\w*|\bneural\b|\bneurons?\b|\bneurotransmitter\w*|\bvagus\b|\bbrain[\s-]?stem\b/i),
  t("stress chemistry", /\bfight[\s,-]*(?:or|and)?[\s-]*flight\b|\badrenal\w*|\bcortisol\b/i),
  t("anxiety", /\banxieties\b|\banxiety\b/i),
  t("depression", /\bdepress(?:ion|ed|ive)\b/i),
  t("insomnia", /\binsomnia\w*|\bsleeplessness\b/i),
  t("hypochondria", /\bhypochondri\w*/i),
  t("spinal / spine", /\b(spinal|spine|cerebrospinal)\b/i),
  t("circulation", /\b(circulation|circulatory|bloodstream|blood)\b/i),
  t("dehydration", /\bdehydrat\w*/i),
  t("symptoms", /\bsymptom\w*/i),
  t("organs", /\borgans?\b/i),
  t(
    "internal organs / tissue",
    /\b(kidneys?|liver|bladder|bowels?|thyroid|pancrea\w*|spleen|gall\s?bladder|lymph\w*|cardio\w*|cardiac|vascular|glands?|tissues?|cells|cellular|molecul\w*|enzymes?|palpitations?|skeletal|fascia)\b|\bdry[\s-]brush\w*/i
  ),
  t("chest / belly", /\b(chest|belly|bellies|abdomen\w*|abdominal|pelvi\w*|torso|solar\s+plexus)\b/i),
  t("conditions / diagnoses", /\b(panic\s+attacks?|ptsd|trauma\w*|disorders?|ocd|bipolar|adhd|psychosis|phobias?|schizo\w*|mental\s+(?:health|illness))\b/i),
  t("hygiene / clinical phrasing", /\b(hygiene|hygienic|pathology|pathological|psychiatr\w*|therapy|therapist\w*|clinical(?:ly)?\s+(?:proven|tested|speaking))\b/i),
  // "gut feeling / gut instinct" are plain idioms for intuition, not anatomy
  t(
    "digestion / gut",
    /\b(digestion|digestive|stomach|intestin\w*)\b|\bgut\b(?!\s*[- ]?(feeling|feelings|instinct|instincts|check|reaction|reactions|sense|call|response))/i
  ),
  t("immune / inflammation", /\b(immune|immunity|inflammat\w*)\b/i),
  t("hormones", /\b(hormon\w*|endocrine)\b/i),
  // "metabolize your feelings" is a figure of speech for working through them: say that instead
  t("metabolism", /\bmetabol\w*/i),
  t("breathing / lungs", /\b(respirat\w*|lungs?|shallow\s+breath\w*)\b/i),
  t("muscles / joints", /\b(muscle\w*|muscular|joints?|ribcage|tendons?)\b/i),
  t("head / chest sensations", /\b(headaches?|migraines?|behind\s+the\s+eyes|upper\s+chest|heart\s+rate)\b/i),
  t("medical / health advice", MEDICAL_ADVICE),
  t("somatic / body tension", /\b(somatic\w*|body\s+tension)\b/i),
  t("physiology / body systems", /\b(bodily\s+(function|system|process|fluid)s?|body\s+systems?|physiolog\w*|biochemi\w*|biological)\b/i),
];

/** The terms that appear in `text`, for a report or a rejection message. Empty means clean. */
export function findBodyClaims(text: string | null | undefined): string[] {
  if (!text) return [];
  return BODY_CLAIM_TERMS.filter(({ re }) => re.test(text)).map(({ term }) => term);
}

export const hasBodyClaims = (text: string | null | undefined): boolean => findBodyClaims(text).length > 0;

const splitSentences = (text: string): string[] =>
  text
    .replace(/([.!?])\s+/g, "$1|SPLIT|")
    .split("|SPLIT|")
    .map((s) => s.trim())
    .filter(Boolean);

/** Drops every sentence that crosses the line and keeps the rest. A text that is all claims becomes "". */
export function stripBodyClaims(text: string | null | undefined): string {
  if (!text) return "";
  if (!hasBodyClaims(text)) return text;
  return splitSentences(text)
    .filter((s) => !hasBodyClaims(s))
    .join(" ");
}

/** The same, for every string field of a stored daily record (an emptied field is simply not shown). */
export function stripBodyClaimsFromRecord<T extends object>(record: T): T {
  const out: Record<string, unknown> = { ...(record as Record<string, unknown>) };
  for (const [key, value] of Object.entries(record as Record<string, unknown>)) {
    if (typeof value === "string") out[key] = stripBodyClaims(value);
  }
  return out as T;
}

/** For generator scripts: throws if a draft crosses the line, naming the terms, so the draft is retried or skipped. */
export function assertNoBodyClaims(fields: Record<string, string | null | undefined>): void {
  const hits = Object.entries(fields)
    .map(([field, text]) => [field, findBodyClaims(text)] as const)
    .filter(([, terms]) => terms.length > 0);
  if (hits.length > 0) {
    throw new Error(`Body/health claims in generated content: ${hits.map(([f, terms]) => `${f} (${terms.join(", ")})`).join("; ")}`);
  }
}
