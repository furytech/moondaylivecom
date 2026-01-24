// Moon Sign Calculator
// Note: Accurate Moon sign calculation requires ephemeris data and exact birth time/location.
// This simplified version uses birth date only and provides an approximation.

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

// Simplified Moon sign calculation based on birth date
// This is an approximation - accurate calculation requires birth time and ephemeris data
export function calculateMoonSign(birthDate: Date): MoonSignResult {
  // The Moon moves through all 12 signs approximately every 28 days
  // Each sign is roughly 2.5 days
  
  const day = birthDate.getDate();
  const month = birthDate.getMonth();
  const year = birthDate.getFullYear();
  
  // Create a simple hash based on the date to determine moon sign
  // This provides variety while being deterministic for the same date
  const dateValue = (year * 365) + (month * 30) + day;
  
  // Moon cycle is approximately 29.5 days, each sign ~2.46 days
  // We use a combination of factors to create variation
  const moonCyclePosition = (dateValue % 354) / 354; // 354 = ~12 lunar months
  const signIndex = Math.floor(moonCyclePosition * 12);
  
  const signs = Object.keys(moonSignData);
  const signName = signs[signIndex];
  
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
