/**
 * Sovereign Precision Engine
 * ---------------------------------------------------------------
 * High-precision lunar geometry for the Moonday Sovereign tier.
 *
 *  - Source: astronomy-engine (sub-arcminute geocentric positions)
 *  - Triad Moon: Tropical · Sidereal (Lahiri Ayanamsha) · Draconic
 *  - Nodes: True Node (instantaneous, includes nutation jitter)
 *  - Houses: Whole Sign, Chandra Lagna (Moon = House 1) fallback
 *  - Aspects: Kinetic Vectors (Applying / Exact / Separating)
 *
 * Terminology is professional-psychological. No "fortune" language.
 */

import {
  Body,
  EclipticGeoMoon,
  GeoVector,
  Ecliptic,
  AstroTime,
} from "astronomy-engine";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ZodiacSign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer"
  | "Leo" | "Virgo" | "Libra" | "Scorpio"
  | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export type Element = "Fire" | "Earth" | "Air" | "Water";
export type Modality = "Cardinal" | "Fixed" | "Mutable";

export interface SignPosition {
  /** Ecliptic longitude, 0–360°, normalized */
  longitude: number;
  sign: ZodiacSign;
  /** Degrees into the sign, 0–30 */
  degree: number;
  /** Arcminutes within the degree, 0–60 */
  minute: number;
  /** Pretty "12°47′ Taurus" */
  formatted: string;
}

export interface TriadMoon {
  tropical: SignPosition;
  sidereal: SignPosition & { nakshatra: Nakshatra };
  draconic: SignPosition;
  /** Lahiri ayanamsha applied (degrees) */
  ayanamsha: number;
}

export interface Nakshatra {
  index: number;          // 0–26
  name: string;
  /** Pada 1–4 within the nakshatra */
  pada: number;
  /** Ruling planet (Vimshottari) */
  ruler: string;
  /** Shakti (primal power) */
  shakti: string;
}

export type AspectName =
  | "Conjunction" | "Opposition" | "Trine"
  | "Square" | "Sextile";

export type KineticPhase = "Applying" | "Exact" | "Separating";

export interface KineticAspect {
  bodyA: Body | "Node";
  bodyB: Body | "Node";
  aspect: AspectName;
  /** Exact angle of the aspect (e.g. 90 for square) */
  exactAngle: number;
  /** Current angular separation between the two bodies, 0–180 */
  separation: number;
  /** Signed orb: negative = applying, 0 = exact, positive = separating */
  orb: number;
  phase: KineticPhase;
  /** Visual intensity 0–1 (1 = peak Heat / Apex) */
  intensity: number;
}

