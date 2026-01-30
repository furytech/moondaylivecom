// Daily Ritual Content
// Premium content unlocked with Pro subscription

export interface DailyRitual {
  title: string;
  affirmation: string;
  practice: string;
  element: string;
  crystals: string[];
  timing: string;
}

const rituals: Record<string, DailyRitual> = {
  Aries: {
    title: "The Warrior's Dawn",
    affirmation: "I embrace my power and move forward with courage.",
    practice: "Light a red candle at sunrise. Write three bold intentions for the day. Speak them aloud with conviction, then extinguish the flame with gratitude.",
    element: "Fire",
    crystals: ["Carnelian", "Red Jasper", "Bloodstone"],
    timing: "Best performed at dawn or during the first hour of waking",
  },
  Taurus: {
    title: "The Earthen Embrace",
    affirmation: "I am grounded, abundant, and worthy of life's pleasures.",
    practice: "Walk barefoot on natural ground for 5 minutes. Hold a piece of green jade while envisioning your desires manifesting as blooming flowers.",
    element: "Earth",
    crystals: ["Rose Quartz", "Emerald", "Green Jade"],
    timing: "Best performed during the golden hour before sunset",
  },
  Gemini: {
    title: "The Messenger's Breath",
    affirmation: "My words carry power. I communicate with clarity and wit.",
    practice: "Write a letter to your future self. Read it aloud, then fold it and place it under a yellow crystal until the next new moon.",
    element: "Air",
    crystals: ["Citrine", "Blue Lace Agate", "Clear Quartz"],
    timing: "Best performed mid-morning when the mind is sharp",
  },
  Cancer: {
    title: "The Moonlit Sanctuary",
    affirmation: "I honor my emotions. My sensitivity is my strength.",
    practice: "Fill a bowl with water and float a white flower upon it. Gaze at the reflection while taking 12 deep breaths. Pour the water onto a plant you love.",
    element: "Water",
    crystals: ["Moonstone", "Pearl", "Selenite"],
    timing: "Best performed at moonrise or before sleep",
  },
  Leo: {
    title: "The Solar Coronation",
    affirmation: "I shine unapologetically. My light inspires others.",
    practice: "Stand in sunlight for 3 minutes with arms outstretched. Visualize golden light filling your heart. Roar (yes, actually roar) once to release stagnant energy.",
    element: "Fire",
    crystals: ["Sunstone", "Tiger's Eye", "Pyrite"],
    timing: "Best performed at solar noon",
  },
  Virgo: {
    title: "The Sacred Arrangement",
    affirmation: "I create order from chaos. My attention to detail is divine.",
    practice: "Arrange 6 small objects in a pattern that pleases you. As you place each one, name something you're grateful for. Leave the arrangement until tomorrow.",
    element: "Earth",
    crystals: ["Amazonite", "Moss Agate", "Peridot"],
    timing: "Best performed in the quiet evening hours",
  },
  Libra: {
    title: "The Scales of Beauty",
    affirmation: "I attract harmony and love effortlessly.",
    practice: "Light two candles of different colors side by side. Meditate on the balance between giving and receiving. Blow them out simultaneously.",
    element: "Air",
    crystals: ["Opal", "Lapis Lazuli", "Rose Quartz"],
    timing: "Best performed at twilight",
  },
  Scorpio: {
    title: "The Phoenix Rising",
    affirmation: "I release what no longer serves me and rise transformed.",
    practice: "Write down one fear on paper. Burn it safely, letting the smoke carry it away. Bury the ashes in soil as a symbol of regeneration.",
    element: "Water",
    crystals: ["Obsidian", "Malachite", "Labradorite"],
    timing: "Best performed at midnight or during the darkest hour",
  },
  Sagittarius: {
    title: "The Archer's Quest",
    affirmation: "My spirit is free. Every step is an adventure.",
    practice: "Face a different cardinal direction than usual and set a spontaneous intention. Take one action today that breaks your routine.",
    element: "Fire",
    crystals: ["Turquoise", "Amethyst", "Sodalite"],
    timing: "Best performed at the hour of your choosing",
  },
  Capricorn: {
    title: "The Mountain Summit",
    affirmation: "I build my legacy one stone at a time. Success is inevitable.",
    practice: "Stack three stones (or coins) on your desk. Each represents a goal. Touch them each morning as you recite your daily intention.",
    element: "Earth",
    crystals: ["Garnet", "Onyx", "Smoky Quartz"],
    timing: "Best performed at dawn before the world wakes",
  },
  Aquarius: {
    title: "The Starseeker's Vision",
    affirmation: "I am connected to the collective. My uniqueness serves humanity.",
    practice: "Gaze at the stars or a picture of the cosmos for 5 minutes. Journal one idea that could change your world, no matter how wild.",
    element: "Air",
    crystals: ["Aquamarine", "Fluorite", "Angelite"],
    timing: "Best performed under the night sky",
  },
  Pisces: {
    title: "The Dreamer's Portal",
    affirmation: "I trust my intuition. The veil between worlds is thin for me.",
    practice: "Before sleep, place lavender under your pillow. Ask your dreams for guidance. Upon waking, write the first thing you remember.",
    element: "Water",
    crystals: ["Amethyst", "Aquamarine", "Clear Quartz"],
    timing: "Best performed in the liminal moments before sleep",
  },
};

export function getDailyRitual(moonSign: string): DailyRitual {
  return rituals[moonSign] || rituals.Pisces;
}

export function getNextTransitionTime(): Date {
  // Moon changes signs approximately every 2.5 days
  const now = new Date();
  const hoursUntilTransition = Math.floor(Math.random() * 24) + 12; // 12-36 hours
  return new Date(now.getTime() + hoursUntilTransition * 60 * 60 * 1000);
}
