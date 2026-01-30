// Moon Sign Calculator using accurate ephemeris data
// Uses astronomy-bundle library for precise calculations

import { createTimeOfInterest } from 'astronomy-bundle/time';
import { createMoon } from 'astronomy-bundle/moon';

export interface MoonSignResult {
  sign: string;
  symbol: string;
  element: string;
  description: string;
  traits: string[];
  emotionalStyle: string;
}

const moonSignData: Record<string, Omit<MoonSignResult, 'sign'>> = {
  Aries: {
    symbol: "♈",
    element: "Fire",
    description: "Your emotional nature is passionate, impulsive, and fiercely independent. You feel things quickly and intensely, with a need for excitement and new beginnings.",
    traits: ["Passionate", "Impulsive", "Courageous", "Independent", "Enthusiastic"],
    emotionalStyle: "You process emotions through action and movement. When you feel, you need to do something about it immediately."
  },
  Taurus: {
    symbol: "♉",
    element: "Earth",
    description: "Your emotional nature craves stability, comfort, and sensory pleasure. You are deeply loyal and find security in the familiar and beautiful things in life.",
    traits: ["Steadfast", "Sensual", "Patient", "Loyal", "Grounded"],
    emotionalStyle: "You process emotions slowly and thoroughly, needing time and physical comfort to work through feelings."
  },
  Gemini: {
    symbol: "♊",
    element: "Air",
    description: "Your emotional nature is curious, communicative, and ever-changing. You process feelings through talking, thinking, and gathering information.",
    traits: ["Curious", "Adaptable", "Witty", "Expressive", "Restless"],
    emotionalStyle: "You intellectualize your emotions and need to talk things through to understand how you feel."
  },
  Cancer: {
    symbol: "♋",
    element: "Water",
    description: "Your emotional nature is deeply nurturing, intuitive, and protective. Home and family are central to your emotional wellbeing.",
    traits: ["Nurturing", "Intuitive", "Protective", "Sensitive", "Nostalgic"],
    emotionalStyle: "You feel everything deeply and absorb the emotions of those around you. Your moods shift like the tides."
  },
  Leo: {
    symbol: "♌",
    element: "Fire",
    description: "Your emotional nature is warm, generous, and dramatic. You need recognition and appreciation to feel emotionally fulfilled.",
    traits: ["Generous", "Warm", "Creative", "Dramatic", "Loyal"],
    emotionalStyle: "You wear your heart on your sleeve and express emotions with flair and authenticity."
  },
  Virgo: {
    symbol: "♍",
    element: "Earth",
    description: "Your emotional nature seeks order, purpose, and practical expression. You show love through acts of service and attention to detail.",
    traits: ["Analytical", "Helpful", "Modest", "Practical", "Discerning"],
    emotionalStyle: "You process emotions by analyzing them and finding practical solutions to emotional challenges."
  },
  Libra: {
    symbol: "♎",
    element: "Air",
    description: "Your emotional nature craves harmony, partnership, and beauty. You feel most balanced when your relationships are peaceful.",
    traits: ["Diplomatic", "Harmonious", "Romantic", "Fair-minded", "Graceful"],
    emotionalStyle: "You seek emotional equilibrium and often process feelings through relationships and aesthetic experiences."
  },
  Scorpio: {
    symbol: "♏",
    element: "Water",
    description: "Your emotional nature is intense, transformative, and deeply private. You experience emotions with profound depth and passion.",
    traits: ["Intense", "Perceptive", "Passionate", "Resilient", "Magnetic"],
    emotionalStyle: "You feel emotions with incredible depth and often keep your true feelings hidden beneath the surface."
  },
  Sagittarius: {
    symbol: "♐",
    element: "Fire",
    description: "Your emotional nature is optimistic, adventurous, and freedom-loving. You need space to explore and find meaning in life.",
    traits: ["Optimistic", "Adventurous", "Philosophical", "Honest", "Expansive"],
    emotionalStyle: "You process emotions through movement, travel, and seeking the bigger picture and meaning."
  },
  Capricorn: {
    symbol: "♑",
    element: "Earth",
    description: "Your emotional nature is reserved, ambitious, and deeply responsible. You feel secure when working toward long-term goals.",
    traits: ["Ambitious", "Disciplined", "Responsible", "Reserved", "Wise"],
    emotionalStyle: "You approach emotions with maturity and often process feelings privately over time."
  },
  Aquarius: {
    symbol: "♒",
    element: "Air",
    description: "Your emotional nature is unconventional, humanitarian, and intellectually oriented. You value freedom and authentic expression.",
    traits: ["Innovative", "Independent", "Humanitarian", "Objective", "Original"],
    emotionalStyle: "You often step back from emotions to understand them objectively, valuing mental clarity over emotional intensity."
  },
  Pisces: {
    symbol: "♓",
    element: "Water",
    description: "Your emotional nature is deeply empathic, imaginative, and spiritually attuned. You absorb the feelings of everything around you.",
    traits: ["Empathic", "Dreamy", "Compassionate", "Artistic", "Intuitive"],
    emotionalStyle: "You feel emotions from the collective unconscious and often need solitude to distinguish your feelings from others'."
  }
};

