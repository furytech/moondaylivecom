import type { ZodiacSign, TriadMoon } from "@/lib/sovereignEngine";
import { getNextMoonSign } from "@/lib/currentMoon";

export interface LensDefinition {
  title: string;
  whatIsIt: string;
  howMeasured: string;
  howToUse: string;
}

export const LENS_DEFINITIONS: Record<"social" | "internal" | "soul", LensDefinition> = {
  social: {
    title: "Tropical Lens",
    whatIsIt:
      "The Tropical chart is the system most Western horoscopes use. It maps the sky relative to Earth's seasons, anchored to the moment of the spring equinox. It represents your persona and the public, social texture of the day — the shared atmospheric weather you and the world are walking through together, revealing the surface tone and flavor of the room.",
    howMeasured:
      "The zodiac is divided into twelve equal 30° slices, starting at 0° Aries — the precise point where the Sun crosses the celestial equator each spring. Where the Moon falls in this seasonal grid is its Tropical position.",
    howToUse:
      "Notice how conversations, moods, and social interactions are colored by this sign today. It is the surface tone of the room — not who you are underneath, but the atmospheric climate everyone is breathing.",
  },
  internal: {
    title: "Sidereal Lens",
    whatIsIt:
      "The Sidereal chart is the foundation of Vedic (Indian) astrology. Instead of seasonal coordinates, it locks the zodiac to the actual fixed constellations, adjusted by the astronomical Ayanamsha. It represents your primal operating system and internal nervous system wiring — how your somatic body and deeper instincts truly respond to the cosmic environment beneath the day's weather.",
    howMeasured:
      "We start from the true position of the constellations and divide the sky into 27 lunar mansions called Nakshatras, each ruled by a planetary ruler and carrying a specific power (Shakti). Where the Moon sits in this stellar grid reveals the wiring that is actually running underneath you.",
    howToUse:
      "Ask: am I acting from my root power today, or am I forcing a pace that does not match my wiring? The Nakshatra ruler tells you the kind of action that will feel native — and the kind that will cost you vital energy.",
  },
  soul: {
    title: "Draconic Lens",
    whatIsIt:
      "The Draconic chart is the most esoteric coordinate system. It rebuilds the entire zodiac with 0° Aries placed not at the seasonal equinox or the stars, but at the Moon's North Node — the karmic axis of evolutionary growth. It represents your spiritual compass and hidden soul blueprint — the quiet, underlying current your deeper consciousness is moving toward beneath everyday choices.",
    howMeasured:
      "We take today's Moon position and subtract the position of the True North Node. What remains is the Moon read in 'soul coordinates' — a chart that ignores both season and constellation and shows only directional spiritual pull.",
    howToUse:
      "Listen for the deep, quiet pull beneath the noise. When a choice feels disproportionately important for no logical reason, that is usually the Draconic Moon speaking. Follow it gently; do not argue with it.",
  },
};

export interface SignTransitGuidance {
  navigation: string;
  challenge: string;
  epiphany: string;
}

