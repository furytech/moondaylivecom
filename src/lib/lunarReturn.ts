/**
 * Lunar Return Tracker
 * -----------------------------------------------------------
 * Calculates the next N times the transiting Moon re-enters
 * the user's natal moon sign. Each return is a ~48hr emotional
 * "reset window" — the Moon returns to your natal sign roughly
 * every 27.3 days.
 *
 * No birth time required: we operate on sign-only ingress.
 */

import { computeTriadMoon, type ZodiacSign } from "./sovereignEngine";

export interface LunarReturn {
  /** Moment the Moon enters the natal sign (UTC). */
  ingress: Date;
  /** Moment the Moon exits the natal sign (~2.25 days later). */
  egress: Date;
  /** Display reading for this return window. */
  reading: string;
  /** Journaling prompt for the window. */
  prompt: string;
}

const RETURN_READINGS: Record<ZodiacSign, string> = {
  Aries: "Your fire returns. A reset window for courage, fresh starts, and unfiltered honesty.",
  Taurus: "Your ground returns. A reset window for sensory pleasure, slowness, and reclaiming worth.",
  Gemini: "Your curiosity returns. A reset window for conversation, ideas, and following sparks.",
  Cancer: "Your tenderness returns. A reset window for home, memory, and tending what is soft.",
  Leo: "Your radiance returns. A reset window for joy, play, and being seen on your terms.",
  Virgo: "Your discernment returns. A reset window for refinement, ritual, and quiet service.",
  Libra: "Your harmony returns. A reset window for beauty, mirrors, and recalibrating relationships.",
  Scorpio: "Your depth returns. A reset window for truth-telling, intimacy, and honest shadow work.",
  Sagittarius: "Your horizon returns. A reset window for vision, freedom, and meaning-making.",
  Capricorn: "Your spine returns. A reset window for structure, mastery, and long-range intent.",
  Aquarius: "Your signal returns. A reset window for vision, community, and original thought.",
  Pisces: "Your dream returns. A reset window for rest, art, and dissolving what no longer fits.",
};

const RETURN_PROMPTS: Record<ZodiacSign, string> = {
  Aries: "What am I ready to begin — without asking permission?",
  Taurus: "Where in my life does my body feel at home, and where does it brace?",
  Gemini: "Which conversation have I been avoiding, and what would I say if I weren't?",
  Cancer: "What does emotional safety actually look like for me, in specifics?",
  Leo: "Where am I dimming my light to keep others comfortable?",
  Virgo: "Which small daily practice would compound into the biggest internal shift?",
  Libra: "Which relationship needs honesty more than harmony right now?",
  Scorpio: "What truth am I keeping from myself, and what would change if I said it aloud?",
  Sagittarius: "What belief is overdue for re-examination, and what evidence am I avoiding?",
  Capricorn: "Is my visible action a true vector of my long-range intent?",
  Aquarius: "Which crowd am I performing for, and which signal am I actually meant to send?",
  Pisces: "What am I being asked to release, and what becomes possible once I do?",
};

/** Find the next N times the Moon enters `natalSign` after `from`. */
export function computeLunarReturns(
  natalSign: ZodiacSign,
  count = 3,
  from: Date = new Date(),
): LunarReturn[] {
  const results: LunarReturn[] = [];
  const reading = RETURN_READINGS[natalSign];
  const prompt = RETURN_PROMPTS[natalSign];

  // Coarse daily scan up to ~120 days, then refine hourly.
  let cursor = new Date(from);
  let prevSign = computeTriadMoon(cursor).tropical.sign;

  const maxDays = 120;
  for (let d = 1; d <= maxDays && results.length < count; d++) {
    const probe = new Date(from.getTime() + d * 86400000);
    const sign = computeTriadMoon(probe).tropical.sign;

    if (sign === natalSign && prevSign !== natalSign) {
      // Refine ingress hour within the day before `probe`.
      let lo = new Date(probe.getTime() - 86400000);
      let hi = probe;
      for (let h = 0; h < 24; h++) {
        const mid = new Date((lo.getTime() + hi.getTime()) / 2);
        if (computeTriadMoon(mid).tropical.sign === natalSign) hi = mid;
        else lo = mid;
      }
      const ingress = hi;

      // Refine egress: Moon stays in a sign ~2.25 days.
      let elo = new Date(ingress.getTime() + 2 * 86400000);
      let ehi = new Date(ingress.getTime() + 3 * 86400000);
      // Ensure ehi is after egress
      while (computeTriadMoon(ehi).tropical.sign === natalSign) {
        ehi = new Date(ehi.getTime() + 86400000);
      }
      for (let h = 0; h < 24; h++) {
        const mid = new Date((elo.getTime() + ehi.getTime()) / 2);
        if (computeTriadMoon(mid).tropical.sign === natalSign) elo = mid;
        else ehi = mid;
      }
      const egress = elo;

      results.push({ ingress, egress, reading, prompt });
    }
    prevSign = sign;
  }

  return results;
}
