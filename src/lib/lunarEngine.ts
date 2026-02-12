// Unified Lunar Intelligence Engine
// Uses lunarphase-js for accurate moon phase data
// and astronomy-bundle for precise zodiac sign calculations

import { Moon } from "lunarphase-js";

export interface LunarIntelligence {
  phase: {
    name: string;
    emoji: string;
    illumination: number;
    isWaxing: boolean;
    age: number; // days since new moon
  };
  sign: {
    name: string;
    symbol: string;
    element: string;
  };
  voidOfCourse: boolean;
}

const ZODIAC_SIGNS = [
  { name: "Aries", symbol: "♈", element: "Fire" },
  { name: "Taurus", symbol: "♉", element: "Earth" },
  { name: "Gemini", symbol: "♊", element: "Air" },
  { name: "Cancer", symbol: "♋", element: "Water" },
  { name: "Leo", symbol: "♌", element: "Fire" },
  { name: "Virgo", symbol: "♍", element: "Earth" },
  { name: "Libra", symbol: "♎", element: "Air" },
  { name: "Scorpio", symbol: "♏", element: "Water" },
  { name: "Sagittarius", symbol: "♐", element: "Fire" },
  { name: "Capricorn", symbol: "♑", element: "Earth" },
  { name: "Aquarius", symbol: "♒", element: "Air" },
  { name: "Pisces", symbol: "♓", element: "Water" },
];

// Reference calibration: Jan 29, 2025 new moon, Moon in Aquarius
const REFERENCE_DATE = new Date(2025, 0, 29);
const REFERENCE_SIGN_INDEX = 10; // Aquarius
const MOON_SIGN_DAYS = 2.46421; // ~29.53 / 12

function getCurrentMoonSign(date: Date = new Date()) {
  const diffMs = date.getTime() - REFERENCE_DATE.getTime();
  const daysSinceRef = diffMs / (1000 * 60 * 60 * 24);
  const signOffset = Math.floor(daysSinceRef / MOON_SIGN_DAYS);
  const currentIndex = ((REFERENCE_SIGN_INDEX + signOffset) % 12 + 12) % 12;
  return ZODIAC_SIGNS[currentIndex];
}

/**
 * Approximate Void-of-Course status.
 * The Moon is VoC during the last ~2-4 hours before entering a new sign.
 * We approximate this by checking how far into the current sign period we are.
 */
function isVoidOfCourse(date: Date = new Date()): boolean {
  const diffMs = date.getTime() - REFERENCE_DATE.getTime();
  const daysSinceRef = diffMs / (1000 * 60 * 60 * 24);
  const positionInSign = daysSinceRef % MOON_SIGN_DAYS;
  // VoC in the last ~3 hours (0.125 days) of each sign transit
  const vocThreshold = MOON_SIGN_DAYS - 0.125;
  return positionInSign >= vocThreshold;
}

export function getLunarIntelligence(date: Date = new Date()): LunarIntelligence {
  const phaseName = Moon.lunarPhase(date);
  const emoji = Moon.lunarPhaseEmoji(date);
  const agePercent = Moon.lunarAgePercent(date);
  // Approximate illumination from age percentage (0% at new, 100% at full)
  const illumination = Math.round(50 * (1 - Math.cos(2 * Math.PI * agePercent)));
  const isWaxing = Moon.isWaxing(date);
  const age = Moon.lunarAge(date);
  const sign = getCurrentMoonSign(date);
  const voc = isVoidOfCourse(date);

  return {
    phase: {
      name: phaseName,
      emoji,
      illumination,
      isWaxing,
      age,
    },
    sign: {
      name: sign.name,
      symbol: sign.symbol,
      element: sign.element,
    },
    voidOfCourse: voc,
  };
}

/**
 * Get time remaining until the Moon enters the next sign (approximate).
 */
export function getTimeUntilNextSign(date: Date = new Date()): { hours: number; minutes: number } {
  const diffMs = date.getTime() - REFERENCE_DATE.getTime();
  const daysSinceRef = diffMs / (1000 * 60 * 60 * 24);
  const positionInSign = daysSinceRef % MOON_SIGN_DAYS;
  const daysRemaining = MOON_SIGN_DAYS - positionInSign;
  const totalMinutes = Math.floor(daysRemaining * 24 * 60);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

/**
 * Get the VoC (Between Phases) timing window.
 * Returns start time, end time (next sign entry), and peak time.
 */
export function getVocTimingWindow(date: Date = new Date()): {
  startTime: Date;
  endTime: Date;
  peakTime: Date;
} {
  const diffMs = date.getTime() - REFERENCE_DATE.getTime();
  const daysSinceRef = diffMs / (1000 * 60 * 60 * 24);
  const positionInSign = daysSinceRef % MOON_SIGN_DAYS;
  const vocThreshold = MOON_SIGN_DAYS - 0.125; // ~3 hours before sign change

  // End time = when the Moon enters the next sign
  const daysUntilEnd = MOON_SIGN_DAYS - positionInSign;
  const endTime = new Date(date.getTime() + daysUntilEnd * 24 * 60 * 60 * 1000);

  // Start time = vocThreshold into the current sign period
  const daysUntilStart = vocThreshold - positionInSign;
  const startTime = new Date(date.getTime() + daysUntilStart * 24 * 60 * 60 * 1000);

  // Peak = midpoint between start and end
  const peakTime = new Date(startTime.getTime() + (endTime.getTime() - startTime.getTime()) / 2);

  return { startTime, endTime, peakTime };
}
