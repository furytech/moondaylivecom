/**
 * Traditional / Hellenistic core tables and logic.
 * ---------------------------------------------------------------
 * PURE module: no ephemeris dependency, no runtime imports. It takes
 * longitudes in and returns traditional condition out, so the identical
 * file can run in the browser (Vite) and in edge functions (Deno).
 *
 * Mirrored at supabase/functions/_shared/traditionalCore.ts — keep both
 * copies byte-identical when editing.
 *
 * Sources are classical, not editorial:
 *  - Domicile / exaltation / detriment / fall: Ptolemy, Tetrabiblos I.17–19
 *  - Triplicity rulers: Dorotheus of Sidon (day / night / participating)
 *  - Bounds: Egyptian terms as transmitted by Ptolemy
 *  - Sect and benefic/malefic of the sect: Hellenistic standard doctrine
 *  - Aspects: the five Ptolemaic configurations between the seven visible planets
 */

export type TradSign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer"
  | "Leo" | "Virgo" | "Libra" | "Scorpio"
  | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export type TradPlanet =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn";

export type TradElement = "Fire" | "Earth" | "Air" | "Water";

export type DignityState =
  | "domicile" | "exaltation" | "detriment" | "fall" | "peregrine";

export type TradAspectName =
  | "conjunction" | "sextile" | "square" | "trine" | "opposition";

export const TRAD_SIGNS: TradSign[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export const CLASSICAL_PLANETS: TradPlanet[] = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
];

export const TRAD_ELEMENT: Record<TradSign, TradElement> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

/** Domicile lords (traditional rulerships only — no modern outer-planet rulers). */
export const DOMICILE: Record<TradSign, TradPlanet> = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};

/** Exaltation sign and exact degree of exaltation. */
export const EXALTATION: Record<TradPlanet, { sign: TradSign; degree: number }> = {
  Sun: { sign: "Aries", degree: 19 },
  Moon: { sign: "Taurus", degree: 3 },
  Mercury: { sign: "Virgo", degree: 15 },
  Venus: { sign: "Pisces", degree: 27 },
  Mars: { sign: "Capricorn", degree: 28 },
  Jupiter: { sign: "Cancer", degree: 15 },
  Saturn: { sign: "Libra", degree: 21 },
};

const OPPOSITE: Record<TradSign, TradSign> = {
  Aries: "Libra", Taurus: "Scorpio", Gemini: "Sagittarius", Cancer: "Capricorn",
  Leo: "Aquarius", Virgo: "Pisces", Libra: "Aries", Scorpio: "Taurus",
  Sagittarius: "Gemini", Capricorn: "Cancer", Aquarius: "Leo", Pisces: "Virgo",
};

/** Dorothean triplicity rulers: day lord, night lord, participating lord. */
export const TRIPLICITY: Record<TradElement, { day: TradPlanet; night: TradPlanet; participating: TradPlanet }> = {
  Fire: { day: "Sun", night: "Jupiter", participating: "Saturn" },
  Earth: { day: "Venus", night: "Moon", participating: "Mars" },
  Air: { day: "Saturn", night: "Mercury", participating: "Jupiter" },
  Water: { day: "Venus", night: "Mars", participating: "Moon" },
};

/** Egyptian bounds: [upper degree limit, ruler] in ascending order per sign. */
export const EGYPTIAN_BOUNDS: Record<TradSign, [number, TradPlanet][]> = {
  Aries: [[6, "Jupiter"], [12, "Venus"], [20, "Mercury"], [25, "Mars"], [30, "Saturn"]],
  Taurus: [[8, "Venus"], [14, "Mercury"], [22, "Jupiter"], [27, "Saturn"], [30, "Mars"]],
  Gemini: [[6, "Mercury"], [12, "Jupiter"], [17, "Venus"], [24, "Mars"], [30, "Saturn"]],
  Cancer: [[7, "Mars"], [13, "Venus"], [19, "Mercury"], [26, "Jupiter"], [30, "Saturn"]],
  Leo: [[6, "Jupiter"], [11, "Venus"], [18, "Saturn"], [24, "Mercury"], [30, "Mars"]],
  Virgo: [[7, "Mercury"], [17, "Venus"], [21, "Jupiter"], [28, "Mars"], [30, "Saturn"]],
  Libra: [[6, "Saturn"], [14, "Mercury"], [21, "Jupiter"], [28, "Venus"], [30, "Mars"]],
  Scorpio: [[7, "Mars"], [11, "Venus"], [19, "Mercury"], [24, "Jupiter"], [30, "Saturn"]],
  Sagittarius: [[12, "Jupiter"], [17, "Venus"], [21, "Mercury"], [26, "Saturn"], [30, "Mars"]],
  Capricorn: [[7, "Mercury"], [14, "Jupiter"], [22, "Venus"], [26, "Saturn"], [30, "Mars"]],
  Aquarius: [[7, "Mercury"], [13, "Venus"], [20, "Jupiter"], [25, "Mars"], [30, "Saturn"]],
  Pisces: [[12, "Venus"], [16, "Jupiter"], [19, "Mercury"], [28, "Mars"], [30, "Saturn"]],
};

