// Daily content never makes body, health or medical claims. It speaks to mood, energy, focus, relationships and
// behaviour. This guard finds (and can strip) wording that crosses that line: body systems, physical symptoms,
// health advice and medical-sounding terms.
//
// Used in three places: the generator scripts (reject a draft that crosses the line), the Blueprint forecast
// (never show a stored line that crosses it), and a test that scans the static daily copy.

export interface BodyClaimTerm {
  /** What it is called in a report */
  term: string;
  re: RegExp;
}

const t = (term: string, re: RegExp): BodyClaimTerm => ({ term, re });

export const BODY_CLAIM_TERMS: BodyClaimTerm[] = [
  t("nervous system", /\bnervous[\s-]+system\w*/i),
  t("spinal / spine", /\b(spinal|spine|cerebrospinal)\b/i),
  t("circulation", /\b(circulation|circulatory|bloodstream|blood\s+(pressure|flow|sugar))\b/i),
  t("hydration", /\b(hydrat\w*|dehydrat\w*|drink\s+(more\s+)?water)\b/i),
  t("symptoms", /\bsymptom\w*/i),
  t("organs", /\borgans?\b/i),
  t("digestion / gut", /\b(digest\w*|gut|stomach|intestin\w*)\b/i),
  t("immune / inflammation", /\b(immune|immunity|inflammat\w*)\b/i),
  t("hormones", /\b(hormon\w*|adrenal\w*|cortisol|metabolism|metabolic)\b/i),
  t("breathing / lungs", /\b(respirat\w*|lungs?|shallow\s+breath\w*)\b/i),
  t("muscles / joints", /\b(muscle\w*|muscular|joints?|ribcage|tendons?)\b/i),
  t("head / chest sensations", /\b(headaches?|migraines?|behind\s+the\s+eyes|upper\s+chest|heart\s+rate)\b/i),
  t("medical", /\b(medical|medic(ation|ine)s?|doctor|diagnos\w*|illness|disease|chronic|therapeutic|clinical|nausea|insomnia)\b/i),
  t("physical / somatic", /\b(physical(ly)?|somatic|bodily|body\s+systems?)\b/i),
  t("the body", /\b(your|the|our|his|her|their)\s+(whole\s+|physical\s+|deep\s+\w+\s+)?bod(y|ies)\b/i),
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
