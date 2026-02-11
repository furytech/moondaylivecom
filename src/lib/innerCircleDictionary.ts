// The Inner Circle Dictionary
// Populates the Lunar Signature cards based on the current moon sign
// Each sign has three pillars: Psychological, Spiritual, Material

export interface SignaturePillar {
  psychological: string;
  spiritual: string;
  material: string;
}

export const INNER_CIRCLE: Record<string, SignaturePillar> = {
  Aries: {
    psychological: "Focus on 'I AM.' Sharpen self-advocacy.",
    spiritual: "Ignite the Divine Spark. Creative fire.",
    material: "Initiate projects. High-intensity movement.",
  },
  Taurus: {
    psychological: "Cultivate 'I HAVE.' Root in worthiness.",
    spiritual: "Practice Embodiment. Find sacred in physical.",
    material: "Financial stewardship. Planting seeds.",
  },
  Gemini: {
    psychological: "Synthesis of thought. Observe duality.",
    spiritual: "The Word as vibration. Intentional breath.",
    material: "Clear communication. Sending emails.",
  },
  Cancer: {
    psychological: "Nurturing the inner child. Emotional safety.",
    spiritual: "The Mother Principle. Cellular healing.",
    material: "Home sanctuary work. Cooking/Family.",
  },
  Leo: {
    psychological: "Radical expression. Heart-centeredness.",
    spiritual: "The Inner Sun. Radiating warmth.",
    material: "Creative performance. Joyful leadership.",
  },
  Virgo: {
    psychological: "Refinement and discernment.",
    spiritual: "Sacred Order. Divine in small details.",
    material: "Systems organization. Health rituals.",
  },
  Libra: {
    psychological: "Diplomacy. Finding the 'we' in the 'me.'",
    spiritual: "Harmonious Equilibrium. Beauty in Others.",
    material: "1-on-1 meetings. Aesthetics/Contracts.",
  },
  Scorpio: {
    psychological: "Emotional alchemy. Transforming fear.",
    spiritual: "The Phoenix Process. Death/Rebirth of shadow.",
    material: "Deep research. Releasing the old.",
  },
  Sagittarius: {
    psychological: "Seeking wisdom over information.",
    spiritual: "The Quest for Truth. Aligning with Divine Law.",
    material: "Travel/Planning. Teaching/Expansion.",
  },
  Capricorn: {
    psychological: "Mastering the critic. Resilience.",
    spiritual: "The Great Work. Building the soul-temple.",
    material: "Career milestones. Legacy building.",
  },
  Aquarius: {
    psychological: "Detaching for clarity. Collective good.",
    spiritual: "The Star frequency. Future-logic.",
    material: "Community networking. Technology.",
  },
  Pisces: {
    psychological: "Releasing boundaries. Oceanic-self.",
    spiritual: "The Mystic Union. Transcending material.",
    material: "Art/Music. Rest/Dreaming. Forgiveness.",
  },
};

// Phase-based content for The Great Cycle
export interface PhaseGuidance {
  psychological: string;
  spiritual: string;
  material: string;
}

export const PHASE_GUIDANCE: Record<string, PhaseGuidance> = {
  "New": {
    psychological: "Set intentions from inner stillness. The seed of thought is planted in darkness.",
    spiritual: "The void births all things. Meditate on what wishes to emerge.",
    material: "Begin new projects. Write plans. Clear space for the new.",
  },
  "Waxing Crescent": {
    psychological: "Courage to move forward despite uncertainty. Trust your initial impulse.",
    spiritual: "The first light of faith. Nurture your intention with belief.",
    material: "Take the first concrete step. Gather resources. Make calls.",
  },
  "First Quarter": {
    psychological: "Confront inner resistance. Decision-making clarity.",
    spiritual: "The test of commitment. Align action with higher purpose.",
    material: "Push through obstacles. Adjust strategies. Build momentum.",
  },
  "Waxing Gibbous": {
    psychological: "Refine your approach. Patience with the process.",
    spiritual: "Fine-tuning your vessel. Devotion to the craft.",
    material: "Edit, polish, perfect. Prepare for the harvest.",
  },
  "Full": {
    psychological: "Illumination of the unconscious. Emotional revelations.",
    spiritual: "The peak of manifestation. Gratitude and release.",
    material: "Culmination of efforts. Celebrate achievements. Be visible.",
  },
  "Waning Gibbous": {
    psychological: "Share wisdom gained. Teach what you've learned.",
    spiritual: "Dissemination of light. Generosity of spirit.",
    material: "Give back. Mentor others. Distribute resources.",
  },
  "Last Quarter": {
    psychological: "Release outdated beliefs. Forgive and let go.",
    spiritual: "Surrender to divine timing. Trust the descent.",
    material: "Clear clutter. End what isn't working. Tie up loose ends.",
  },
  "Waning Crescent": {
    psychological: "Rest and dream. Honor your need for solitude.",
    spiritual: "The sacred pause before rebirth. Deep inner listening.",
    material: "Minimal action. Rest. Prepare for the next cycle.",
  },
};

// VoC content
export interface VocGuidance {
  psychological: string;
  spiritual: string;
  material: string;
}

export const VOC_CONNECTED: VocGuidance = {
  psychological: "Momentum is building. Ride the wave of emotional clarity.",
  spiritual: "Flow state activated. The Moon's signal is strong and clear.",
  material: "Launch, act, and execute. Decisions made now carry weight.",
};

export const VOC_UNPLUGGED: VocGuidance = {
  psychological: "Recalibration in progress. Avoid major emotional decisions.",
  spiritual: "Consolidation of energy. The Moon is between frequencies.",
  material: "Routine tasks only. Avoid signing contracts or launching new ventures.",
};
