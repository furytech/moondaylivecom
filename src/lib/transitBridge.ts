// src/lib/transitBridge.ts
// Modality-calibrated element-to-element bridge sentence lookup for Triad Activation context.
//
// Maps 12 natal Sun "modes" (4 elements × 3 modalities) × 4 transiting Moon elements = 48 variations.
// Modality reflects HOW the natal nature operates:
//   Cardinal = initiating, action-oriented, beginning-focused
//   Fixed    = sustaining, consolidating, resistant to change
//   Mutable  = adapting, transitioning, flexible
//
// Voice: second-person, reflective, non-predictive. One to two sentences per entry.
// Usage: import { getTransitBridgeForSigns } from './transitBridge';

export type Element  = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';
type BridgeKey       = `${Element}-${Modality}-${Element}`;

// ─── Sign → Element ───────────────────────────────────────────────────────────
const SIGN_ELEMENT: Record<string, Element> = {
  aries: 'fire',   leo: 'fire',   sagittarius: 'fire',
  taurus: 'earth', virgo: 'earth', capricorn: 'earth',
  gemini: 'air',   libra: 'air',  aquarius: 'air',
  cancer: 'water', scorpio: 'water', pisces: 'water',
};

// ─── Sign → Modality ──────────────────────────────────────────────────────────
const SIGN_MODALITY: Record<string, Modality> = {
  aries: 'cardinal', cancer: 'cardinal', libra: 'cardinal', capricorn: 'cardinal',
  taurus: 'fixed',   leo: 'fixed',       scorpio: 'fixed',  aquarius: 'fixed',
  gemini: 'mutable', virgo: 'mutable',   sagittarius: 'mutable', pisces: 'mutable',
};