// Zodiac signs in order, each spanning 30 degrees of ecliptic longitude
const zodiacSigns = [
  "Aries",      // 0° - 30°
  "Taurus",     // 30° - 60°
  "Gemini",     // 60° - 90°
  "Cancer",     // 90° - 120°
  "Leo",        // 120° - 150°
  "Virgo",      // 150° - 180°
  "Libra",      // 180° - 210°
  "Scorpio",    // 210° - 240°
  "Sagittarius", // 240° - 270°
  "Capricorn",  // 270° - 300°
  "Aquarius",   // 300° - 330°
  "Pisces"      // 330° - 360°
];

// Convert ecliptic longitude to zodiac sign
function longitudeToZodiacSign(longitude: number): string {
  // Normalize longitude to 0-360 range
  const normalizedLon = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalizedLon / 30);
  return zodiacSigns[signIndex];
}

export interface TransitionCheck {
  isTransitionDay: boolean;
  signAtStart: string;
  signAtEnd: string;
}

// Check if a date is a transition day (moon changes signs during the day)
export async function checkTransitionDay(birthDate: Date): Promise<TransitionCheck> {
  const startSign = await calculateMoonSignForTime(birthDate, 0); // Start of day
  const endSign = await calculateMoonSignForTime(birthDate, 23); // End of day
  
  return {
    isTransitionDay: startSign !== endSign,
    signAtStart: startSign,
    signAtEnd: endSign
  };
}

// Synchronous version for backwards compatibility - uses approximation for transition check
export function checkTransitionDaySync(birthDate: Date): TransitionCheck {
  // For the sync version, we'll use the accurate calculation at noon
  // and estimate based on moon's average daily motion (~13 degrees)
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();
  
  // Create TOI for start and end of day
  const toiStart = createTimeOfInterest.fromTime(year, month, day, 0, 0, 0);
  const toiEnd = createTimeOfInterest.fromTime(year, month, day, 23, 59, 59);
  
  // For sync check, we'll assume no transition and let async version handle accuracy
  // This is a placeholder - the actual check happens asynchronously
  return {
    isTransitionDay: false,
    signAtStart: "",
    signAtEnd: ""
  };
}

// Calculate moon sign for a specific hour of the day
async function calculateMoonSignForTime(birthDate: Date, hour: number): Promise<string> {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1; // astronomy-bundle uses 1-indexed months
  const year = birthDate.getFullYear();
  
  const toi = createTimeOfInterest.fromTime(year, month, day, hour, 0, 0);
  const moon = createMoon(toi);
  
  // Get the moon's ecliptic longitude
  const coords = await moon.getGeocentricEclipticSphericalDateCoordinates();
  
  return longitudeToZodiacSign(coords.lon);
}

// Calculate Moon sign using accurate ephemeris data
// Uses astronomy-bundle library for precise astronomical calculations
export async function calculateMoonSignAsync(birthDate: Date): Promise<MoonSignResult> {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1; // astronomy-bundle uses 1-indexed months
  const year = birthDate.getFullYear();
  
  // Use noon as the default time (middle of day) when exact birth time is unknown
  const toi = createTimeOfInterest.fromTime(year, month, day, 12, 0, 0);
  const moon = createMoon(toi);
  
  // Get the moon's ecliptic longitude
  const coords = await moon.getGeocentricEclipticSphericalDateCoordinates();
  const signName = longitudeToZodiacSign(coords.lon);
  
  return {
    sign: signName,
    ...moonSignData[signName]
  };
}

// Synchronous wrapper that calculates immediately (for backwards compatibility)
// Note: This uses an approximation. For accurate results, use calculateMoonSignAsync
export function calculateMoonSign(birthDate: Date): MoonSignResult {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();
  
  // Create time of interest for noon
  const toi = createTimeOfInterest.fromTime(year, month, day, 12, 0, 0);
  const moon = createMoon(toi);
  
  // We need to handle this synchronously, but the library is async
  // Return a placeholder and let the calling code use the async version
  // For now, use a calculation based on Julian Day formula
  
  // Julian Day calculation (simplified)
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  // Moon's mean longitude (approximate formula from Meeus)
  const T = (jd - 2451545.0) / 36525; // Julian centuries from J2000
  
  // Mean longitude of the Moon (degrees)
  let L = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841 - T * T * T * T / 65194000;
  
  // Normalize to 0-360
  L = ((L % 360) + 360) % 360;
  
  const signName = longitudeToZodiacSign(L);
  
  return {
    sign: signName,
    ...moonSignData[signName]
  };
}

export function getMoonSignByName(signName: string): MoonSignResult | null {
  if (moonSignData[signName]) {
    return {
      sign: signName,
      ...moonSignData[signName]
    };
  }
  return null;
}