export interface ChandraLagnaHouse {
  house: number;        // 1–12
  sign: ZodiacSign;
  /** Domain inquiry prompt (Internal Audit) */
  inquiry: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const SIGNS: ZodiacSign[] = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export const SIGN_ELEMENT: Record<ZodiacSign, Element> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

export const SIGN_MODALITY: Record<ZodiacSign, Modality> = {
  Aries: "Cardinal", Cancer: "Cardinal", Libra: "Cardinal", Capricorn: "Cardinal",
  Taurus: "Fixed", Leo: "Fixed", Scorpio: "Fixed", Aquarius: "Fixed",
  Gemini: "Mutable", Virgo: "Mutable", Sagittarius: "Mutable", Pisces: "Mutable",
};

const NAKSHATRAS: { name: string; ruler: string; shakti: string }[] = [
  { name: "Ashwini",       ruler: "Ketu",    shakti: "Shidhra Vyapani — swift to reach" },
  { name: "Bharani",       ruler: "Venus",   shakti: "Apabharani — power of removal" },
  { name: "Krittika",      ruler: "Sun",     shakti: "Dahana — power to burn away" },
  { name: "Rohini",        ruler: "Moon",    shakti: "Rohana — power of growth" },
  { name: "Mrigashira",    ruler: "Mars",    shakti: "Prinana — power of fulfillment" },
  { name: "Ardra",         ruler: "Rahu",    shakti: "Yatna — power of effort" },
  { name: "Punarvasu",     ruler: "Jupiter", shakti: "Vasutva — power of wealth/return" },
  { name: "Pushya",        ruler: "Saturn",  shakti: "Brahmavarchasa — spiritual energy" },
  { name: "Ashlesha",      ruler: "Mercury", shakti: "Visasleshana — power to inflict & dissolve" },
  { name: "Magha",         ruler: "Ketu",    shakti: "Tyaga Kshepani — power to leave the body" },
  { name: "Purva Phalguni",ruler: "Venus",   shakti: "Prajanana — procreative power" },
  { name: "Uttara Phalguni",ruler:"Sun",     shakti: "Chayani — power of accumulation" },
  { name: "Hasta",         ruler: "Moon",    shakti: "Hastasthapaniya — power to gain what is sought" },
  { name: "Chitra",        ruler: "Mars",    shakti: "Punya Chayani — power to accumulate merit" },
  { name: "Swati",         ruler: "Rahu",    shakti: "Pradhvamsa — power to scatter like the wind" },
  { name: "Vishakha",      ruler: "Jupiter", shakti: "Vyapani — power to achieve many fruits" },
  { name: "Anuradha",      ruler: "Saturn",  shakti: "Radhana — power of worship" },
  { name: "Jyeshtha",      ruler: "Mercury", shakti: "Arohana — power to rise & conquer" },
  { name: "Mula",          ruler: "Ketu",    shakti: "Barhana — power to ruin or destroy" },
  { name: "Purva Ashadha", ruler: "Venus",   shakti: "Varchograhana — power of invigoration" },
  { name: "Uttara Ashadha",ruler: "Sun",     shakti: "Apradhrsya — unchallengeable victory" },
  { name: "Shravana",      ruler: "Moon",    shakti: "Samhanana — power of connection" },
  { name: "Dhanishta",     ruler: "Mars",    shakti: "Khyapayitri — power of fame & abundance" },
  { name: "Shatabhisha",   ruler: "Rahu",    shakti: "Bheshaja — power of healing" },
  { name: "Purva Bhadrapada", ruler:"Jupiter",shakti: "Yajamana Udyamana — fire of sacrifice" },
  { name: "Uttara Bhadrapada", ruler:"Saturn",shakti: "Varshodyamana — power of the cosmic rain" },
  { name: "Revati",        ruler: "Mercury", shakti: "Kshiradyapani — power of nourishment" },
];

const HOUSE_INQUIRIES: Record<number, string> = {
  1:  "Self-presentation. What identity am I performing today, and is it congruent with internal state?",
  2:  "Resources & values. Where is energy being spent that does not align with stated worth?",
  3:  "Communication. Which message am I rehearsing but not yet delivering?",
  4:  "Foundations. Which inherited or ancestral pattern is currently driving an emotional response?",
  5:  "Expression. What unstructured creative output is being suppressed for productivity?",
  6:  "Daily systems. Which repeated process is producing friction rather than refinement?",
  7:  "Mirrors. What quality am I reacting to in another that is unowned in myself?",
  8:  "Shared depth. Which boundary around resources, intimacy, or trust requires renegotiation?",
  9:  "Frameworks. Which belief is being treated as fact without recent re-examination?",
  10: "Public structure. Is current visible action a true vector of stated long-range intent?",
  11: "Networks. Which alliance is energetically reciprocal, and which is extractive?",
  12: "Subconscious. What pattern operates below conscious observation and requires light?",
};

const ASPECT_DEFS: { name: AspectName; angle: number; orb: number }[] = [
  { name: "Conjunction", angle: 0,   orb: 8 },
  { name: "Opposition",  angle: 180, orb: 8 },
  { name: "Trine",       angle: 120, orb: 7 },
  { name: "Square",      angle: 90,  orb: 7 },
  { name: "Sextile",     angle: 60,  orb: 5 },
];

/** Kinetic orb thresholds (degrees) per spec. */
export const KINETIC = {
  applyingMax: 3,   // 0–3° approaching
  separatingMax: 5, // 0–5° receding
  apexEpsilon: 0.0833, // 5 arcminutes ≈ "Exact"
} as const;

// ─────────────────────────────────────────────────────────────
// Math helpers
// ─────────────────────────────────────────────────────────────

const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Smallest signed difference a→b in (-180, 180]. */
const angleDiff = (a: number, b: number) => {
  const d = norm360(b - a + 540) - 180;
  return d;
};

/** Lahiri Ayanamsha (degrees) — Chitrapaksha. Linear approximation
 *  accurate to ~0.001° across 1900–2100; sufficient for sub-arcminute UI. */
function lahiriAyanamsha(time: AstroTime): number {
  // Reference epoch: J2000.0 = JD 2451545.0, ayanamsha ≈ 23.85258°
  const T = (time.tt) / 36525; // Julian centuries from J2000 in TT days
  return 23.85258 + 50.27875 / 3600 * (T * 36525 / 365.25);
}

function toSignPosition(longitude: number): SignPosition {
  const lon = norm360(longitude);
  const idx = Math.floor(lon / 30);
  const sign = SIGNS[idx];
  const degIntoSign = lon - idx * 30;
  const degree = Math.floor(degIntoSign);
  const minute = Math.floor((degIntoSign - degree) * 60);
  return {
    longitude: lon,
    sign,
    degree,
    minute,
    formatted: `${degree}°${String(minute).padStart(2, "0")}′ ${sign}`,
  };
}

// ─────────────────────────────────────────────────────────────
// Body positions
// ─────────────────────────────────────────────────────────────

/** True Node geocentric ecliptic longitude (degrees).
 *  astronomy-engine exposes Body.MoonNode whose coordinates point to the
 *  ascending node — instantaneous (true), includes nutation jitter. */
function trueNodeLongitude(time: AstroTime): number {
  const vec = GeoVector(Body.MoonNode, time, true);
  const ecl = Ecliptic(vec);
  return norm360(ecl.elon);
}

function moonTropicalLongitude(time: AstroTime): number {
  return norm360(EclipticGeoMoon(time).lon);
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/** Compute the Triad Moon for a given instant. */
export function computeTriadMoon(at: Date = new Date()): TriadMoon {
  const time = new AstroTime(at);
  const tropLon = moonTropicalLongitude(time);
  const nodeLon = trueNodeLongitude(time);
  const ayan = lahiriAyanamsha(time);

  const sidLon = norm360(tropLon - ayan);
  // Draconic: rotate the chart so the North Node = 0° Aries.
  // Draconic Moon = (Moon − North Node) mod 360, in tropical frame.
  const dracLon = norm360(tropLon - nodeLon);

  const sidPos = toSignPosition(sidLon);
  const nakIndex = Math.floor((sidLon * 27) / 360);
  const within = (sidLon * 27) / 360 - nakIndex;       // 0–1 within nakshatra
  const pada = Math.min(4, Math.floor(within * 4) + 1);
  const nak = NAKSHATRAS[nakIndex];

  return {
    tropical: toSignPosition(tropLon),
    sidereal: {
      ...sidPos,
      nakshatra: {
        index: nakIndex,
        name: nak.name,
        pada,
        ruler: nak.ruler,
        shakti: nak.shakti,
      },
    },
    draconic: toSignPosition(dracLon),
    ayanamsha: ayan,
  };
}

/** Whole Sign houses with Chandra Lagna (Moon sign = House 1). */
export function chandraLagnaHouses(moonSign: ZodiacSign): ChandraLagnaHouse[] {
  const start = SIGNS.indexOf(moonSign);
  return Array.from({ length: 12 }, (_, i) => {
    const sign = SIGNS[(start + i) % 12];
    const house = i + 1;
    return { house, sign, inquiry: HOUSE_INQUIRIES[house] };
  });
}

/** Locate which Chandra Lagna house the *transiting* Moon currently occupies
 *  for a given natal Moon sign. Returns the daily Internal Audit. */
export function dailyInternalAudit(
  natalMoonSign: ZodiacSign,
  at: Date = new Date(),
): ChandraLagnaHouse {
  const triad = computeTriadMoon(at);
  const transitSign = triad.tropical.sign;
  const houses = chandraLagnaHouses(natalMoonSign);
  return houses.find((h) => h.sign === transitSign) ?? houses[0];
}

/** Compute the kinetic phase of an aspect given two longitudes and the
 *  angular velocities of both bodies (deg/day). The faster body's motion
 *  toward exact = applying. */
function classifyKinetic(
  lonA: number, lonB: number,
  velA: number, velB: number,
  aspectAngle: number,
): { separation: number; orb: number; phase: KineticPhase; intensity: number } {
  const sep = Math.abs(angleDiff(lonA, lonB));
  // Compare to nearest expression of this aspect (0 or 180 etc.)
  const orb = sep - aspectAngle;
  // Project relative motion onto closing direction.
  const rel = velB - velA; // deg/day
  // If sep is decreasing, aspect is applying.
  const closing = (rel * Math.sign(angleDiff(lonA, lonB))) < 0;
  const absOrb = Math.abs(orb);

  let phase: KineticPhase;
  let intensity: number;
  if (absOrb <= KINETIC.apexEpsilon) {
    phase = "Exact";
    intensity = 1;
  } else if (closing && absOrb <= KINETIC.applyingMax) {
    phase = "Applying";
    // Heat ramps up as orb shrinks.
    intensity = 1 - absOrb / KINETIC.applyingMax;
  } else {
    phase = "Separating";
    // Cold ghosting fades as orb widens.
    intensity = Math.max(0, 1 - absOrb / KINETIC.separatingMax);
  }
  return { separation: sep, orb: closing ? -absOrb : absOrb, phase, intensity };
}

interface BodyState { body: Body | "Node"; lon: number; vel: number }

/** Sample a body's longitude and instantaneous velocity (deg/day). */
function sampleBody(body: Body | "Node", time: AstroTime): BodyState {
  const dt = 1 / 24; // 1 hour in days
  const t2 = time.AddDays(dt);
  const lon =
    body === "Node" ? trueNodeLongitude(time)
    : body === Body.Moon ? moonTropicalLongitude(time)
    : norm360(Ecliptic(GeoVector(body, time, true)).elon);
  const lon2 =
    body === "Node" ? trueNodeLongitude(t2)
    : body === Body.Moon ? moonTropicalLongitude(t2)
    : norm360(Ecliptic(GeoVector(body, t2, true)).elon);
  // Handle wrap.
  let d = lon2 - lon;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return { body, lon, vel: d / dt };
}

const TRACKED_BODIES: (Body | "Node")[] = [
  Body.Sun, Body.Moon, Body.Mercury, Body.Venus, Body.Mars,
  Body.Jupiter, Body.Saturn, "Node",
];

/** Compute all kinetic aspects currently active (within configured orbs). */
export function computeKineticAspects(at: Date = new Date()): KineticAspect[] {
  const time = new AstroTime(at);
  const states: BodyState[] = TRACKED_BODIES.map((b) => sampleBody(b, time));
  const out: KineticAspect[] = [];

  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const a = states[i];
      const b = states[j];
      for (const def of ASPECT_DEFS) {
        const k = classifyKinetic(a.lon, b.lon, a.vel, b.vel, def.angle);
        const within =
          k.phase === "Exact" ||
          (k.phase === "Applying"   && Math.abs(k.orb) <= KINETIC.applyingMax) ||
          (k.phase === "Separating" && Math.abs(k.orb) <= KINETIC.separatingMax);
        if (!within) continue;
        out.push({
          bodyA: a.body, bodyB: b.body,
          aspect: def.name, exactAngle: def.angle,
          separation: k.separation, orb: k.orb,
          phase: k.phase, intensity: k.intensity,
        });
      }
    }
  }
  // Sort: Exact first, then highest intensity.
  out.sort((x, y) => {
    if (x.phase === "Exact" && y.phase !== "Exact") return -1;
    if (y.phase === "Exact" && x.phase !== "Exact") return 1;
    return y.intensity - x.intensity;
  });
  return out;
}

/** Identify "Shadow Loops" — applying aspects with orb ≤ 3° that warrant
 *  conscious observation (Shadow-to-Light prompt). */
export function shadowLoops(aspects: KineticAspect[]): KineticAspect[] {
  return aspects.filter(
    (a) => (a.phase === "Applying" || a.phase === "Exact") && Math.abs(a.orb) <= 3,
  );
}

export function bodyLabel(b: Body | "Node"): string {
  if (b === "Node") return "True Node";
  return Body[b as Body] ?? String(b);
}