/** Traditional orbs (moieties simplified to a whole-aspect orb per planet). */
const PLANET_ORB: Record<TradPlanet, number> = {
  Sun: 15, Moon: 12, Mercury: 7, Venus: 7, Mars: 8, Jupiter: 9, Saturn: 9,
};

const ASPECT_ANGLE: Record<TradAspectName, number> = {
  conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180,
};

export const norm360 = (deg: number) => ((deg % 360) + 360) % 360;

export const signFromLongitude = (lon: number): TradSign =>
  TRAD_SIGNS[Math.floor(norm360(lon) / 30)];

export const degreeInSign = (lon: number) => norm360(lon) % 30;

export function boundLord(lon: number): TradPlanet {
  const sign = signFromLongitude(lon);
  const deg = degreeInSign(lon);
  for (const [limit, lord] of EGYPTIAN_BOUNDS[sign]) {
    if (deg < limit) return lord;
  }
  return EGYPTIAN_BOUNDS[sign][EGYPTIAN_BOUNDS[sign].length - 1][1];
}

export function dignityOf(planet: TradPlanet, lon: number): DignityState {
  const sign = signFromLongitude(lon);
  if (DOMICILE[sign] === planet) return "domicile";
  if (EXALTATION[planet].sign === sign) return "exaltation";
  if (DOMICILE[OPPOSITE[sign]] === planet) return "detriment";
  if (OPPOSITE[EXALTATION[planet].sign] === sign) return "fall";
  return "peregrine";
}

export function triplicityLord(lon: number, isDay: boolean): TradPlanet {
  const t = TRIPLICITY[TRAD_ELEMENT[signFromLongitude(lon)]];
  return isDay ? t.day : t.night;
}

/**
 * Sect condition. In a day chart the Sun, Jupiter and Saturn are of the sect;
 * at night the Moon, Venus and Mars are. Mercury takes the sect of whichever
 * side of the Sun it rises with — simplified here to its phase relative to the Sun.
 */
export function sectStanding(
  planet: TradPlanet,
  isDay: boolean,
  mercuryIsOriental?: boolean,
): "of the sect" | "contrary to the sect" | "neutral" {
  const diurnal: TradPlanet[] = ["Sun", "Jupiter", "Saturn"];
  const nocturnal: TradPlanet[] = ["Moon", "Venus", "Mars"];
  if (planet === "Mercury") {
    if (mercuryIsOriental === undefined) return "neutral";
    return mercuryIsOriental === isDay ? "of the sect" : "contrary to the sect";
  }
  const inSect = isDay ? diurnal : nocturnal;
  const outSect = isDay ? nocturnal : diurnal;
  if (inSect.includes(planet)) return "of the sect";
  if (outSect.includes(planet)) return "contrary to the sect";
  return "neutral";
}

/** Benefic / malefic of the sect — the single most misread piece for Saturn. */
export function sectNature(planet: TradPlanet, isDay: boolean): string | null {
  if (planet === "Jupiter") return isDay ? "benefic of the sect (greater benefic, well placed by sect)" : "benefic out of sect";
  if (planet === "Venus") return isDay ? "benefic out of sect" : "benefic of the sect";
  if (planet === "Saturn") return isDay ? "malefic of the sect — restraint that structures rather than punishes" : "malefic contrary to the sect — where its hardness actually bites";
  if (planet === "Mars") return isDay ? "malefic contrary to the sect — heat without a container" : "malefic of the sect — force that gets things done";
  return null;
}

