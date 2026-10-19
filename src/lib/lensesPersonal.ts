import {
  SIGN_ELEMENT,
  SIGN_MODALITY,
  chandraLagnaHouses,
  computeTriadMoon,
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

/** The instant at which the wall clock in `timeZone` reads 12:00 on `birthday`
 *  (UTC noon when the zone is missing or invalid). */
export function birthdayNoon(birthday: string, timeZone?: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthday);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const utcNoon = Date.UTC(y, mo - 1, d, 12, 0, 0);
  const tz = safeTimeZone(timeZone);
  if (!tz) return new Date(utcNoon);
  const offsetAt = (t: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric",
    }).formatToParts(new Date(t));
    const g = (type: string) => Number(parts.find((p) => p.type === type)!.value);
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - t;
  };
  // Two passes settle the offset across a DST change.
  let t = utcNoon - offsetAt(utcNoon);
  t = utcNoon - offsetAt(t);
  return new Date(t);
}

/** Sidereal Moon sign (Lahiri) at noon on the birthday — the same
 *  ayanamsha as the Sidereal card. Null if the birthday is unusable. */
export function natalSiderealMoon(birthday: string | null | undefined, timeZone?: string): ZodiacSign | null {
  if (!birthday) return null;
  const noon = birthdayNoon(birthday, timeZone);
  return noon ? computeTriadMoon(noon).sidereal.sign : null;
}

/** Sidereal (wiring): which house from the natal sidereal Moon today's
 *  sidereal Moon occupies, with that house's inquiry prompt. Both Moons are
 *  sidereal, so this never disagrees with the Sidereal card. */
export function siderealForYou(natalSidereal: ZodiacSign, at: Date): ForYouLine {
  const todaySign = computeTriadMoon(at).sidereal.sign;
  const houses = chandraLagnaHouses(natalSidereal);
  const house = houses.find((h) => h.sign === todaySign) ?? houses[0];
  return {
    label: `The ${ORDINAL[house.house]} house from your natal Moon`,
    text: house.inquiry,
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
  /** Sidereal Moon at noon on the birthday; null hides the Sidereal line. */
  natalSiderealMoon: ZodiacSign | null;
  tropical: ZodiacSign;
  draconic: ZodiacSign;
  at: Date;
}): Partial<Record<LensKey, ForYouLine>> {
  return {
    social: tropicalForYou(args.tropical, args.natalSun),
    ...(args.natalSiderealMoon
      ? { internal: siderealForYou(args.natalSiderealMoon, args.at) }
      : {}),
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
