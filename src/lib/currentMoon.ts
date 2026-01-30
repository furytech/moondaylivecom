// Current Moon Sign Calculator
// Calculates the moon sign for any given date

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

// Known new moon date for reference (Jan 29, 2025)
const REFERENCE_NEW_MOON = new Date(2025, 0, 29);
const LUNAR_CYCLE_DAYS = 29.53059;
const MOON_SIGN_DAYS = 2.46421; // ~29.53 / 12

function daysSinceReference(date: Date): number {
  const diffMs = date.getTime() - REFERENCE_NEW_MOON.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

function getMoonPhase(daysSinceNew: number): { phase: string; illumination: number; phaseEmoji: string } {
  const cyclePosition = ((daysSinceNew % LUNAR_CYCLE_DAYS) + LUNAR_CYCLE_DAYS) % LUNAR_CYCLE_DAYS;
  const phaseIndex = cyclePosition / LUNAR_CYCLE_DAYS;
  
  // Calculate illumination (0-100%)
  const illumination = Math.round(50 * (1 - Math.cos(2 * Math.PI * phaseIndex)));
  
  if (phaseIndex < 0.0625) return { phase: "New Moon", illumination, phaseEmoji: "🌑" };
  if (phaseIndex < 0.1875) return { phase: "Waxing Crescent", illumination, phaseEmoji: "🌒" };
  if (phaseIndex < 0.3125) return { phase: "First Quarter", illumination, phaseEmoji: "🌓" };
  if (phaseIndex < 0.4375) return { phase: "Waxing Gibbous", illumination, phaseEmoji: "🌔" };
  if (phaseIndex < 0.5625) return { phase: "Full Moon", illumination, phaseEmoji: "🌕" };
  if (phaseIndex < 0.6875) return { phase: "Waning Gibbous", illumination, phaseEmoji: "🌖" };
  if (phaseIndex < 0.8125) return { phase: "Last Quarter", illumination, phaseEmoji: "🌗" };
  if (phaseIndex < 0.9375) return { phase: "Waning Crescent", illumination, phaseEmoji: "🌘" };
  return { phase: "New Moon", illumination, phaseEmoji: "🌑" };
}

export function getCurrentMoon(date: Date = new Date()): CurrentMoonData {
  const days = daysSinceReference(date);
  
  // Calculate current moon sign
  // Reference: On Jan 29, 2025 (new moon), moon was in Aquarius
  const referenceSignIndex = 10; // Aquarius
  const signOffset = Math.floor(days / MOON_SIGN_DAYS);
  const currentSignIndex = ((referenceSignIndex + signOffset) % 12 + 12) % 12;
  
  const currentSign = moonSigns[currentSignIndex];
  const phaseData = getMoonPhase(days);
  
  return {
    sign: currentSign.sign,
    symbol: currentSign.symbol,
    element: currentSign.element,
    phase: phaseData.phase,
    illumination: phaseData.illumination,
    phaseEmoji: phaseData.phaseEmoji,
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
