/**
 * Traditional chart context (Deno / edge build).
 * ---------------------------------------------------------------
 * Positions come from astronomy-engine — the same source the Sovereign
 * engine and the Swiss Ephemeris test suite already validate. Meaning
 * comes from the classical tables in ./traditional/core, never from prose.
 *
 * No birth time is used or required: houses are whole-sign, counted from
 * the Moon (Chandra Lagna) and from the Sun, and both are labelled as
 * lenses rather than a natal house system.
 */

import { Body, EclipticGeoMoon, GeoVector, Ecliptic, AstroTime, Observer, Equator, Horizon } from "https://esm.sh/astronomy-engine@2.1.19";
import {
  CLASSICAL_PLANETS,
  HOUSE_TOPICS,
  TradAspect,
  TradPlanet,
  TradSign,
  boundLord,
  classicalAspects,
  degreeInSign,
  dignityOf,
  dignityPhrase,
  norm360,
  sectNature,
  sectStanding,
  signFromLongitude,
  triplicityLord,
  wholeSignHouses,
  type DignityState,
} from "./traditionalCore.ts";

export interface TradPlanetCondition {
  planet: TradPlanet;
  longitude: number;
  sign: TradSign;
  degree: number;
  retrograde: boolean;
  dignity: DignityState;
  dignityPhrase: string;
  signLord: TradPlanet;
  boundLord: TradPlanet;
  triplicityLord: TradPlanet;
  sect: "of the sect" | "contrary to the sect" | "neutral";
  sectNature: string | null;
  /** Whole-sign house from the Moon, then from the Sun. */
  houseFromMoon: number;
  houseFromSun: number;
}

export interface TraditionalContext {
  momentUtc: string;
  /** Sect depends on the horizon, so it is computed at a stated reference place. */
  isDay: boolean;
  sectNote: string;
  planets: TradPlanetCondition[];
  aspects: TradAspect[];
  moonSign: TradSign;
  sunSign: TradSign;
  chandraLagna: Record<number, TradSign>;
  solarHouses: Record<number, TradSign>;
}

const BODY_MAP: Record<Exclude<TradPlanet, "Moon">, Body> = {
  Sun: Body.Sun,
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
};

function longitudeOf(planet: TradPlanet, date: Date): number {
  if (planet === "Moon") return norm360(EclipticGeoMoon(new AstroTime(date)).lon);
  return norm360(Ecliptic(GeoVector(BODY_MAP[planet], new AstroTime(date), true)).elon);
}

function isRetrograde(planet: TradPlanet, date: Date): boolean {
  if (planet === "Sun" || planet === "Moon") return false;
  const before = longitudeOf(planet, new Date(date.getTime() - 12 * 3600 * 1000));
  const after = longitudeOf(planet, new Date(date.getTime() + 12 * 3600 * 1000));
  let delta = after - before;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta < 0;
}

/**
 * Day or night, decided by the Sun's altitude at a reference observer.
 * Defaults to Greenwich because our publishing clock is UTC; callers with a
 * real location should pass one.
 */
function computeIsDay(date: Date, latitude = 51.4779, longitude = -0.0015): boolean {
  const observer = new Observer(latitude, longitude, 0);
  const eq = Equator(Body.Sun, new AstroTime(date), observer, true, true);
  return Horizon(new AstroTime(date), observer, eq.ra, eq.dec, "normal").altitude > 0;
}

export function buildTraditionalContext(
  date: Date = new Date(),
  observer?: { latitude: number; longitude: number },
): TraditionalContext {
  const isDay = computeIsDay(date, observer?.latitude, observer?.longitude);

  const longitudes: Partial<Record<TradPlanet, number>> = {};
  for (const planet of CLASSICAL_PLANETS) longitudes[planet] = longitudeOf(planet, date);

  const moonSign = signFromLongitude(longitudes.Moon!);
  const sunSign = signFromLongitude(longitudes.Sun!);
  const fromMoon = wholeSignHouses(moonSign);
  const fromSun = wholeSignHouses(sunSign);
  const houseIndex = (map: Record<number, TradSign>, sign: TradSign) =>
    Number(Object.keys(map).find((h) => map[Number(h)] === sign) ?? 1);

  // Mercury oriental = rising before the Sun (behind it in zodiacal order).
  const mercuryGap = norm360(longitudes.Mercury! - longitudes.Sun!);
  const mercuryIsOriental = mercuryGap > 180;

  const planets: TradPlanetCondition[] = CLASSICAL_PLANETS.map((planet) => {
    const lon = longitudes[planet]!;
    const sign = signFromLongitude(lon);
    const dignity = dignityOf(planet, lon);
    return {
      planet,
      longitude: Number(lon.toFixed(3)),
      sign,
      degree: Number(degreeInSign(lon).toFixed(2)),
      retrograde: isRetrograde(planet, date),
      dignity,
      dignityPhrase: dignityPhrase(dignity),
      signLord: (
        { Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon", Leo: "Sun",
          Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars", Sagittarius: "Jupiter",
          Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter" } as Record<TradSign, TradPlanet>
      )[sign],
      boundLord: boundLord(lon),
      triplicityLord: triplicityLord(lon, isDay),
      sect: sectStanding(planet, isDay, planet === "Mercury" ? mercuryIsOriental : undefined),
      sectNature: sectNature(planet, isDay),
      houseFromMoon: houseIndex(fromMoon, sign),
      houseFromSun: houseIndex(fromSun, sign),
    };
  });

  return {
    momentUtc: date.toISOString(),
    isDay,
    sectNote: isDay
      ? "Day chart (Sun above the horizon at the reference meridian) — the diurnal sect is in charge."
      : "Night chart (Sun below the horizon at the reference meridian) — the nocturnal sect is in charge.",
    planets,
    aspects: classicalAspects(longitudes),
    moonSign,
    sunSign,
    chandraLagna: fromMoon,
    solarHouses: fromSun,
  };
}

/** Human-readable brief handed to the content generator verbatim. */
export function formatTraditionalBrief(ctx: TraditionalContext): string {
  const lines: string[] = [];
  lines.push(`Moment (UTC): ${ctx.momentUtc}`);
  lines.push(ctx.sectNote);
  lines.push("");
  lines.push("Condition of the seven classical planets:");
  for (const p of ctx.planets) {
    lines.push(
      `- ${p.planet} at ${p.degree.toFixed(1)}° ${p.sign}${p.retrograde ? " (retrograde)" : ""}: ${p.dignityPhrase}. ` +
        `Sign lord ${p.signLord}, bound lord ${p.boundLord}, triplicity lord ${p.triplicityLord}. ` +
        `${p.sect}${p.sectNature ? ` — ${p.sectNature}` : ""}. ` +
        `House ${p.houseFromMoon} from the Moon (${HOUSE_TOPICS[p.houseFromMoon]}).`,
    );
  }
  lines.push("");
  lines.push("Classical configurations (Ptolemaic aspects only, tightest first):");
  const top = ctx.aspects.slice(0, 8);
  if (top.length === 0) lines.push("- None within traditional orb.");
  for (const a of top) {
    lines.push(
      `- ${a.a} ${a.aspect} ${a.b}, orb ${a.orb}°, ${a.applying ? "applying" : "separating"}${a.wholeSign ? ", whole-sign" : ", partile by degree only"}.`,
    );
  }
  lines.push("");
  lines.push(
    `Whole-sign houses from the Moon (Chandra Lagna, ${ctx.moonSign} rising as house 1) and from the Sun (${ctx.sunSign}). ` +
      "No Ascendant or natal houses are used because no birth time is collected.",
  );
  return lines.join("\n");
}
