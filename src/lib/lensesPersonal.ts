import {
  SIGN_ELEMENT,
  SIGN_MODALITY,
  dailyInternalAudit,
  type Element,
  type Modality,
  type ZodiacSign,
} from "@/lib/sovereignEngine";

/* Personal layer for the Lenses page. Everything here is pure: it only
 * recombines signs, the existing house prompts and existing database rows. */

const SIGN_LIST: ZodiacSign[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/** Accepts "leo", " Leo ", "LEO"; returns null for anything that is not a sign. */
export function normalizeSign(value: string | null | undefined): ZodiacSign | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  return SIGN_LIST.find((s) => s.toLowerCase() === v) ?? null;
}

/* ── Membership ───────────────────────────────────────────── */

export interface MembershipProfile {
  is_subscriber?: boolean | null;
  subscription_status?: string | null;
}

/** Paid = Stripe-derived subscription, or the profile flags ('sovereign',
 *  'luminary', is_subscriber). A dev tier override ("free" / "sovereign")
 *  wins when present. */
export function isLuminaryMember(
  profile: MembershipProfile | null | undefined,
  subscribed: boolean,
  devOverride: "free" | "sovereign" | null = null,
): boolean {
  if (devOverride === "free") return false;
  if (devOverride === "sovereign") return true;
  const status = profile?.subscription_status?.toLowerCase();
  return (
    subscribed ||
    profile?.is_subscriber === true ||
    status === "sovereign" ||
    status === "luminary"
  );
}

/* ── Header ───────────────────────────────────────────────── */

/** combination_title is stored as "Leo Sun • Cancer Moon — The Name".
 *  The header already names the signs, so keep only the archetype name. */
export function archetypeName(title: string | null | undefined): string | null {
  const t = title?.trim();
  if (!t) return null;
  if (t.includes("—")) {
    const name = t.split("—").pop()?.trim();
    return name || null;
  }
  return t;
}

export function personalHeaderLine(
  sun: ZodiacSign,
  moon: ZodiacSign,
  combinationTitle?: string | null,
): string {
  const name = archetypeName(combinationTitle);
  return name
    ? `Your Sun in ${sun} · Moon in ${moon} · ${name}`
    : `${sun} Sun · ${moon} Moon`;
}

/* ── "For you" lines ──────────────────────────────────────── */

export type LensKey = "social" | "internal" | "soul";

export interface ForYouLine {
  label: string;
  text: string;
}

type ElementRelation = "same" | "supportive" | "contrasting";

function elementRelation(a: Element, b: Element): ElementRelation {
  if (a === b) return "same";
  const pair = [a, b].sort().join("+");
  // Fire feeds on Air, Earth is held by Water.
  return pair === "Air+Fire" || pair === "Earth+Water" ? "supportive" : "contrasting";
}

const MODALITY_PHRASE: Record<Modality, string> = {
  Cardinal: "starting things",
  Fixed: "holding steady",
  Mutable: "adapting",
};

/** One or two reflective sentences comparing today's sign with a natal sign
 *  by element and modality. `context` names what is being colored. */
export function elementModalityLine(
  today: ZodiacSign,
  natal: ZodiacSign,
  context: string,
): string {
  const tEl = SIGN_ELEMENT[today];
  const nEl = SIGN_ELEMENT[natal];
  const tMod = SIGN_MODALITY[today];
  const nMod = SIGN_MODALITY[natal];

  const rel = elementRelation(tEl, nEl);
  const first =
    rel === "same"
      ? `Both are ${tEl}, so ${context} may feel familiar.`
      : rel === "supportive"
        ? `${tEl} and ${nEl} tend to support each other, so ${context} may feel easy to work with.`
        : `${tEl} meets your ${nEl}, so ${context} may ask you to stretch a little.`;

  const second =
    tMod === nMod
      ? `You both lean toward ${MODALITY_PHRASE[tMod]}.`
      : `The day leans toward ${MODALITY_PHRASE[tMod]}, while you lean toward ${MODALITY_PHRASE[nMod]}.`;

  return `${first} ${second}`;
}

/** Tropical (social): today's Moon vs the member's natal Sun. */
export function tropicalForYou(todayMoon: ZodiacSign, natalSun: ZodiacSign): ForYouLine {
  return {
    label: `Moon in ${todayMoon} meets your ${natalSun} Sun`,
    text: elementModalityLine(todayMoon, natalSun, "the social tone of the day"),
  };
}

const ORDINAL: Record<number, string> = {
  1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th",
  7: "7th", 8: "8th", 9: "9th", 10: "10th", 11: "11th", 12: "12th",
};

/** Sidereal (wiring): which house from the natal Moon today's Moon occupies,
 *  with the inquiry prompt for that house. */
export function siderealForYou(natalMoon: ZodiacSign, at: Date): ForYouLine {
  const audit = dailyInternalAudit(natalMoon, at);
  return {
    label: `Moon in your ${ORDINAL[audit.house]} house from your ${natalMoon} Moon`,
    text: audit.inquiry,
  };
}

/** Draconic (soul): this lens's Moon sign vs the member's natal Moon. */
export function draconicForYou(draconicMoon: ZodiacSign, natalMoon: ZodiacSign): ForYouLine {
  return {
    label: `Draconic ${draconicMoon} meets your ${natalMoon} Moon`,
    text: elementModalityLine(draconicMoon, natalMoon, "your soul's direction today"),
  };
}

export function buildForYou(args: {
  natalSun: ZodiacSign;
  natalMoon: ZodiacSign;
  tropical: ZodiacSign;
  draconic: ZodiacSign;
  at: Date;
}): Record<LensKey, ForYouLine> {
  return {
    social: tropicalForYou(args.tropical, args.natalSun),
    internal: siderealForYou(args.natalMoon, args.at),
    soul: draconicForYou(args.draconic, args.natalMoon),
  };
}

/* ── Triad panel ──────────────────────────────────────────── */

export interface TriadStateRow {
  combination_title?: string | null;
  triad_number?: number | null;
  integration_invitation?: string | null;
  daily_ritual?: string | null;
}

export type TriadPanelContent =
  | {
      kind: "personal";
      title: string | null;
      numberLabel: string | null;
      integrationInvitation: string | null;
      dailyRitual: string | null;
    }
  | { kind: "generic" };

const clean = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);

/** Personal panel when today's triad_states row has something to show;
 *  otherwise the generic synthesis stays. */
export function resolveTriadPanel(row: TriadStateRow | null | undefined): TriadPanelContent {
  if (!row) return { kind: "generic" };
  const integrationInvitation = clean(row.integration_invitation);
  const dailyRitual = clean(row.daily_ritual);
  if (!integrationInvitation && !dailyRitual) return { kind: "generic" };
  return {
    kind: "personal",
    title: clean(row.combination_title),
    numberLabel:
      typeof row.triad_number === "number" ? `#${row.triad_number} of 1,728` : null,
    integrationInvitation,
    dailyRitual,
  };
}

/* ── Helpers ──────────────────────────────────────────────── */

/** Returns the zone if Intl accepts it, otherwise undefined (browser default). */
export function safeTimeZone(tz: string | null | undefined): string | undefined {
  if (!tz) return undefined;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return undefined;
  }
}

/** Rejects if `p` has not settled within `ms`. */
export function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    Promise.resolve(p).then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}