// ─── 48 Bridge Sentences ──────────────────────────────────────────────────────
// Key format: natalElement-natalModality-transitElement
const BRIDGE_SENTENCES: Record<BridgeKey, string> = {

  // ── FIRE CARDINAL (Aries) ──────────────────────────────────────────────────
  'fire-cardinal-fire':
      'A Fire Moon meets your initiating drive — the energy to begin is doubled today. Choose one direction before momentum scatters into too many starts.',
  'fire-cardinal-earth':
      'An Earth Moon applies friction to your initiating fire — not to stop you but to ask whether this particular beginning is worth its weight. The pause has value.',
  'fire-cardinal-air':
      'An Air Moon feeds your impulse to begin with ideas and connections. The window between inspiration and action is narrow today — use it.',
  'fire-cardinal-water':
      'A Water Moon asks your forward-moving nature to pause at the threshold. Something interior needs attention before the next beginning.',

  // ── FIRE FIXED (Leo) ──────────────────────────────────────────────────────
  'fire-fixed-fire':
      'A Fire Moon amplifies what you have already committed to — creative energy deepens rather than redirects today. What you are building intensifies.',
  'fire-fixed-earth':
      'An Earth Moon invites your sustained creative fire to take practical form. The will is there; today asks it to build something you can hold.',
  'fire-fixed-air':
      'An Air Moon circulates your fixed fire outward — ideas want to be shared, expressed, communicated. Your creative vision finds new audiences today.',
  'fire-fixed-water':
      'A Water Moon asks your strong creative will to soften its edges. Something beneath the performance layer wants acknowledgment.',

  // ── FIRE MUTABLE (Sagittarius) ────────────────────────────────────────────
  'fire-mutable-fire':
      'A Fire Moon expands your already expansive nature — enthusiasm runs high and vision is wide. The invitation is to go deep somewhere today, not just far.',
  'fire-mutable-earth':
      'An Earth Moon asks your fire to land somewhere specific. The ideas are plentiful; today invites you to choose one and let it take root.',
  'fire-mutable-air':
      'An Air Moon accelerates your natural love of ideas and synthesis. A favorable day for philosophy, teaching, and the exploration of meaning.',
  'fire-mutable-water':
      'A Water Moon slows your outward seeking and turns it inward. The truth you have been searching for may be closer than the horizon.',

  // ── EARTH CARDINAL (Capricorn) ────────────────────────────────────────────
  'earth-cardinal-fire':
      'A Fire Moon stirs urgency beneath your methodical ambition — a useful jolt if you have been too patient, a disruption if the structure still needs time.',
  'earth-cardinal-earth':
      'A second Earth current supports your drive to build with discipline. Long-term work moves steadily today; this is a day to lay foundations.',
  'earth-cardinal-air':
      'An Air Moon introduces new perspectives into your structural thinking. Consider the plan from a different angle before executing it.',
  'earth-cardinal-water':
      'A Water Moon surfaces the human dimension of what you are building. The goal matters; so do the people it is meant to serve.',

  // ── EARTH FIXED (Taurus) ──────────────────────────────────────────────────
  'earth-fixed-fire':
      'A Fire Moon disturbs your natural stillness with urgency that does not quite fit. Notice what it is trying to move in you before deciding whether to follow it.',
  'earth-fixed-earth':
      'Double earth doubles your capacity for patience and presence. A grounded, unhurried day — let the work deepen rather than expand.',
  'earth-fixed-air':
      'An Air Moon lifts your attention toward the abstract just as your nature prefers the concrete. Hold both — the idea and the material it wants to become.',
  'earth-fixed-water':
      'A Water Moon softens your earthly steadiness, letting feeling rise through what has been stable. Something held quietly beneath the surface may want expression.',

  // ── EARTH MUTABLE (Virgo) ─────────────────────────────────────────────────
  'earth-mutable-fire':
      'A Fire Moon adds urgency to your refining nature — helpful when you have been perfecting something past its time, challenging if the analysis is not yet complete.',
  'earth-mutable-earth':
      'An Earth Moon steadies your adaptive analysis. A favorable day for careful work that requires sustained attention and methodical follow-through.',
  'earth-mutable-air':
      'An Air Moon energizes your already active mind — synthesis and pattern recognition flow easily. Guard against over-analysis when discernment is enough.',
  'earth-mutable-water':
      'A Water Moon moves your attention from the analytical to the intuitive. Today, what you sense may arrive before what you can prove.',

  // ── AIR CARDINAL (Libra) ──────────────────────────────────────────────────
  'air-cardinal-fire':
      'A Fire Moon adds urgency to your diplomatic instincts — the balance you seek may need to be declared rather than negotiated today.',
  'air-cardinal-earth':
      'An Earth Moon grounds your relational thinking in the practical. An agreement is more durable when it is tied to something real.',
  'air-cardinal-air':
      'A second Air current amplifies your natural gift for connection and mediation. Ideas circulate freely — a favorable day for conversation and collaboration.',
  'air-cardinal-water':
      'A Water Moon deepens your sense of what the relationship actually needs, beneath what is being said. Listen at that level today.',

  // ── AIR FIXED (Aquarius) ──────────────────────────────────────────────────
  'air-fixed-fire':
      'A Fire Moon injects urgency into your principled thinking — the vision wants to move now, not eventually. Decide which principle is worth acting on today.',
  'air-fixed-earth':
      'An Earth Moon asks your abstract systems-thinking to find one concrete point of contact. The idea is valid; today asks what it touches in the physical world.',
  'air-fixed-air':
      'A second Air current amplifies your already strong mental focus. Innovation and unconventional thinking flow freely — give the ideas room to breathe.',
  'air-fixed-water':
      'A Water Moon softens your principled detachment, inviting feeling into the framework. The system may need a human variable it has not yet accounted for.',

  // ── AIR MUTABLE (Gemini) ──────────────────────────────────────────────────
  'air-mutable-fire':
      'A Fire Moon ignites your natural curiosity with urgency and heat. The ideas want to become actions today — follow one thread all the way through.',
  'air-mutable-earth':
      'An Earth Moon offers grounding friction to your multidirectional mind. One idea, followed to its conclusion, is worth more than ten left open.',
  'air-mutable-air':
      'A second Air current amplifies your range considerably. Connection, writing, and synthesis all flow — the invitation is to know when you have said enough.',
  'air-mutable-water':
      'A Water Moon asks your restless mind to slow to the pace of feeling. What wants to be understood today may not arrive through thinking.',

  // ── WATER CARDINAL (Cancer) ───────────────────────────────────────────────
  'water-cardinal-fire':
      'A Fire Moon moves against your instinct to protect and contain — it wants to act where you want to tend. Notice which one the moment actually calls for.',
  'water-cardinal-earth':
      'An Earth Moon gives your emotional attunement a stable floor. What you feel today can be channeled into something concrete and lasting.',
  'water-cardinal-air':
      'An Air Moon lifts your emotional knowing toward articulation. What has been felt privately may find a way to be said.',
  'water-cardinal-water':
      'Deep emotional current today. Your sensitivity and protectiveness are both amplified — a day for tending, not exposing.',

  // ── WATER FIXED (Scorpio) ─────────────────────────────────────────────────
  'water-fixed-fire':
      'A Fire Moon cuts through your depth with urgency and heat. Useful when you have been submerged too long; disruptive when the transformation still needs time.',
  'water-fixed-earth':
      'An Earth Moon offers structure for your intensity — emotions can be metabolized into something useful and lasting rather than held in suspension.',
  'water-fixed-air':
      'An Air Moon pulls your deep knowing toward the surface where it can be named. The insight that has been forming in the depths may be ready to speak.',
  'water-fixed-water':
      'Two water currents, both deep. Your transformative capacity is fully activated today — a day for the work that cannot be rushed or performed.',

  // ── WATER MUTABLE (Pisces) ────────────────────────────────────────────────
  'water-mutable-fire':
      'A Fire Moon introduces direction into your receptive and fluid nature. The invitation is not to harden — it is to notice what your feeling is pointing toward.',
  'water-mutable-earth':
      'An Earth Moon offers your permeable nature a temporary container. Use it: bring one creative or spiritual intention into a concrete form today.',
  'water-mutable-air':
      'An Air Moon helps your intuitive knowing find language. Something that has lived purely as sensation or impression may now be expressible.',
  'water-mutable-water':
      'The waters run deep and wide today. Your sensitivity is at its peak — a powerful day for art, healing work, or inner stillness, and a vulnerable one for overstimulation.',
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the classical element for a zodiac sign name, or null if unrecognized.
 */
export function getSignElement(sign: string): Element | null {
  return SIGN_ELEMENT[sign.trim().toLowerCase()] ?? null;
}

/**
 * Returns the modality for a zodiac sign name, or null if unrecognized.
 */
export function getSignModality(sign: string): Modality | null {
  return SIGN_MODALITY[sign.trim().toLowerCase()] ?? null;
}

/**
 * Returns the modality-calibrated bridge sentence given pre-resolved values.
 * Inputs are trimmed and lowercased defensively, so padded or mixed-case
 * strings are handled gracefully.
 * Returns an empty string if the combination is unrecognized.
 *
 * @param natalElement       - Classical element of the natal Sun sign
 * @param natalModality      - Modality of the natal Sun sign
 * @param transitingMoonSign - e.g. 'Scorpio', 'Gemini'
 */
export function getTransitBridge(
    natalElement: Element | string,
    natalModality: Modality | string,
    transitingMoonSign: string,
): string {
  const el            = (natalElement  as string).trim().toLowerCase() as Element;
  const mod           = (natalModality as string).trim().toLowerCase() as Modality;
  const transitElement = SIGN_ELEMENT[transitingMoonSign.trim().toLowerCase()];
  if (!transitElement) return '';
  return BRIDGE_SENTENCES[`${el}-${mod}-${transitElement}`] ?? '';
}

/**
 * Convenience wrapper — resolves natal element and modality from the natal Sun
 * sign name, then returns the calibrated bridge sentence.
 * Returns an empty string if either sign is unrecognized.
 *
 * @param natalSunSign       - e.g. 'Cancer', 'Aries'
 * @param transitingMoonSign - e.g. 'Scorpio', 'Gemini'
 */
export function getTransitBridgeForSigns(
    natalSunSign: string,
    transitingMoonSign: string,
): string {
  const element  = SIGN_ELEMENT[natalSunSign.trim().toLowerCase()];
  const modality = SIGN_MODALITY[natalSunSign.trim().toLowerCase()];
  if (!element || !modality) return '';
  const transitElement = SIGN_ELEMENT[transitingMoonSign.trim().toLowerCase()];
  if (!transitElement) return '';
  return BRIDGE_SENTENCES[`${element}-${modality}-${transitElement}`] ?? '';
}
