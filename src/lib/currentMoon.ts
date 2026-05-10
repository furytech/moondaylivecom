// Current Moon Sign Calculator
// Uses astronomy-engine for sub-arcminute accurate geocentric tropical
// positions — the same engine that powers the Sovereign blueprint.

import {
  AstroTime,
  EclipticGeoMoon,
  Illumination,
  MoonPhase,
  Body,
} from "astronomy-engine";

export interface CurrentMoonData {
  sign: string;
  symbol: string;
  element: string;
  phase: string;
  illumination: number;
  phaseEmoji: string;
}

const moonSigns = [
  { sign: "Aries", symbol: "♈", element: "Fire" },
  { sign: "Taurus", symbol: "♉", element: "Earth" },
  { sign: "Gemini", symbol: "♊", element: "Air" },
  { sign: "Cancer", symbol: "♋", element: "Water" },
  { sign: "Leo", symbol: "♌", element: "Fire" },
  { sign: "Virgo", symbol: "♍", element: "Earth" },
  { sign: "Libra", symbol: "♎", element: "Air" },
  { sign: "Scorpio", symbol: "♏", element: "Water" },
  { sign: "Sagittarius", symbol: "♐", element: "Fire" },
  { sign: "Capricorn", symbol: "♑", element: "Earth" },
  { sign: "Aquarius", symbol: "♒", element: "Air" },
  { sign: "Pisces", symbol: "♓", element: "Water" },
];

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

/**
 * MoonPhase returns the elongation of the Moon from the Sun in degrees:
 *   0° = New, 90° = First Quarter, 180° = Full, 270° = Last Quarter.
 */
function describePhase(phaseAngle: number): { phase: string; phaseEmoji: string } {
  const a = norm360(phaseAngle);
  if (a < 22.5)  return { phase: "New Moon",         phaseEmoji: "🌑" };
  if (a < 67.5)  return { phase: "Waxing Crescent",  phaseEmoji: "🌒" };
  if (a < 112.5) return { phase: "First Quarter",    phaseEmoji: "🌓" };
  if (a < 157.5) return { phase: "Waxing Gibbous",   phaseEmoji: "🌔" };
  if (a < 202.5) return { phase: "Full Moon",        phaseEmoji: "🌕" };
  if (a < 247.5) return { phase: "Waning Gibbous",   phaseEmoji: "🌖" };
  if (a < 292.5) return { phase: "Last Quarter",     phaseEmoji: "🌗" };
  if (a < 337.5) return { phase: "Waning Crescent",  phaseEmoji: "🌘" };
  return { phase: "New Moon", phaseEmoji: "🌑" };
}

export function getCurrentMoon(date: Date = new Date()): CurrentMoonData {
  const time = new AstroTime(date);

  // Geocentric tropical ecliptic longitude of the Moon (degrees, 0–360)
  const lon = norm360(EclipticGeoMoon(time).lon);
  const signIndex = Math.floor(lon / 30) % 12;
  const currentSign = moonSigns[signIndex];

  // True phase angle (Sun–Earth–Moon elongation) and illuminated fraction
  const phaseAngle = MoonPhase(time);
  const illum = Illumination(Body.Moon, time);
  const illumination = Math.round(illum.phase_fraction * 100);
  const { phase, phaseEmoji } = describePhase(phaseAngle);

  return {
    sign: currentSign.sign,
    symbol: currentSign.symbol,
    element: currentSign.element,
    phase,
    illumination,
    phaseEmoji,
  };
}

export function getMoonMessage(moonData: CurrentMoonData): string {
  const messages: Record<string, string> = {
    Aries: "Bold energy ignites your inner fire. Take action on your desires.",
    Taurus: "Ground yourself in comfort and beauty. Patience brings rewards.",
    Gemini: "Curiosity calls. Connect, communicate, and explore new ideas.",
    Cancer: "Nurture yourself and loved ones. Home is your sanctuary tonight.",
    Leo: "Express yourself boldly. Your creativity shines brightest now.",
    Virgo: "Organize your thoughts and space. Details matter today.",
    Libra: "Seek balance and harmony. Relationships take center stage.",
    Scorpio: "Dive deep into your emotions. Transformation awaits.",
    Sagittarius: "Adventure beckons. Expand your horizons and seek truth.",
    Capricorn: "Focus on your goals. Discipline opens doors to success.",
    Aquarius: "Embrace your uniqueness. Innovation flows through you.",
    Pisces: "Dreams hold wisdom. Trust your intuition and inner visions.",
  };

  return messages[moonData.sign] || "The moon guides your path tonight.";
}