export interface TradAspect {
  a: TradPlanet;
  b: TradPlanet;
  aspect: TradAspectName;
  /** Absolute orb in degrees from exact. */
  orb: number;
  /** True when the faster body is still approaching exactitude. */
  applying: boolean;
  /** Same-sign / whole-sign configuration, as Hellenistic practice reads it. */
  wholeSign: boolean;
}

/** Mean daily motion, used only to decide applying vs separating. */
const DAILY_MOTION: Record<TradPlanet, number> = {
  Moon: 13.176, Mercury: 1.383, Venus: 1.2, Sun: 0.9856,
  Mars: 0.524, Jupiter: 0.083, Saturn: 0.033,
};

export function classicalAspects(
  longitudes: Partial<Record<TradPlanet, number>>,
): TradAspect[] {
  const out: TradAspect[] = [];
  const present = CLASSICAL_PLANETS.filter((p) => typeof longitudes[p] === "number");

  for (let i = 0; i < present.length; i++) {
    for (let j = i + 1; j < present.length; j++) {
      const a = present[i];
      const b = present[j];
      const la = norm360(longitudes[a]!);
      const lb = norm360(longitudes[b]!);
      let sep = Math.abs(la - lb);
      if (sep > 180) sep = 360 - sep;

      for (const name of Object.keys(ASPECT_ANGLE) as TradAspectName[]) {
        const exact = ASPECT_ANGLE[name];
        const orb = Math.abs(sep - exact);
        const allowed = (PLANET_ORB[a] + PLANET_ORB[b]) / 2;
        if (orb > allowed) continue;

        const signDistance = Math.abs(
          TRAD_SIGNS.indexOf(signFromLongitude(la)) - TRAD_SIGNS.indexOf(signFromLongitude(lb)),
        );
        const wholeSignGap = Math.min(signDistance, 12 - signDistance) * 30;

        const faster = DAILY_MOTION[a] >= DAILY_MOTION[b] ? a : b;
        const slower = faster === a ? b : a;
        const gap = norm360(longitudes[slower]! - longitudes[faster]!);
        const approaching = gap < 180 ? true : false;

        out.push({
          a,
          b,
          aspect: name,
          orb: Number(orb.toFixed(2)),
          applying: approaching && orb > 0.05,
          wholeSign: wholeSignGap === exact,
        });
        break;
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

/**
 * Whole-sign houses counted from a chosen anchor sign. Used for Chandra Lagna
 * (Moon as first house) and the solar-house lens — both legitimate without a
 * birth time, unlike an Ascendant.
 */
export function wholeSignHouses(anchor: TradSign): Record<number, TradSign> {
  const start = TRAD_SIGNS.indexOf(anchor);
  const map: Record<number, TradSign> = {};
  for (let h = 1; h <= 12; h++) {
    map[h] = TRAD_SIGNS[(start + h - 1) % 12];
  }
  return map;
}

/** House topics as the Hellenistic tradition names them (not modern keywords). */
export const HOUSE_TOPICS: Record<number, string> = {
  1: "the body, the self, the immediate outlook",
  2: "livelihood, resources, what sustains",
  3: "siblings, short journeys, daily exchange",
  4: "home, roots, parents, the private foundation",
  5: "children, pleasure, creative issue, good fortune",
  6: "labour, illness, subordination, the grind",
  7: "partnership, contracts, the open other",
  8: "shared resources, debt, mortality, what is inherited",
  9: "travel, study, the sacred, the foreign",
  10: "reputation, action in the world, vocation",
  11: "friends, allies, hopes, benefactors",
  12: "hidden things, undoing, retreat, what works against us",
};

export const dignityPhrase = (d: DignityState): string => ({
  domicile: "in its own domicile — acting on home ground, with full authority over its own business",
  exaltation: "exalted — honoured, perhaps over-honoured, and given more room than it strictly earns",
  detriment: "in detriment — working in a sign that opposes its nature, so it gets results by strain",
  fall: "in fall — depressed in dignity, easy to underestimate, prone to being handled badly",
  peregrine: "peregrine — no essential dignity here, so it takes its cue from the lord of the sign and its bound",
}[d]);
