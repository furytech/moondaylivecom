// Deep-dive moon sign content for the Lunar Intel modal
// Rich descriptions covering emotional needs, strengths, shadows, and guidance

export interface MoonSignDeepDive {
  sign: string;
  symbol: string;
  element: string;
  ruling: string;
  archetype: string;
  headline: string;
  overview: string;
  emotionalNeeds: string[];
  strengths: string[];
  shadows: string[];
  selfCareRitual: string;
  affirmation: string;
}

export const moonSignDeepDiveContent: Record<string, MoonSignDeepDive> = {
  Aries: {
    sign: "Aries",
    symbol: "♈",
    element: "Fire",
    ruling: "Mars",
    archetype: "The Warrior",
    headline: "Your soul burns with the fire of new beginnings",
    overview: "With the Moon in Aries, your emotional landscape is fierce, direct, and unapologetically alive. You feel with an intensity that demands expression—anger flashes quickly, joy erupts spontaneously, and boredom is your greatest enemy. Your inner world is a battleground and a playground, where emotions are meant to be conquered, not contained.",
    emotionalNeeds: [
      "Freedom to act on impulse without judgment",
      "Physical outlets for emotional energy",
      "Recognition of your courage and initiative",
      "Space to lead and pioneer new paths",
      "Honest, direct communication from others"
    ],
    strengths: [
      "Emotional resilience and quick recovery",
      "Courageous authenticity in expressing feelings",
      "Natural ability to initiate and inspire",
      "Protective instincts for loved ones",
      "Refreshing emotional honesty"
    ],
    shadows: [
      "Impatience with slower emotional processing",
      "Tendency to act before fully feeling",
      "Difficulty sitting with uncomfortable emotions",
      "Can mistake conflict for connection",
      "May suppress vulnerability as weakness"
    ],
    selfCareRitual: "Move your body when emotions feel stuck. A brisk walk, dance, or workout helps process what words cannot express. Channel fire into action, then rest.",
    affirmation: "I honor my fire by giving it room to burn safely. My passion is my power."
  },
  
  Taurus: {
    sign: "Taurus",
    symbol: "♉",
    element: "Earth",
    ruling: "Venus",
    archetype: "The Sensualist",
    headline: "Your heart finds peace in beauty and belonging",
    overview: "With the Moon in Taurus, you experience emotions through your senses—touch, taste, sound, and the deep comfort of familiar things. Stability isn't boring to you; it's sacred. Your emotional nature seeks to build, preserve, and savor. When the world feels chaotic, you instinctively return to what's real, what's rooted, what endures.",
    emotionalNeeds: [
      "Physical comfort and sensory pleasure",
      "Financial and material security",
      "Time to process feelings at your own pace",
      "Consistent routines and reliable relationships",
      "Connection to nature and natural beauty"
    ],
    strengths: [
      "Unshakeable emotional steadiness",
      "Deep capacity for loyalty and devotion",
      "Ability to create calm, nurturing spaces",
      "Patient presence for others in crisis",
      "Grounded wisdom born from stillness"
    ],
    shadows: [
      "Resistance to necessary change or growth",
      "Possessiveness in relationships",
      "Stubbornness when feeling threatened",
      "Using comfort to avoid difficult feelings",
      "Holding grudges long past their purpose"
    ],
    selfCareRitual: "Engage your senses mindfully. Light a candle, prepare a beautiful meal, wrap yourself in soft textures. Let pleasure be your prayer.",
    affirmation: "I am worthy of the comfort I create. My steadiness is a gift to those I love."
  },
  
  Gemini: {
    sign: "Gemini",
    symbol: "♊",
    element: "Air",
    ruling: "Mercury",
    archetype: "The Storyteller",
    headline: "Your heart speaks in a thousand curious tongues",
    overview: "With the Moon in Gemini, your emotional world is a library of experiences, a conversation that never ends. You process feelings by naming them, discussing them, writing about them—anything that moves emotion from the heart to the mind where you can examine it. Variety is your emotional vitamin; too much sameness leaves your soul starving.",
    emotionalNeeds: [
      "Mental stimulation and variety",
      "Freedom to explore multiple interests",
      "Verbal processing and communication",
      "Social connection and exchange of ideas",
      "Space to change your mind without judgment"
    ],
    strengths: [
      "Emotional adaptability and flexibility",
      "Gift for lightening heavy moments",
      "Ability to see multiple perspectives",
      "Quick wit that protects and connects",
      "Curiosity that keeps relationships fresh"
    ],
    shadows: [
      "Intellectualizing feelings to avoid depth",
      "Nervous energy when forced to sit still",
      "Inconsistency that confuses loved ones",
      "Using words to deflect from vulnerability",
      "Superficial connections that lack roots"
    ],
    selfCareRitual: "Journal without judgment. Let your pen move freely, capturing every contradictory thought. Your complexity is not a flaw—it's a gift.",
    affirmation: "I contain multitudes, and all of my voices deserve to be heard."
  },
  
  Cancer: {
    sign: "Cancer",
    symbol: "♋",
    element: "Water",
    ruling: "Moon",
    archetype: "The Nurturer",
    headline: "Your soul carries the wisdom of the tides",
    overview: "With the Moon in its home sign of Cancer, your emotional nature is exceptionally potent. You feel not only your own emotions but often the unspoken feelings of everyone around you. Home is more than a place—it's a feeling you create, a sanctuary you offer. Your moods ebb and flow like the ocean, governed by cycles you're still learning to understand.",
    emotionalNeeds: [
      "A safe, private space to retreat to",
      "Emotional reciprocity in relationships",
      "Connection to family and chosen family",
      "Permission to feel without fixing",
      "Nurturing others and being nurtured in return"
    ],
    strengths: [
      "Profound emotional intelligence and intuition",
      "Natural ability to create emotional safety",
      "Fierce protectiveness of loved ones",
      "Deep memory and capacity for sentiment",
      "Healing presence for those in pain"
    ],
    shadows: [
      "Moodiness that puzzles even you",
      "Clinging to the past or holding grudges",
      "Over-identification with caretaking role",
      "Indirect communication expecting others to intuit",
      "Building walls when feeling vulnerable"
    ],
    selfCareRitual: "Create a cocoon of comfort when overwhelmed. Warm baths, soft blankets, and the company of your most trusted people. Let yourself be held.",
    affirmation: "My sensitivity is sacred. I am allowed to feel deeply and still be strong."
  },
  
  Leo: {
    sign: "Leo",
    symbol: "♌",
    element: "Fire",
    ruling: "Sun",
    archetype: "The Sovereign",
    headline: "Your heart is a sun that warms everyone in its orbit",
    overview: "With the Moon in Leo, your emotional nature craves recognition, creativity, and the warmth of genuine appreciation. You feel most yourself when you're shining—not from ego, but from the deep need to give your light to others. Your emotions are grand, theatrical, and utterly sincere. There's nothing small about the way you love.",
    emotionalNeeds: [
      "Genuine appreciation and recognition",
      "Creative outlets for self-expression",
      "Loyalty and devotion from inner circle",
      "Space to be playful and childlike",
      "Feeling special and irreplaceable"
    ],
    strengths: [
      "Generous, warm-hearted emotional presence",
      "Natural ability to uplift and inspire",
      "Fierce loyalty to those you love",
      "Courage to express vulnerability grandly",
      "Playful spirit that keeps love alive"
    ],
    shadows: [
      "Need for constant validation",
      "Dramatizing emotions for attention",
      "Pride that blocks asking for help",
      "Taking things too personally",
      "Difficulty sharing the spotlight"
    ],
    selfCareRitual: "Express your creativity without caring if it's 'good enough.' Sing, dance, create. Let your inner child play without the critic watching.",
    affirmation: "I am worthy of love without performing. My light shines simply because I exist."
  },
  
  Virgo: {
    sign: "Virgo",
    symbol: "♍",
    element: "Earth",
    ruling: "Mercury",
    archetype: "The Healer",
    headline: "Your devotion speaks through a thousand small perfections",
    overview: "With the Moon in Virgo, you experience emotions through the lens of improvement and service. You show love by helping, by noticing what needs to be done, by making things better. Your inner critic can be harsh, but it comes from a deep desire to be useful, to be of value, to matter through contribution.",
    emotionalNeeds: [
      "Feeling useful and of service",
      "Order and cleanliness in your environment",
      "Health routines that ground you",
      "Recognition of your efforts and attention to detail",
      "Time alone to decompress and analyze"
    ],
    strengths: [
      "Practical emotional support for others",
      "Ability to solve problems under pressure",
      "Attention to others' unspoken needs",
      "Grounded approach to healing and growth",
      "Humble devotion expressed through action"
    ],
    shadows: [
      "Harsh inner critic that's never satisfied",
      "Anxiety about imperfection",
      "Difficulty receiving help from others",
      "Criticism disguised as helpfulness",
      "Worrying as a way of avoiding feeling"
    ],
    selfCareRitual: "Create order in one small corner of your life. Organize a drawer, tend a plant, complete one task mindfully. Let completion be its own reward.",
    affirmation: "I am enough, exactly as I am. My worth is not measured by my productivity."
  },
  
  Libra: {
    sign: "Libra",
    symbol: "♎",
    element: "Air",
    ruling: "Venus",
    archetype: "The Harmonizer",
    headline: "Your soul seeks the sacred balance in all things",
    overview: "With the Moon in Libra, your emotional wellbeing is intimately connected to the quality of your relationships. Beauty, harmony, and fairness aren't luxuries—they're necessities for your inner peace. You feel most like yourself when surrounded by aesthetic pleasure and meaningful partnership.",
    emotionalNeeds: [
      "Harmonious relationships and environments",
      "Partnership and meaningful connection",
      "Beauty and aesthetic pleasure",
      "Fairness and balanced exchange",
      "Peace and freedom from conflict"
    ],
    strengths: [
      "Natural gift for creating harmony",
      "Graceful handling of emotional situations",
      "Ability to see all sides of a story",
      "Romantic devotion and partnership skills",
      "Aesthetic sensitivity that uplifts spaces"
    ],
    shadows: [
      "Avoiding conflict at the cost of authenticity",
      "Indecision that paralyzes action",
      "People-pleasing that abandons self",
      "Co-dependency in relationships",
      "Passive-aggressive expression of anger"
    ],
    selfCareRitual: "Surround yourself with beauty. Fresh flowers, art, music—let aesthetic pleasure restore your equilibrium. Balance giving with receiving.",
    affirmation: "My needs matter as much as others'. I can be kind and still have boundaries."
  },
  
  Scorpio: {
    sign: "Scorpio",
    symbol: "♏",
    element: "Water",
    ruling: "Pluto",
    archetype: "The Alchemist",
    headline: "Your depths hold the power of transformation itself",
    overview: "With the Moon in Scorpio, you feel everything with laser intensity. There is no surface-level for you—every emotion plunges to the depths, every connection demands truth. You are drawn to what's hidden, what's taboo, what others fear to feel. Your emotional power is transformative, capable of destruction and profound rebirth.",
    emotionalNeeds: [
      "Deep, authentic emotional intimacy",
      "Privacy and control over your inner world",
      "Loyalty that withstands any test",
      "Space to process intense emotions alone",
      "Transformation and psychological depth"
    ],
    strengths: [
      "Unmatched emotional depth and intensity",
      "Ability to transform pain into power",
      "Fierce loyalty and protectiveness",
      "Intuition that perceives hidden truths",
      "Courage to face what others avoid"
    ],
    shadows: [
      "Jealousy and possessiveness",
      "Holding onto resentment as power",
      "Testing others to prove loyalty",
      "All-or-nothing emotional patterns",
      "Using emotional insight to manipulate"
    ],
    selfCareRitual: "Honor your need for privacy. Spend time in solitude processing, journaling, or simply sitting with what you feel. Let emotions move through without needing to control them.",
    affirmation: "I release what no longer serves me. My power lies in my ability to transform."
  },
  
  Sagittarius: {
    sign: "Sagittarius",
    symbol: "♐",
    element: "Fire",
    ruling: "Jupiter",
    archetype: "The Seeker",
    headline: "Your spirit roams free, chasing meaning across horizons",
    overview: "With the Moon in Sagittarius, your emotional nature is expansive, optimistic, and eternally restless. You process feelings through philosophy, adventure, and the search for meaning. Confinement—emotional or physical—feels like death to your spirit. You need to believe in something bigger than yourself.",
    emotionalNeeds: [
      "Freedom and space to explore",
      "Meaning, purpose, and philosophy",
      "Adventure and new experiences",
      "Honesty and directness from others",
      "Optimism and future-focused thinking"
    ],
    strengths: [
      "Infectious optimism and enthusiasm",
      "Ability to find meaning in difficulty",
      "Honest, straightforward emotional expression",
      "Resilience through faith and hope",
      "Gift for inspiring others' growth"
    ],
    shadows: [
      "Running from difficult emotions",
      "Commitment avoidance",
      "Bluntness that wounds others",
      "Restlessness disguised as growth",
      "Preaching rather than listening"
    ],
    selfCareRitual: "Plan something to look forward to—a trip, a class, a book on a new subject. Let anticipation be its own form of nourishment.",
    affirmation: "I can explore and still belong. My freedom and my connections can coexist."
  },
  
  Capricorn: {
    sign: "Capricorn",
    symbol: "♑",
    element: "Earth",
    ruling: "Saturn",
    archetype: "The Elder",
    headline: "Your soul carries ancient wisdom and quiet strength",
    overview: "With the Moon in Capricorn, your emotional nature is reserved, ambitious, and deeply responsible. You were born with an old soul, feeling the weight of duty from an early age. Emotions aren't dismissed—they're managed, structured, and expressed through achievement. You feel safest when you're in control.",
    emotionalNeeds: [
      "Achievement and respect",
      "Structure and long-term security",
      "Privacy for emotional processing",
      "Control over your environment",
      "Recognition of your competence"
    ],
    strengths: [
      "Emotional maturity and self-discipline",
      "Dependability in crisis",
      "Practical wisdom from experience",
      "Patient endurance through difficulty",
      "Quiet strength that anchors others"
    ],
    shadows: [
      "Suppressing emotions as weakness",
      "Workaholism as emotional avoidance",
      "Difficulty being vulnerable",
      "Pessimism and expecting the worst",
      "Isolation when struggling"
    ],
    selfCareRitual: "Allow yourself small pleasures without needing to earn them. Rest is not laziness—it's restoration. You've been responsible long enough.",
    affirmation: "I am allowed to rest. My worth exists beyond what I accomplish."
  },
  
  Aquarius: {
    sign: "Aquarius",
    symbol: "♒",
    element: "Air",
    ruling: "Uranus",
    archetype: "The Visionary",
    headline: "Your heart beats to a rhythm the world is still learning",
    overview: "With the Moon in Aquarius, your emotional nature is unconventional, humanitarian, and slightly detached. You observe your own feelings with curiosity rather than being swept away by them. You care deeply—about humanity, about causes, about the future—but intimate emotional demands can feel suffocating.",
    emotionalNeeds: [
      "Freedom and independence",
      "Intellectual connection and friendship",
      "Space to be unconventional",
      "Contribution to something larger",
      "Acceptance of your uniqueness"
    ],
    strengths: [
      "Objective perspective on emotions",
      "Friendship and community orientation",
      "Progressive, forward-thinking nature",
      "Tolerance for others' differences",
      "Innovative approaches to emotional challenges"
    ],
    shadows: [
      "Emotional detachment as protection",
      "Difficulty with intimate vulnerability",
      "Superiority complex about being different",
      "Rebellion for its own sake",
      "Intellectualizing to avoid feeling"
    ],
    selfCareRitual: "Connect with your community or a cause you believe in. Let collective purpose fulfill your emotional need for meaning.",
    affirmation: "I can be close without losing myself. Intimacy and independence can coexist."
  },
  
  Pisces: {
    sign: "Pisces",
    symbol: "♓",
    element: "Water",
    ruling: "Neptune",
    archetype: "The Mystic",
    headline: "Your soul dissolves the boundaries between self and spirit",
    overview: "With the Moon in Pisces, you feel everything—not just your own emotions, but the collective feelings of everyone around you. The boundary between self and other is thin, making you extraordinarily empathic but also vulnerable to absorption. Your emotional world is vast, imaginative, and deeply connected to something transcendent.",
    emotionalNeeds: [
      "Solitude to distinguish your feelings from others'",
      "Creative and spiritual expression",
      "Gentleness and compassion from others",
      "Permission to dream and imagine",
      "Connection to something transcendent"
    ],
    strengths: [
      "Profound empathy and compassion",
      "Artistic and creative emotional expression",
      "Spiritual depth and intuition",
      "Ability to dissolve others' pain",
      "Healing presence and acceptance"
    ],
    shadows: [
      "Absorbing others' emotions as your own",
      "Escapism through fantasy or substances",
      "Victimhood and martyrdom patterns",
      "Difficulty with boundaries",
      "Confusion about identity and feelings"
    ],
    selfCareRitual: "Immerse yourself in water—a bath, the ocean, even rain. Let the element of your moon cleanse what you've absorbed from others.",
    affirmation: "I can feel deeply and still protect my energy. My sensitivity is a gift, not a burden."
  }
};

export function getMoonSignDeepDive(signName: string): MoonSignDeepDive | null {
  return moonSignDeepDiveContent[signName] || null;
}
