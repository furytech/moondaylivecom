// Unified Lunar Intelligence Engine
// Uses astronomy-engine for precise geocentric tropical Moon sign timing.
import { Moon } from "lunarphase-js";
import { AstroTime, EclipticGeoMoon } from "astronomy-engine";
import { getCurrentMoon } from "@/lib/currentMoon";

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

function norm360(value: number): number {
  return ((value % 360) + 360) % 360;
}

function getMoonSignIndex(date: Date = new Date()): number {
  const longitude = norm360(EclipticGeoMoon(new AstroTime(date)).lon);
  return Math.floor(longitude / 30) % 12;
}

function getCurrentMoonSign(date: Date = new Date()) {
  return ZODIAC_SIGNS[getMoonSignIndex(date)];
}

function getNextSignIngress(date: Date = new Date()): Date {
  const startIndex = getMoonSignIndex(date);
  let low = date.getTime();
  let high = low + 60 * 60 * 1000;

  for (let i = 0; i < 96 && getMoonSignIndex(new Date(high)) === startIndex; i += 1) {
    low = high;
    high += 60 * 60 * 1000;
  }

  for (let i = 0; i < 24; i += 1) {
    const mid = Math.floor((low + high) / 2);
    if (getMoonSignIndex(new Date(mid)) === startIndex) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return new Date(high);
}

/**
 * Approximate Void-of-Course status.
 * The Moon is VoC during the last ~2-4 hours before entering a new sign.
 * We approximate this by checking how far into the current sign period we are.
 */
function isVoidOfCourse(date: Date = new Date()): boolean {
  const endTime = getNextSignIngress(date);
  const vocStart = endTime.getTime() - 3 * 60 * 60 * 1000;
  return date.getTime() >= vocStart;
}

export function getLunarIntelligence(date: Date = new Date()): LunarIntelligence {
  const currentMoon = getCurrentMoon(date);
  const agePercent = Moon.lunarAgePercent(date);
  const isWaxing = Moon.isWaxing(date);
  const age = Moon.lunarAge(date);
  const sign = getCurrentMoonSign(date);
  const voc = isVoidOfCourse(date);

  return {
    phase: {
      name: currentMoon.phase,
      emoji: currentMoon.phaseEmoji,
      illumination: currentMoon.illumination,
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
  const endTime = getNextSignIngress(date);
  const totalMinutes = Math.max(0, Math.floor((endTime.getTime() - date.getTime()) / (60 * 1000)));
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
  const endTime = getNextSignIngress(date);
  const startTime = new Date(endTime.getTime() - 3 * 60 * 60 * 1000);

  // Peak = midpoint between start and end
  const peakTime = new Date(startTime.getTime() + (endTime.getTime() - startTime.getTime()) / 2);

  return { startTime, endTime, peakTime };
}
