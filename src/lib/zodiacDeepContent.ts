// Extended zodiac content for the Art Deco Library experience
// Contains The Essence, The Shadow, The Sacred Ritual, and The Elemental Affinity

export interface ZodiacDeepContent {
  sign: string;
  symbol: string;
  element: string;
  ruling: string;
  
  // The Essence - Poetic soul blueprint
  essence: {
    title: string;
    poetry: string;
    coreWounds: string[];
    soulGifts: string[];
  };
  
  // The Shadow - Raw, unfiltered depths
  shadow: {
    title: string;
    rawTruth: string;
    triggers: string[];
    hiddenFears: string[];
    destructivePatterns: string[];
  };
  
  // The Sacred Ritual - Physical grounding practice
  ritual: {
    title: string;
    element: string;
    practice: string;
    timing: string;
    tools: string[];
    steps: string[];
  };
  
  // The Elemental Affinity - Stones, botanicals, colors
  affinity: {
    stones: { name: string; purpose: string }[];
    botanicals: { name: string; use: string }[];
    colors: { name: string; hex: string; meaning: string }[];
    sacredNumber: number;
    moonPhase: string;
  };
}

export const zodiacDeepContent: Record<string, ZodiacDeepContent> = {
  Aries: {
    sign: "Aries",
    symbol: "♈",
    element: "Fire",
    ruling: "Mars",
    essence: {
      title: "The Primal Spark",
      poetry: "You are the first breath of the universe—raw, unfiltered existence demanding to be witnessed. Your soul carries the sacred responsibility of beginning what others cannot conceive. In you burns the original fire that preceded all creation.",
      coreWounds: [
        "Fear that your existence requires justification",
        "Belief that rest equals worthlessness",
        "Childhood messages that your intensity was 'too much'"
      ],
      soulGifts: [
        "The courage to exist unapologetically",
        "Initiating energy that births new realities",
        "The warrior's heart that protects the vulnerable"
      ]
    },
    shadow: {
      title: "The Wound of Invisibility",
      rawTruth: "Your aggression often masks a terrified child who learned that softness meant annihilation. You attack before you can be abandoned. You move constantly because stillness forces you to feel the ache of your own loneliness.",
      triggers: [
        "Being ignored or dismissed",
        "Having your competence questioned",
        "Feeling controlled or trapped"
      ],
      hiddenFears: [
        "That you are fundamentally unlovable without your achievements",
        "That your fire will consume those you love",
        "That slowing down will reveal you have nothing inside"
      ],
      destructivePatterns: [
        "Burning bridges before intimacy can form",
        "Using anger as armor against vulnerability",
        "Mistaking conflict for passion in relationships"
      ]
    },
    ritual: {
      title: "The Warrior's Release",
      element: "Fire",
      practice: "Movement-based energy transmutation to channel Mars energy constructively",
      timing: "Tuesday mornings at sunrise, or when anger feels uncontainable",
      tools: ["Red candle", "Obsidian stone", "Physical space to move"],
      steps: [
        "Light the red candle and state aloud what angers you",
        "Move your body intensely for 7 minutes—dance, box, run in place",
        "When exhausted, lie flat on the ground and feel the earth hold you",
        "Speak aloud: 'I am allowed to rest. My fire does not require fuel.'",
        "Hold the obsidian to absorb residual intensity"
      ]
    },
    affinity: {
      stones: [
        { name: "Red Jasper", purpose: "Grounds impulsive energy into sustained power" },
        { name: "Carnelian", purpose: "Transmutes anger into creative force" },
        { name: "Bloodstone", purpose: "Protection during spiritual battles" }
      ],
      botanicals: [
        { name: "Ginger", use: "Tea for warming and activating stagnant energy" },
        { name: "Nettle", use: "Iron-rich support for the blood and Mars connection" },
        { name: "Cayenne", use: "Topical application for circulation and motivation" }
      ],
      colors: [
        { name: "Cardinal Red", hex: "#C41E3A", meaning: "Raw life force and courage" },
        { name: "Burnt Orange", hex: "#CC5500", meaning: "Sustained creative fire" },
        { name: "Charcoal", hex: "#36454F", meaning: "Grounding the flame" }
      ],
      sacredNumber: 9,
      moonPhase: "New Moon (new beginnings)"
    }
  },

  Taurus: {
    sign: "Taurus",
    symbol: "♉",
    element: "Earth",
    ruling: "Venus",
    essence: {
      title: "The Sacred Vessel",
      poetry: "You are the earth's memory of pleasure—the knowing that existence itself is enough. Your soul carries the ancient contract between spirit and matter, proving that the body is not a prison but a temple. In you lives the patience of mountains.",
      coreWounds: [
        "Deep scarcity fear despite outward abundance",
        "Belief that your worth is tied to what you provide",
        "Childhood experiences of instability or loss"
      ],
      soulGifts: [
        "The ability to make others feel utterly safe",
        "Transmuting abstract love into tangible care",
        "Holding space for beauty in a chaotic world"
      ]
    },
    shadow: {
      title: "The Grip of Possession",
      rawTruth: "Your stubbornness is loyalty calcified into control. You hoard—objects, people, routines—because change reminds you of every time the rug was pulled from beneath you. Your comfort-seeking can become a prison that you mistake for a sanctuary.",
      triggers: [
        "Unexpected changes to plans or environment",
        "Feeling financially or emotionally insecure",
        "Having your resources or time taken for granted"
      ],
      hiddenFears: [
        "That without your possessions, you have no identity",
        "That your love is only valued for what you provide",
        "That change will reveal you cannot adapt"
      ],
      destructivePatterns: [
        "Staying in dead situations because they are familiar",
        "Using food, shopping, or substances to numb anxiety",
        "Passive-aggressive resistance instead of honest communication"
      ]
    },
    ritual: {
      title: "The Earthing Ceremony",
      element: "Earth",
      practice: "Sensory grounding ritual to reconnect with body and earth",
      timing: "Friday evenings (Venus day) or during times of anxiety",
      tools: ["Natural salt", "Rose petals", "Copper bowl", "Earth from your local land"],
      steps: [
        "Fill the copper bowl with warm water, salt, and rose petals",
        "Hold the local earth in your hands, breathing into it",
        "Submerge your hands in the rose water while speaking gratitude for what sustains you",
        "Anoint your pulse points with the water",
        "Return the earth to your garden or a potted plant as an offering"
      ]
    },
    affinity: {
      stones: [
        { name: "Rose Quartz", purpose: "Opens the heart beyond possessive love" },
        { name: "Emerald", purpose: "Venus stone for abundance without grasping" },
        { name: "Malachite", purpose: "Transformation of stagnant patterns" }
      ],
      botanicals: [
        { name: "Rose", use: "Heart-opening tea and bath ritual" },
        { name: "Mugwort", use: "Dream work for processing resistance to change" },
        { name: "Patchouli", use: "Grounding aromatherapy for anxiety" }
      ],
      colors: [
        { name: "Forest Green", hex: "#228B22", meaning: "Growth through patience" },
        { name: "Copper", hex: "#B87333", meaning: "Venus metal, sensual grounding" },
        { name: "Cream", hex: "#FFFDD0", meaning: "Soft strength and comfort" }
      ],
      sacredNumber: 6,
      moonPhase: "Waxing Crescent (building slowly)"
    }
  },

  Gemini: {
    sign: "Gemini",
    symbol: "♊",
    element: "Air",
    ruling: "Mercury",
    essence: {
      title: "The Sacred Witness",
      poetry: "You are the universe observing itself through infinite lenses. Your soul carries the gift of translation—bridging worlds that cannot speak to each other. In you lives the holy curiosity that preceded language, the questions that created consciousness.",
      coreWounds: [
        "Feeling like no one truly knows the 'real' you",
        "Being labeled flaky when you are actually multifaceted",
        "Childhood environments that required adaptation to survive"
      ],
      soulGifts: [
        "Making the complex accessible to all",
        "Seeing connections invisible to others",
        "The sacred gift of lightness in dark times"
      ]
    },
    shadow: {
      title: "The Fragmented Self",
      rawTruth: "Your adaptability became a survival mechanism that now prevents you from knowing who you truly are. You collect personalities like masks, so skilled at mirroring that you've forgotten your own reflection. Your restlessness is a flight from the terrifying stillness of being one thing.",
      triggers: [
        "Boredom or routine that feels like entrapment",
        "Being forced to commit to one identity or path",
        "Emotional demands that require depth over breadth"
      ],
      hiddenFears: [
        "That without performance, you are empty",
        "That real intimacy will expose your fragmentation",
        "That you will never find your 'true' self among the many"
      ],
      destructivePatterns: [
        "Surface connections that never risk vulnerability",
        "Intellectualizing emotions to avoid feeling them",
        "Ghosting when relationships demand consistency"
      ]
    },
    ritual: {
      title: "The Integration Dialogue",
      element: "Air",
      practice: "Written conversation between your inner selves for integration",
      timing: "Wednesday (Mercury day) during waning moon for release",
      tools: ["Journal with two different colored pens", "Mercury-ruled incense (lavender)", "Feather"],
      steps: [
        "Light lavender incense and hold the feather to invoke air element",
        "With one pen, write as your 'public self'—the adapted you",
        "With the other pen, respond as your 'private self'—the hidden you",
        "Let them have a conversation: What does each need? What does each fear?",
        "Close by writing one sentence both selves can agree on"
      ]
    },
    affinity: {
      stones: [
        { name: "Agate", purpose: "Integration of scattered energies" },
        { name: "Citrine", purpose: "Mental clarity without coldness" },
        { name: "Blue Lace Agate", purpose: "Calm communication with self" }
      ],
      botanicals: [
        { name: "Lavender", use: "Calming the overactive mind" },
        { name: "Peppermint", use: "Mental clarity tea for focus" },
        { name: "Lemon Balm", use: "Anxiety relief while maintaining alertness" }
      ],
      colors: [
        { name: "Mercury Silver", hex: "#C0C0C0", meaning: "Quicksilver adaptability" },
        { name: "Pale Yellow", hex: "#FFFF99", meaning: "Mental illumination" },
        { name: "Sky Blue", hex: "#87CEEB", meaning: "Air element lightness" }
      ],
      sacredNumber: 5,
      moonPhase: "First Quarter (decision and action)"
    }
  },

  Cancer: {
    sign: "Cancer",
    symbol: "♋",
    element: "Water",
    ruling: "Moon",
    essence: {
      title: "The Keeper of Memory",
      poetry: "You are the living archive of humanity's emotional inheritance. Your soul carries the weight of ancestral feeling, the tears your grandmother could not shed, the love your lineage could not express. In you lives the sacred mother—the womb of the world.",
      coreWounds: [
        "Carrying emotions that do not belong to you",
        "Being the family's emotional shock absorber",
        "Childhood roles of caretaking before you were cared for"
      ],
      soulGifts: [
        "Creating belonging from nothing",
        "The intuition that reads unspoken needs",
        "Holding others through their unbearable moments"
      ]
    },
    shadow: {
      title: "The Consuming Tide",
      rawTruth: "Your nurturing can become a form of control, your care a currency for love. You give to be needed, and your needs go unspoken until they explode as resentment. Your shell hardens not for protection but as punishment for those who failed to see your softness.",
      triggers: [
        "Rejection or perceived abandonment",
        "Having your caregiving taken for granted",
        "Criticism of your family or home"
      ],
      hiddenFears: [
        "That you are only valuable when useful to others",
        "That expressing needs makes you a burden",
        "That your emotions are 'too much' for anyone to hold"
      ],
      destructivePatterns: [
        "Martyrdom followed by explosive resentment",
        "Emotional manipulation through guilt",
        "Retreating into silence rather than expressing hurt"
      ]
    },
    ritual: {
      title: "The Lunar Bath",
      element: "Water",
      practice: "Full immersion water ritual for emotional release and boundary setting",
      timing: "Monday nights, especially during Full Moon",
      tools: ["Sea salt", "Moonstone", "White candle", "Lunar-charged water"],
      steps: [
        "Draw a bath and add sea salt, asking it to absorb what is not yours",
        "Light the white candle and place moonstone nearby",
        "Submerge fully and speak aloud: 'I release what was never mine to carry'",
        "Name three emotions you absorbed from others today",
        "Rise from the water as if being reborn, letting the water drain with the absorbed energy"
      ]
    },
    affinity: {
      stones: [
        { name: "Moonstone", purpose: "Connection to lunar cycles and intuition" },
        { name: "Pearl", purpose: "Irritation transmuted into beauty (like your pain)" },
        { name: "Selenite", purpose: "Energetic cleansing and boundary protection" }
      ],
      botanicals: [
        { name: "Chamomile", use: "Soothing tea for emotional overwhelm" },
        { name: "Jasmine", use: "Moon flower for dream work and intuition" },
        { name: "White Willow", use: "Boundary protection and emotional flexibility" }
      ],
      colors: [
        { name: "Pearl White", hex: "#F0EAD6", meaning: "Purity and lunar connection" },
        { name: "Silver", hex: "#C0C0C0", meaning: "Reflective, intuitive wisdom" },
        { name: "Sea Foam", hex: "#93E9BE", meaning: "Emotional fluidity" }
      ],
      sacredNumber: 2,
      moonPhase: "Full Moon (illumination and release)"
    }
  },

  Leo: {
    sign: "Leo",
    symbol: "♌",
    element: "Fire",
    ruling: "Sun",
    essence: {
      title: "The Sovereign Heart",
      poetry: "You are the universe's standing ovation for itself—proof that existence deserves to be celebrated. Your soul carries the sacred duty of modeling self-love in a world that teaches shame. In you lives the original light that makes all seeing possible.",
      coreWounds: [
        "The devastating belief that love must be earned through performance",
        "Childhood attention that was conditional or competitive",
        "Being the 'golden child' who could never show weakness"
      ],
      soulGifts: [
        "Modeling authentic self-celebration",
        "Warming those frozen by shame",
        "Creating joy as an act of resistance"
      ]
    },
    shadow: {
      title: "The Hungry Crown",
      rawTruth: "Your need for attention is a bottomless well that no amount of applause can fill, because the wound is not about recognition—it's about worth. You perform because being seen is the only proof you have that you exist. Your pride is armor over a terrified child who fears being ordinary.",
      triggers: [
        "Being overlooked, ignored, or upstaged",
        "Criticism of your creative work or identity",
        "Witnessing others receive praise you feel you deserved"
      ],
      hiddenFears: [
        "That without an audience, you disappear",
        "That your true self, without the performance, is unlovable",
        "That you peaked already and your light is fading"
      ],
      destructivePatterns: [
        "Competing with loved ones instead of celebrating them",
        "Drama creation to secure center stage",
        "Dismissing others' accomplishments to protect your ego"
      ]
    },
    ritual: {
      title: "The Solar Coronation",
      element: "Fire",
      practice: "Self-blessing ritual to receive your own love without external validation",
      timing: "Sunday at solar noon, or when craving external approval",
      tools: ["Gold candle", "Mirror", "Sunflower or citrus oil", "Crown or headpiece (any kind)"],
      steps: [
        "Light the gold candle before a mirror",
        "Anoint your forehead with sunflower oil, saying 'I crown myself worthy'",
        "Place the crown on your head and look into your own eyes",
        "Speak aloud five things you love about yourself without external achievement",
        "Bow to your reflection and say 'You have always been enough'"
      ]
    },
    affinity: {
      stones: [
        { name: "Sunstone", purpose: "Inner radiance independent of external light" },
        { name: "Tiger's Eye", purpose: "Confidence without arrogance" },
        { name: "Amber", purpose: "Fossilized sunlight for warmth and joy" }
      ],
      botanicals: [
        { name: "Sunflower", use: "Solar alignment and self-directed love" },
        { name: "Rosemary", use: "Sun herb for clarity and heart opening" },
        { name: "Marigold", use: "Solar radiance and protective warmth" }
      ],
      colors: [
        { name: "Solar Gold", hex: "#FFD700", meaning: "Divine radiance and sovereignty" },
        { name: "Royal Purple", hex: "#7851A9", meaning: "Nobility and creative power" },
        { name: "Sunset Orange", hex: "#FF5349", meaning: "Warmth shared generously" }
      ],
      sacredNumber: 1,
      moonPhase: "Waxing Gibbous (nearly full, building toward brilliance)"
    }
  },

  Virgo: {
    sign: "Virgo",
    symbol: "♍",
    element: "Earth",
    ruling: "Mercury",
    essence: {
      title: "The Sacred Tender",
      poetry: "You are the universe's devoted caretaker—the one who notices what others overlook, who tends what others abandon. Your soul carries the holy work of making the mundane sacred. In you lives the ancient knowledge that devotion is expressed through details.",
      coreWounds: [
        "The belief that you are inherently flawed and must constantly improve",
        "Childhood messages that your worth came from being useful",
        "The burden of being the 'responsible one' too young"
      ],
      soulGifts: [
        "Seeing the sacred in the seemingly insignificant",
        "Service that heals without needing credit",
        "The alchemist's eye that finds potential in brokenness"
      ]
    },
    shadow: {
      title: "The Merciless Perfectionist",
      rawTruth: "Your critical eye, which you believe is in service of improvement, is actually the internalized voice of those who made you feel insufficient. You pick yourself apart before others can, and your 'helpfulness' often projects your self-dissatisfaction onto those you love. Your anxiety is not about details—it's about the terror of being found worthless.",
      triggers: [
        "Making mistakes or being caught in errors",
        "Chaos, mess, or lack of order in your environment",
        "Having your help refused or your expertise questioned"
      ],
      hiddenFears: [
        "That you are fundamentally broken beyond repair",
        "That if you stop working on yourself, you will be abandoned",
        "That your imperfections are visible to everyone"
      ],
      destructivePatterns: [
        "Paralysis from perfectionism that prevents starting",
        "Criticizing others as a way to feel superior",
        "Overworking as a form of self-punishment"
      ]
    },
    ritual: {
      title: "The Imperfection Embrace",
      element: "Earth",
      practice: "Intentional 'imperfect' creation to release perfectionism's grip",
      timing: "Wednesday (Mercury day) during waning moon for release",
      tools: ["Clay or modeling material", "Lavender", "Green candle", "Earth from a garden"],
      steps: [
        "Light the green candle and breathe in lavender",
        "Hold the clay and set intention: 'I create without judgment'",
        "Shape something—anything—for 10 minutes with no editing or fixing",
        "When finished, bless it with garden earth and say 'This is enough'",
        "Place it somewhere visible as a reminder that completion is enough"
      ]
    },
    affinity: {
      stones: [
        { name: "Peridot", purpose: "Self-forgiveness and release of criticism" },
        { name: "Amazonite", purpose: "Soothing the anxious mind" },
        { name: "Moss Agate", purpose: "Connection to earth's patient growth" }
      ],
      botanicals: [
        { name: "Lavender", use: "Calming the critical mind" },
        { name: "Sage", use: "Purification without self-punishment" },
        { name: "Fennel", use: "Mercury herb for digestive and mental clarity" }
      ],
      colors: [
        { name: "Forest Sage", hex: "#5F7161", meaning: "Healing growth and service" },
        { name: "Wheat", hex: "#F5DEB3", meaning: "Harvest of patient effort" },
        { name: "Navy", hex: "#000080", meaning: "Grounded intellectual depth" }
      ],
      sacredNumber: 5,
      moonPhase: "Waning Gibbous (reflection and refinement)"
    }
  },

  Libra: {
    sign: "Libra",
    symbol: "♎",
    element: "Air",
    ruling: "Venus",
    essence: {
      title: "The Sacred Mediator",
      poetry: "You are the universe's quest for equilibrium—the living proof that harmony is not passive but actively created. Your soul carries the sacred contract of beauty, the duty to remind a harsh world that grace is possible. In you lives the ancient knowing that relationship is the crucible of evolution.",
      coreWounds: [
        "Losing yourself to keep the peace",
        "Childhood as the family diplomat who couldn't have needs",
        "The belief that your value depends on being pleasing"
      ],
      soulGifts: [
        "Creating beauty where there was none",
        "Holding space for opposing truths simultaneously",
        "The diplomatic wisdom that transforms conflict into connection"
      ]
    },
    shadow: {
      title: "The Vanishing Self",
      rawTruth: "Your desire for harmony has made you a chameleon who has forgotten their true colors. You avoid conflict not because you are peaceful, but because you are terrified of being disliked. Your indecision is not thoughtfulness—it's a refusal to take responsibility for wanting anything. Your 'fairness' often masks a cowardice about taking sides when sides must be taken.",
      triggers: [
        "Open conflict or confrontation",
        "Being forced to choose or commit",
        "Ugliness, crudeness, or lack of aesthetic"
      ],
      hiddenFears: [
        "That your true opinions will make you unlovable",
        "That you don't actually know who you are alone",
        "That demanding fairness for yourself is selfish"
      ],
      destructivePatterns: [
        "People-pleasing that breeds resentment",
        "Passive-aggression instead of honest conflict",
        "Staying in relationships that diminish you to avoid being alone"
      ]
    },
    ritual: {
      title: "The Self-Claiming",
      element: "Air",
      practice: "Mirror work for reconnecting with personal desires and opinions",
      timing: "Friday (Venus day) during waxing moon for building self-relationship",
      tools: ["Rose quartz", "Pink candle", "Mirror", "List of 'I want' statements"],
      steps: [
        "Light the pink candle before a mirror, hold rose quartz over heart",
        "Look into your eyes and ask: 'What do YOU want, separate from what others need?'",
        "Write 10 statements beginning with 'I want...' without editing for reasonableness",
        "Read each aloud to your reflection: 'I want this, and I am allowed to want it'",
        "Choose one desire to honor this week, regardless of others' reactions"
      ]
    },
    affinity: {
      stones: [
        { name: "Rose Quartz", purpose: "Self-love as foundation for partnership" },
        { name: "Lapis Lazuli", purpose: "Speaking truth while maintaining grace" },
        { name: "Jade", purpose: "Harmony without self-abandonment" }
      ],
      botanicals: [
        { name: "Rose", use: "Venus flower for self-love and heart opening" },
        { name: "Ylang Ylang", use: "Balancing emotions and honoring desires" },
        { name: "Geranium", use: "Harmony and gentle assertion" }
      ],
      colors: [
        { name: "Blush Pink", hex: "#DE5D83", meaning: "Soft strength and self-love" },
        { name: "Pale Blue", hex: "#AEC6CF", meaning: "Peaceful communication" },
        { name: "Copper", hex: "#B87333", meaning: "Venus metal for warmth and beauty" }
      ],
      sacredNumber: 6,
      moonPhase: "First Quarter (balanced action and reflection)"
    }
  },

  Scorpio: {
    sign: "Scorpio",
    symbol: "♏",
    element: "Water",
    ruling: "Pluto",
    essence: {
      title: "The Keeper of Death",
      poetry: "You are the universe's alchemist—the one who descends into darkness so others don't have to go alone. Your soul carries the forbidden knowledge that death is a doorway, that destruction precedes creation. In you lives the ancient courage to face what others cannot bear to acknowledge.",
      coreWounds: [
        "Betrayal that taught you trust is dangerous",
        "Childhood powerlessness that became adult control",
        "Being forced to witness darkness too young"
      ],
      soulGifts: [
        "Sitting with others in their darkest moments",
        "The courage to transform through destruction",
        "X-ray vision for truth beneath surface"
      ]
    },
    shadow: {
      title: "The Poison and the Antidote",
      rawTruth: "Your intensity is not power—it's a wound dressed as a weapon. You test others to destruction because you were destroyed first, and you cannot believe in love that hasn't survived your worst. Your secrecy is not self-protection; it's a prison you built around a child who was never allowed to be vulnerable. Your sting contains the poison of every betrayal you couldn't grieve.",
      triggers: [
        "Lies or perceived deception",
        "Power being wielded over you",
        "Surface-level relationships or conversations"
      ],
      hiddenFears: [
        "That if people truly knew you, they would leave",
        "That your darkness will consume you completely",
        "That forgiveness means excusing the unforgivable"
      ],
      destructivePatterns: [
        "Testing relationships to destruction",
        "Using secrets as weapons when hurt",
        "Obsession disguised as love"
      ]
    },
    ritual: {
      title: "The Shadow Integration",
      element: "Water",
      practice: "Journaling descent into shadow for integration rather than suppression",
      timing: "Tuesday (Mars day) during Dark Moon for underworld work",
      tools: ["Black candle", "Obsidian", "Journal", "Small amount of ash or burnt herbs"],
      steps: [
        "Light the black candle in darkness, holding obsidian to your heart",
        "Write a letter to the part of you that others fear",
        "Ask it: What do you protect? What do you need? What do you want me to know?",
        "Burn the letter (safely) and collect the ash",
        "Bury the ash, saying: 'I integrate you. You are no longer exile.'"
      ]
    },
    affinity: {
      stones: [
        { name: "Obsidian", purpose: "Mirror to the shadow without judgment" },
        { name: "Labradorite", purpose: "Psychic protection and mystical vision" },
        { name: "Garnet", purpose: "Transmutation of passion into purpose" }
      ],
      botanicals: [
        { name: "Wormwood", use: "Shadow work and underworld journeying" },
        { name: "Black Cohosh", use: "Releasing stored trauma from the body" },
        { name: "Myrrh", use: "Ancient resin for transformation and protection" }
      ],
      colors: [
        { name: "Obsidian Black", hex: "#0B0B0B", meaning: "The void that contains all" },
        { name: "Blood Red", hex: "#660000", meaning: "Passion and life force" },
        { name: "Deep Plum", hex: "#3D0C02", meaning: "Power and mystery" }
      ],
      sacredNumber: 8,
      moonPhase: "Dark Moon (death and rebirth)"
    }
  },

  Sagittarius: {
    sign: "Sagittarius",
    symbol: "♐",
    element: "Fire",
    ruling: "Jupiter",
    essence: {
      title: "The Eternal Seeker",
      poetry: "You are the universe's arrow—aimed at horizons others cannot perceive. Your soul carries the sacred restlessness that pushes evolution forward. In you lives the original faith that meaning exists, even when evidence fails. You are the proof that searching is itself a form of finding.",
      coreWounds: [
        "Freedom that masks a fear of rootedness",
        "Using philosophy to bypass emotional pain",
        "Childhood experiences that made home feel like a cage"
      ],
      soulGifts: [
        "Inspiring others to believe in possibility",
        "Finding meaning in meaninglessness",
        "The courage to chase truth wherever it leads"
      ]
    },
    shadow: {
      title: "The Endless Horizon",
      rawTruth: "Your quest for freedom is a flight from intimacy. You call it adventure; it is often avoidance. Your 'honesty' can be cruelty dressed as truth-telling, fired at those who cannot escape your aim. You preach about life while running from your own, mistaking movement for progress and novelty for growth.",
      triggers: [
        "Routine or predictability",
        "Demands for commitment or accountability",
        "Being questioned about your lifestyle or beliefs"
      ],
      hiddenFears: [
        "That you will never find the 'answer' you seek",
        "That stillness will reveal you have been running from yourself",
        "That commitment means death of the self"
      ],
      destructivePatterns: [
        "Abandoning relationships when they require depth",
        "Preaching to avoid practicing",
        "Using 'brutal honesty' to avoid emotional labor"
      ]
    },
    ritual: {
      title: "The Sacred Pause",
      element: "Fire",
      practice: "Grounding practice for the eternal wanderer to find home within",
      timing: "Thursday (Jupiter day) during Full Moon for illuminated reflection",
      tools: ["Purple candle", "Turquoise stone", "Map or globe", "Journal"],
      steps: [
        "Light the purple candle and hold turquoise to your heart",
        "Touch the map/globe and ask: 'Where have I been running?'",
        "Write about what you would find if you stopped seeking externally",
        "Declare: 'The horizon I seek is within me. Arrival is possible.'",
        "Commit to one week of 'staying'—same routine, same place, same practice"
      ]
    },
    affinity: {
      stones: [
        { name: "Turquoise", purpose: "Wisdom and protection during journeys" },
        { name: "Sodalite", purpose: "Truth-seeking with compassion" },
        { name: "Amethyst", purpose: "Spiritual wisdom without bypass" }
      ],
      botanicals: [
        { name: "Sage", use: "Cleansing and vision for the journey" },
        { name: "Dandelion", use: "Jupiter herb for wishes and expansion" },
        { name: "Frankincense", use: "Connection to the divine and higher truth" }
      ],
      colors: [
        { name: "Royal Purple", hex: "#4B0082", meaning: "Spiritual nobility and wisdom" },
        { name: "Turquoise", hex: "#40E0D0", meaning: "Protection and honest speech" },
        { name: "Midnight Blue", hex: "#191970", meaning: "Depth of philosophical inquiry" }
      ],
      sacredNumber: 3,
      moonPhase: "Waxing Gibbous (expanding vision)"
    }
  },

  Capricorn: {
    sign: "Capricorn",
    symbol: "♑",
    element: "Earth",
    ruling: "Saturn",
    essence: {
      title: "The Ancient Architect",
      poetry: "You are the universe's scaffolding—the structure that allows dreams to become buildings. Your soul carries the old, old knowing that nothing worthwhile is built quickly. In you lives the mountain's patience, the stone's memory, the ancestor's long view.",
      coreWounds: [
        "Shouldering responsibility before you were ready",
        "Childhood that required you to be the adult",
        "Achievement as the only acceptable love language"
      ],
      soulGifts: [
        "Making impossible things structurally possible",
        "Holding long-term vision when others cannot",
        "Quiet, enduring strength for those who falter"
      ]
    },
    shadow: {
      title: "The Frozen Summit",
      rawTruth: "You have confused achievement with worthiness, and your relentless climbing has left you alone at altitudes where no one can reach you. Your 'responsibility' is often control wearing a respectable mask. You have forgotten that you are allowed to need, to rest, to be carried. The walls you built for protection have become a prison.",
      triggers: [
        "Failure or public embarrassment",
        "Feeling out of control or incompetent",
        "Witnessing others succeed with less effort"
      ],
      hiddenFears: [
        "That you are only valuable for what you produce",
        "That rest will reveal you are not as capable as you seem",
        "That your emotions, if felt, will undo you completely"
      ],
      destructivePatterns: [
        "Working to exhaustion to prove worth",
        "Emotional unavailability disguised as pragmatism",
        "Controlling outcomes to avoid vulnerability"
      ]
    },
    ritual: {
      title: "The Permission to Rest",
      element: "Earth",
      practice: "Sabbath ritual for releasing the compulsion to produce",
      timing: "Saturday (Saturn day) during Waning Moon for release",
      tools: ["Brown or black candle", "Smoky quartz", "Blanket", "Timer"],
      steps: [
        "Light the candle and set the timer for 30 minutes",
        "Wrap yourself in the blanket, holding smoky quartz to your belly",
        "For 30 minutes, you are forbidden to be productive",
        "If productive thoughts arise, say: 'I am worthy right now, doing nothing'",
        "When the timer ends, thank yourself for rest and blow out the candle"
      ]
    },
    affinity: {
      stones: [
        { name: "Smoky Quartz", purpose: "Grounding without rigidity" },
        { name: "Onyx", purpose: "Saturn stone for structure with soul" },
        { name: "Jet", purpose: "Absorbing heavy emotional burden" }
      ],
      botanicals: [
        { name: "Comfrey", use: "Saturn herb for deep bone-level healing" },
        { name: "Horsetail", use: "Structural support and mineral restoration" },
        { name: "Black Tea", use: "Grounding ritual beverage for daily practice" }
      ],
      colors: [
        { name: "Charcoal", hex: "#36454F", meaning: "Authority and groundedness" },
        { name: "Forest Brown", hex: "#4B3621", meaning: "Ancient earth wisdom" },
        { name: "Stone Grey", hex: "#928E85", meaning: "Mountain patience" }
      ],
      sacredNumber: 8,
      moonPhase: "Last Quarter (release and completion)"
    }
  },

  Aquarius: {
    sign: "Aquarius",
    symbol: "♒",
    element: "Air",
    ruling: "Uranus",
    essence: {
      title: "The Sacred Outsider",
      poetry: "You are the universe's mutant—the evolutionary leap that arrives before its time. Your soul carries the frequency of tomorrow, the signal that most cannot yet receive. In you lives the alien perspective that shocks systems into growth, the love that is too vast for single relationships.",
      coreWounds: [
        "Never fitting in, no matter how you tried",
        "Being loved for your ideas but not your humanity",
        "Childhood otherness that became identity"
      ],
      soulGifts: [
        "Seeing futures others cannot imagine",
        "Loving the collective without losing individual sight",
        "Revolution tempered by reason"
      ]
    },
    shadow: {
      title: "The Frozen Star",
      rawTruth: "Your 'individuality' has become a fortress against the intimacy you secretly crave. You intellectualize love because feeling it fully would require vulnerability you cannot afford. Your detachment is not evolution—it is exile. You are so focused on humanity's future that you cannot be present for the humans in front of you.",
      triggers: [
        "Conformity or 'normal' expectations",
        "Emotional demands that feel engulfing",
        "Being categorized or labeled"
      ],
      hiddenFears: [
        "That you are too strange to ever truly belong",
        "That your ideas are your only value",
        "That intimacy will compromise your independence"
      ],
      destructivePatterns: [
        "Using 'rational' analysis to dismiss emotions",
        "Maintaining distance under the guise of independence",
        "Abandoning connections before they can disappoint"
      ]
    },
    ritual: {
      title: "The Return to the Body",
      element: "Air",
      practice: "Somatic grounding for the over-intellectualized Aquarian",
      timing: "Saturday (Uranus day) during waxing moon for building embodiment",
      tools: ["Electric blue candle", "Aquamarine or fluorite", "Music with strong bass", "Your body"],
      steps: [
        "Light the blue candle and hold the crystal",
        "Put on music with heavy bass and let it vibrate through you",
        "For 10 minutes, let your body move however it wants—no 'meaning' required",
        "Notice where you are numb, where you are alive",
        "Touch those numb places and say: 'I live here too. You are welcome.'"
      ]
    },
    affinity: {
      stones: [
        { name: "Aquamarine", purpose: "Emotional expression without drowning" },
        { name: "Fluorite", purpose: "Mental clarity with heart connection" },
        { name: "Amethyst", purpose: "Bridging higher mind with present moment" }
      ],
      botanicals: [
        { name: "Valerian", use: "Calming the electric nervous system" },
        { name: "Skullcap", use: "Soothing the overactive mind" },
        { name: "Star Anise", use: "Uranian herb for intuition and innovation" }
      ],
      colors: [
        { name: "Electric Blue", hex: "#7DF9FF", meaning: "Innovation and awakening" },
        { name: "Violet", hex: "#8F00FF", meaning: "Higher mind and vision" },
        { name: "Silver", hex: "#C0C0C0", meaning: "Futuristic clarity" }
      ],
      sacredNumber: 4,
      moonPhase: "Waning Crescent (visionary preparation)"
    }
  },

  Pisces: {
    sign: "Pisces",
    symbol: "♓",
    element: "Water",
    ruling: "Neptune",
    essence: {
      title: "The Holy Dissolver",
      poetry: "You are the universe returning to itself—the drop that remembers it is the ocean. Your soul carries the final wisdom: that separation is illusion, that all suffering is a forgetting. In you lives the dreamer and the dream, the prayer and the answer, the wound and the healer.",
      coreWounds: [
        "Absorbing others' pain as if it were your own",
        "Boundaries that never formed or dissolved too easily",
        "Childhood environments that required you to be 'psychic' to survive"
      ],
      soulGifts: [
        "The capacity to hold all of human experience with compassion",
        "Art that heals without words",
        "Unconditional love that asks nothing in return"
      ]
    },
    shadow: {
      title: "The Beautiful Escape",
      rawTruth: "Your mysticism can become a way to avoid the mess of incarnation. You dissolve your boundaries so completely that you don't know where others end and you begin—and you call this 'empathy' when it is often abandonment of self. Your escapism—substances, fantasy, spiritual bypass—is not transcendence; it is a flight from the incarnation you came here to master.",
      triggers: [
        "Harsh criticism or conflict",
        "Demands for logic or practicality",
        "Feeling unseen in your true nature"
      ],
      hiddenFears: [
        "That without your gifts, you are ordinary and unneeded",
        "That the world is too harsh for you to survive",
        "That your porous boundaries mean you will always lose yourself"
      ],
      destructivePatterns: [
        "Martyrdom as identity and worth",
        "Addiction and escapism as coping",
        "Staying in situations where you're victimized"
      ]
    },
    ritual: {
      title: "The Sacred Container",
      element: "Water",
      practice: "Boundary building for the boundless Pisces",
      timing: "Thursday or Friday during Waning Moon for release of absorbed energy",
      tools: ["Pale blue candle", "Amethyst", "Bowl of salted water", "Mirror"],
      steps: [
        "Light the candle before the mirror, place amethyst at heart",
        "Visualize a soft but impermeable bubble around your body",
        "For each emotion or energy that isn't yours, drop a pinch of salt into water",
        "Say: 'I return what was never mine. I welcome only what is truly me.'",
        "Pour the water into the earth, releasing absorbed energies"
      ]
    },
    affinity: {
      stones: [
        { name: "Amethyst", purpose: "Spiritual protection and intuition" },
        { name: "Aquamarine", purpose: "Flow without drowning" },
        { name: "Lepidolite", purpose: "Calming the overwhelmed nervous system" }
      ],
      botanicals: [
        { name: "Mugwort", use: "Dream work and psychic boundary setting" },
        { name: "Lotus", use: "Rising from the depths into enlightenment" },
        { name: "Seaweed", use: "Neptune connection and mineral support" }
      ],
      colors: [
        { name: "Sea Foam", hex: "#93E9BE", meaning: "Gentle boundaries" },
        { name: "Lavender", hex: "#E6E6FA", meaning: "Spiritual cleansing" },
        { name: "Pale Turquoise", hex: "#AFEEEE", meaning: "Clarity in depths" }
      ],
      sacredNumber: 7,
      moonPhase: "Waning Crescent (dreaming and release)"
    }
  }
};

export function getZodiacDeepContent(sign: string): ZodiacDeepContent | null {
  return zodiacDeepContent[sign] || null;
}