export const SIGN_TRANSIT_GUIDANCE: Record<ZodiacSign, SignTransitGuidance> = {
  Aries: {
    navigation:
      "Adopt an active, decisive posture. Break inertia by beginning tasks immediately with bold instinct, while keeping initial commitments flexible until the heat settles.",
    challenge:
      "Impulsive friction or irritability triggered by perceived delays and slow deliberations.",
    epiphany:
      "True courage is not reckless speed; it is decisive clarity that dissolves lingering fear.",
  },
  Taurus: {
    navigation:
      "Move with unhurried somatic deliberate pacing. Anchor your attention in physical reality, sensory comfort, and practical steps that compound value steadily.",
    challenge:
      "Stubborn resistance to necessary adaptation, mistaking rigidity for emotional safety.",
    epiphany:
      "Real security is cultivated from internal self-worth and somatic peace, not external control.",
  },
  Gemini: {
    navigation:
      "Engage an open, communicative curiosity. Allow ideas to cross-pollinate, converse widely, and process feelings by giving them language and perspective.",
    challenge:
      "Mental fragmentation and scattered attention from analyzing feelings rather than experiencing them.",
    epiphany:
      "Naming an emotional state objectively diffuses its charge and illuminates a path forward.",
  },
  Cancer: {
    navigation:
      "Prioritize psychological sanctuary and emotional replenishment. Soften defense mechanisms within trusted spaces, and honor the natural ebb and flow of intuitive tides.",
    challenge:
      "Defensive retreat into a protective shell or taking external moods personally.",
    epiphany:
      "Vulnerability inside a safe sanctuary is a superpower of emotional discernment, not weakness.",
  },
  Leo: {
    navigation:
      "Operate with generous warmth, creative self-expression, and unapologetic vitality. Share your light from the heart without demanding external validation.",
    challenge:
      "Fragile pride reacting sharply to perceived lack of appreciation or social recognition.",
    epiphany:
      "Radiance that originates from genuine joy inspires others without needing outside approval.",
  },
  Virgo: {
    navigation:
      "Channel energy into mindful discernment, somatic care, and refined practical systems. Focus on small adjustments that restore harmony to your environment.",
    challenge:
      "Perfectionist anxiety, somatic tension, and hyper-critical evaluation of yourself or others.",
    epiphany:
      "Devotion to order is an act of love, and acceptance of imperfection is the highest form of mastery.",
  },
  Libra: {
    navigation:
      "Cultivate relational equilibrium, aesthetic balance, and fair compromise. Seek mutual resonance while honoring your own core boundaries.",
    challenge:
      "Paralyzing indecision born of attempting to please everyone and avoid constructive friction.",
    epiphany:
      "Authentic harmony requires honest boundaries; true peace is not the absence of conflict.",
  },
  Scorpio: {
    navigation:
      "Embrace deep emotional honesty and transformational focus. Look beneath surface facades, acknowledge shadow feelings, and release outworn attachments.",
    challenge:
      "Suspicion, compulsive control, and defensive secrecy that block genuine connection.",
    epiphany:
      "Surrendering the need to control allows profound emotional alchemy and rebirth to occur.",
  },
  Sagittarius: {
    navigation:
      "Adopt an expansive, philosophical perspective. Reconnect with hope, wanderlust, and big-picture purpose while staying grounded in your actual capacity.",
    challenge:
      "Overextending commitments, preaching opinions, or bypassing immediate emotional reality.",
    epiphany:
      "Freedom is found in deep truth and philosophical alignment, not escaping the present moment.",
  },
  Capricorn: {
    navigation:
      "Ground your intentions in pragmatic composure, disciplined boundaries, and long-term architectural focus. Honor duty while making space for quiet restorative rest.",
    challenge:
      "Emotional containment veering into stoic isolation, self-criticism, or chronic exhaustion.",
    epiphany:
      "Enduring achievement is built on steady somatic sustainability, not relentless sacrifice.",
  },
  Aquarius: {
    navigation:
      "Observe with objective intellectual clarity and visionary authenticity. Connect with collective causes and kindred minds while celebrating your unique eccentricity.",
    challenge:
      "Emotional aloofness and intellectual detachment that disconnect you from immediate somatic empathy.",
    epiphany:
      "Objective insight combined with heartfelt human connection generates authentic liberation.",
  },
  Pisces: {
    navigation:
      "Surrender to intuitive fluidity, creative imagination, and compassionate dissolution. Integrate spiritual practices, music, and dreamwork into your day.",
    challenge:
      "Spiritual escapism, foggy boundaries, and absorbing foreign emotional turbulence.",
    epiphany:
      "Boundaries are not walls; they are the shores that allow oceanic empathy to flourish safely.",
  },
};

const ZODIAC_LIST = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

function getZodiacIndex(sign: string): number {
  const clean = sign.trim().toLowerCase();
  const idx = ZODIAC_LIST.findIndex((s) => s.toLowerCase() === clean);
  return idx !== -1 ? idx : 0;
}

export function calculateTriadProfileNumber(
  natalSun?: string | null,
  natalMoon?: string | null,
  currentTransit?: string | null
): number {
  const sun = natalSun || "Aries";
  const moon = natalMoon || "Aries";
  const transit = currentTransit || "Aries";

  const sunIdx = getZodiacIndex(sun);
  const moonIdx = getZodiacIndex(moon);
  const transitIdx = getZodiacIndex(transit);

  return sunIdx * 144 + moonIdx * 12 + transitIdx + 1;
}

export function getNextTransitShift(currentSign: ZodiacSign, lensName: string): {
  nextSign: string;
  timeRemainingText: string;
  shiftDescription: string;
} {
  const next = getNextMoonSign(new Date());
  const hours = next.hoursAway;
  const timeRemainingText =
    hours < 1
      ? "less than an hour"
      : hours < 24
      ? `${Math.round(hours)} hours`
      : `${(hours / 24).toFixed(1)} days`;

  const shiftDescription = `As the Moon moves into ${next.sign}, the ${lensName} registers a transition from ${currentSign}'s tone into ${next.sign}'s ${next.element.toLowerCase()} frequency.`;

  return {
    nextSign: next.sign,
    timeRemainingText,
    shiftDescription,
  };
}
