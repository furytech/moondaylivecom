// Forecast Engine - Generates personalized daily forecasts
// based on the relationship between birth moon sign and current moon sign

interface ForecastData {
  headline: string;
  forecast: string;
  energy: "harmonious" | "dynamic" | "transformative" | "grounding";
  luckyFocus: string;
}

type Element = "Fire" | "Earth" | "Air" | "Water";

const signElements: Record<string, Element> = {
  Aries: "Fire",
  Leo: "Fire",
  Sagittarius: "Fire",
  Taurus: "Earth",
  Virgo: "Earth",
  Capricorn: "Earth",
  Gemini: "Air",
  Libra: "Air",
  Aquarius: "Air",
  Cancer: "Water",
  Scorpio: "Water",
  Pisces: "Water",
};

const signSymbols: Record<string, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

// Element compatibility determines the base energy
function getElementRelationship(birthElement: Element, currentElement: Element): ForecastData["energy"] {
  if (birthElement === currentElement) return "harmonious";
  
  const compatible: Record<Element, Element> = {
    Fire: "Air",
    Air: "Fire",
    Earth: "Water",
    Water: "Earth",
  };
  
  if (compatible[birthElement] === currentElement) return "dynamic";
  
  const challenging: Record<Element, Element> = {
    Fire: "Water",
    Water: "Fire",
    Earth: "Air",
    Air: "Earth",
  };
  
  if (challenging[birthElement] === currentElement) return "transformative";
  
  return "grounding";
}

// Generate the headline based on sign relationship
function generateHeadline(birthSign: string, currentSign: string, energy: ForecastData["energy"]): string {
  const headlines: Record<ForecastData["energy"], string[]> = {
    harmonious: [
      `Your ${birthSign} Moon finds kinship with today's ${currentSign} Moon`,
      `A celestial echo — ${birthSign} meets ${currentSign} in harmony`,
      `The cosmos mirrors your essence today`,
    ],
    dynamic: [
      `Your ${birthSign} Moon dances with today's ${currentSign} energy`,
      `Electric currents flow between ${birthSign} and ${currentSign}`,
      `Creative tension sparks as ${birthSign} encounters ${currentSign}`,
    ],
    transformative: [
      `Your ${birthSign} Moon navigates ${currentSign}'s transformative waters`,
      `A day of alchemy — ${birthSign} transmutes through ${currentSign}`,
      `Growth beckons as ${birthSign} meets ${currentSign}'s challenge`,
    ],
    grounding: [
      `Your ${birthSign} Moon finds balance in ${currentSign}'s presence`,
      `Steady currents between ${birthSign} and ${currentSign}`,
      `A day for integration — ${birthSign} anchors in ${currentSign}`,
    ],
  };
  
  const options = headlines[energy];
  // Use date to create consistent daily selection
  const dayIndex = new Date().getDate() % options.length;
  return options[dayIndex];
}

// Detailed forecast content based on specific sign combinations
const signForecasts: Record<string, Record<string, string>> = {
  Aries: {
    Aries: "Double fire ignites your spirit today. Your natural courage is amplified — trust those bold impulses. The universe supports decisive action.",
    Taurus: "Your fiery nature meets grounding earth energy. Slow down and savor the moment. Material pleasures and practical steps bring unexpected satisfaction.",
    Gemini: "Your passion finds new avenues of expression through words and ideas. Communication flows easily — share your vision with those who need to hear it.",
    Cancer: "Today invites you to tend your inner fire with gentleness. Nurture yourself and close loved ones. Vulnerability is your hidden strength.",
    Leo: "Fellow fire energy celebrates your boldness. Creative endeavors flourish. Step into the spotlight — your authentic self magnetizes what you desire.",
    Virgo: "Channel your warrior spirit into meaningful details. Precision and passion combine beautifully today. Small acts of service ripple outward.",
    Libra: "The art of balance beckons. Your directness softens into diplomacy without losing its edge. Relationships offer mirrors for growth.",
    Scorpio: "Deep waters call to your flame. Transform intensity into insight. What you're ready to release creates space for rebirth.",
    Sagittarius: "Adventure awaits on the horizon. Your pioneering spirit finds kindred energy in today's expansive mood. Dream bigger, then act.",
    Capricorn: "Structure serves your fire today. Ambitious plans find solid footing. The mountain you're climbing reveals a clearer path.",
    Aquarius: "Innovation sparks from your courage. Break conventions that no longer serve. Your independence inspires collective awakening.",
    Pisces: "Dreams and action interweave mysteriously. Trust intuitive nudges even when logic protests. Magic moves through your boldest steps.",
  },
  Taurus: {
    Aries: "Today's bold energy stirs your steady nature. Embrace spontaneity without abandoning your wisdom. Quick action can serve lasting goals.",
    Taurus: "The cosmos honors your essence today. Sensory pleasures feel richer, stability feels sweeter. You are exactly where you need to be.",
    Gemini: "Curiosity lightens your grounded energy. New information expands your perspective. Stay open to changing your mind about one cherished belief.",
    Cancer: "Comfort and nurturing flow naturally today. Your home becomes a sanctuary. Cook something nourishing — for yourself and those you love.",
    Leo: "Creative expression calls you beyond routine. Your steady hand can craft something beautiful. Don't hide your light under practical concerns.",
    Virgo: "Fellow earth energy supports methodical progress. Details align with your patient approach. Build something that will outlast this moment.",
    Libra: "Beauty and harmony magnetize abundance today. Aesthetic choices carry weight. Trust your refined taste in all decisions.",
    Scorpio: "Intensity meets your calm depths. Transformation doesn't require drama — sometimes the deepest changes are the quietest ones.",
    Sagittarius: "Expansion tugs at your roots. You can explore without losing your center. Adventures that honor your values bring lasting rewards.",
    Capricorn: "Ambition and patience walk together today. Your steady climb gains momentum. Recognition comes to those who persist without complaint.",
    Aquarius: "Unexpected insights shake comfortable routines. Embrace innovation that enhances rather than disrupts. Change can be a friend.",
    Pisces: "Dreams infuse your practical world with magic. Intuition guides material decisions wisely. Trust the whispers between logic.",
  },
  Gemini: {
    Aries: "Thoughts become action with lightning speed today. Your ideas find bold expression. Speak your truth with confidence.",
    Taurus: "Ground your quicksilver mind in sensory experience. Slow conversations reveal deeper truths. Patience with yourself brings peace.",
    Gemini: "Your mental agility doubles today. Connections and communications flourish. Follow every curious thread — one leads somewhere magical.",
    Cancer: "Emotions add depth to your thoughts. Conversations with family or close friends reveal important insights. Listen with your heart.",
    Leo: "Your words carry creative power today. Express yourself dramatically. The stories you tell shape the reality you're creating.",
    Virgo: "Analysis and intuition merge beautifully. Details you've gathered form a larger pattern. Your mind serves your highest purpose.",
    Libra: "Social connections sparkle with meaningful exchanges. Networking brings unexpected opportunities. Your charm opens important doors.",
    Scorpio: "Surface conversations drop into depths today. Ask the questions you've been avoiding. Truth wants to be known.",
    Sagittarius: "Ideas expand into philosophies. Your natural curiosity meets wisdom-seeking energy. Learn something that changes how you see everything.",
    Capricorn: "Structure your brilliant ideas into plans. Ambition grounds your mental energy. Communicate with authority you've earned.",
    Aquarius: "Innovation flows through your thoughts effortlessly. Connect with others who see the future you envision. Collective intelligence amplifies.",
    Pisces: "Logic surrenders to imagination today. Dreams carry messages your rational mind needed. Float in mystery without needing answers.",
  },
  Cancer: {
    Aries: "Bold energy activates your protective instincts. Channel fierce love into action. Defend what matters with courage.",
    Taurus: "Comfort and security wrap around you like a blanket. Nourish body and soul. Your home is your temple today.",
    Gemini: "Emotions find words more easily today. Express feelings you've held inside. Communication bridges heart to heart.",
    Cancer: "The Moon honors your essence fully today. Intuition peaks. Trust the guidance flowing through your emotional waters.",
    Leo: "Your nurturing nature finds creative expression. Share your heart generously. The love you give returns magnified.",
    Virgo: "Care expresses through practical acts of service. Small attentions speak volumes. Your devotion manifests in helpful details.",
    Libra: "Relationships need tender balance today. Give and receive in equal measure. Harmony in your inner world reflects outward.",
    Scorpio: "Emotional depths call you to dive deeper. Transformation through feeling is your gift. Let old pain become wisdom.",
    Sagittarius: "Expand beyond familiar emotional territory. New experiences won't threaten your roots. Adventure can include coming home.",
    Capricorn: "Structure supports your sensitive nature today. Boundaries are acts of self-care. You can be soft and strong.",
    Aquarius: "Collective needs awaken your compassion. Your emotional intelligence serves the greater good. Connect heart to humanity.",
    Pisces: "Fellow water energy dissolves all boundaries. Intuition flows without obstruction. Dreams and waking life merge beautifully.",
  },
  Leo: {
    Aries: "Fellow fire ignites your creative courage. Bold self-expression finds its moment. The stage is set for your brilliance.",
    Taurus: "Ground your radiance in lasting value. Create something beautiful that endures. Your shine gains substance today.",
    Gemini: "Ideas amplify your creative expression. Communicate your vision with sparkle. Words carry your unique light.",
    Cancer: "Nurture your inner child today. Creative play heals old wounds. Your heart's joy matters more than external applause.",
    Leo: "The cosmos celebrates your essence. Shine without apology. Your authentic self-expression gives others permission to glow.",
    Virgo: "Perfect the details of your grand vision. Craft excellence in service of beauty. Your efforts deserve your best attention.",
    Libra: "Partnerships enhance your radiance today. Collaborative creativity multiplies magic. Share the spotlight gracefully.",
    Scorpio: "Intensity transforms your creative power. Dig deep beneath surface charm. Your most powerful work emerges from shadow.",
    Sagittarius: "Expand your creative horizons fearlessly. Adventures fuel your artistic vision. Play with possibilities you've never imagined.",
    Capricorn: "Ambition structures your creative fire. Build a legacy worth your brilliance. Authority and artistry combine.",
    Aquarius: "Innovation electrifies your expression. Break creative conventions boldly. Your unique vision serves collective awakening.",
    Pisces: "Dreams infuse your creativity with magic. Let intuition guide your art. The muse speaks through your open heart.",
  },
  Virgo: {
    Aries: "Bold energy challenges your careful nature. Sometimes 'good enough' is perfect. Trust impulses alongside analysis.",
    Taurus: "Fellow earth supports your methodical approach. Practical magic unfolds through patient attention. Build with confidence.",
    Gemini: "Mental agility enhances your analytical gifts. Details reveal larger patterns. Your careful observations synthesize into wisdom.",
    Cancer: "Serve with tender attention today. Your helpful nature expresses through nurturing. Care for yourself as devotedly as others.",
    Leo: "Let your work shine today. Your careful craftsmanship deserves celebration. Step beyond the shadows of service.",
    Virgo: "The cosmos honors your discerning nature. Trust your standards while releasing perfectionism. You are enough exactly as you are.",
    Libra: "Balance analysis with appreciation of beauty. Refine with gentle attention. Harmony emerges through patient adjustment.",
    Scorpio: "Deep analysis serves transformation. Your careful observation catches what others miss. Truth hides in the details you notice.",
    Sagittarius: "Expand your perspective beyond familiar routines. Big-picture thinking complements your detail orientation. Both views are true.",
    Capricorn: "Practical mastery advances your ambitions. Your careful work builds lasting success. Excellence is recognized and rewarded.",
    Aquarius: "Innovation meets methodical implementation. Your practical skills ground revolutionary ideas. Change happens one careful step at a time.",
    Pisces: "Let go of needing to understand everything. Some truths arrive through feeling. Trust the mystery your mind can't categorize.",
  },
  Libra: {
    Aries: "Bold energy challenges your diplomatic nature. Stand firm when harmony requires honesty. Balance includes your needs too.",
    Taurus: "Beauty and pleasure call you today. Aesthetic choices bring deep satisfaction. Surround yourself with what you love.",
    Gemini: "Social connections sparkle with ease. Conversations dance between light and meaningful. Your charm attracts valuable exchanges.",
    Cancer: "Nurture your relationships with tender attention. Home and partnership interweave beautifully. Emotional balance supports outer harmony.",
    Leo: "Creative collaboration brings joy today. Partnership enhances individual brilliance. Together you shine brighter than alone.",
    Virgo: "Refine your relationships with gentle attention. Small adjustments create larger harmony. Service and partnership merge.",
    Libra: "The cosmos honors your essence today. Balance feels natural and beautiful. Trust your instinct for harmony in all things.",
    Scorpio: "Depth transforms surface pleasantries. Relationships that matter deserve truth. Real intimacy requires vulnerability.",
    Sagittarius: "Expand your social horizons adventurously. New connections bring fresh perspectives. Partnership and freedom can coexist.",
    Capricorn: "Structure supports your partnerships today. Committed relationships deepen through practical attention. Build lasting harmony.",
    Aquarius: "Unique connections inspire your growth. Unconventional relationships teach valuable lessons. Community and partnership merge.",
    Pisces: "Romantic dreams infuse relationships with magic. Let intuition guide your connections. Love transcends logical understanding.",
  },
  Scorpio: {
    Aries: "Bold energy activates your hidden power. Transform intensity into courageous action. Your depth gives your strength purpose.",
    Taurus: "Ground your transformative power in lasting value. Slow, deep changes outlast dramatic upheaval. Patience serves your intensity.",
    Gemini: "Words reveal hidden truths today. Your probing nature finds expression through communication. Ask the questions that matter.",
    Cancer: "Fellow water amplifies your emotional depths. Nurture transformation through self-compassion. Healing flows from feeling.",
    Leo: "Express your power creatively today. Your intensity magnetizes attention. Let your depth shine rather than hide.",
    Virgo: "Analyze the patterns your intuition reveals. Careful observation serves transformation. Details hold the keys you seek.",
    Libra: "Balance intensity with grace today. Relationships transform through honest beauty. Harmony can hold depth.",
    Scorpio: "The cosmos honors your transformative nature. Trust your power to regenerate. Death and rebirth dance through your day.",
    Sagittarius: "Expand beyond familiar depths. Adventures in consciousness call you. Your intensity serves higher understanding.",
    Capricorn: "Ambition channels your transformative power. Build something lasting from your depths. Your intensity creates enduring change.",
    Aquarius: "Innovation disrupts comfortable shadows. Collective transformation needs your power. Personal depths serve universal awakening.",
    Pisces: "Merge with the infinite through feeling. Your depths connect to oceanic consciousness. Boundaries dissolve into unity.",
  },
  Sagittarius: {
    Aries: "Fellow fire fuels your adventures today. Bold exploration finds its moment. Follow the arrow of your enthusiasm.",
    Taurus: "Ground your wanderlust in sensory pleasure. Adventures close to home satisfy deeply. Sometimes the journey is internal.",
    Gemini: "Curiosity expands in every direction. Each conversation opens new horizons. Learning and teaching flow naturally.",
    Cancer: "Emotional depths enrich your seeking. Wisdom lives in feeling as much as thinking. Home can be a place of adventure.",
    Leo: "Creative adventures call your spirit today. Express your philosophy through joy. Play is the highest form of wisdom.",
    Virgo: "Details serve your grand vision. Careful preparation enables greater adventures. The path matters as much as the destination.",
    Libra: "Partnerships expand your horizons. Shared adventures bring deeper meaning. Relationship and freedom dance together.",
    Scorpio: "Seek truth in the depths today. Your optimism illuminates shadowed corners. Transform through understanding.",
    Sagittarius: "The cosmos celebrates your expansive spirit. Aim higher than seems possible. Your arrows fly farther than you know.",
    Capricorn: "Structure serves your wildest dreams. Ambition and adventure merge. Build the path to your highest vision.",
    Aquarius: "Revolutionary ideas match your seeking spirit. Collective liberation calls your arrow. Your truth serves universal awakening.",
    Pisces: "Dreams expand beyond all boundaries. Spiritual adventures await your willing spirit. Faith and philosophy merge into unity.",
  },
  Capricorn: {
    Aries: "Bold energy activates your ambitions. Sometimes speed serves success. Trust impulses that align with your goals.",
    Taurus: "Fellow earth supports your patient climb. Build with confidence and pleasure. Success tastes sweetest when savored.",
    Gemini: "Ideas serve your practical ambitions. Communicate your vision with authority. Your plans deserve wider audience.",
    Cancer: "Nurture your ambitions with self-compassion. Even mountains need soft places. Your strength includes your tenderness.",
    Leo: "Let your achievements shine today. Your hard work deserves recognition. Leadership requires visibility.",
    Virgo: "Methodical excellence advances your goals. Every detail serves your mastery. Perfection is the path you're already walking.",
    Libra: "Balance ambition with relationship today. Success means little without connection. Build partnerships that support your climb.",
    Scorpio: "Transform through disciplined power. Your depth strengthens your determination. Lasting change requires your patience.",
    Sagittarius: "Expand your ambitions beyond familiar peaks. New horizons call your climbing spirit. Dream bigger than practical seems to allow.",
    Capricorn: "The cosmos honors your steadfast nature. Trust your timeline. The mountain recognizes its own children.",
    Aquarius: "Innovation serves your traditional strengths. Old wisdom adapts to new times. Your authority guides collective change.",
    Pisces: "Dreams soften your structured approach. Intuition guides practical decisions. Sometimes the path is felt, not seen.",
  },
  Aquarius: {
    Aries: "Bold innovation activates today. Your revolutionary spirit finds courageous expression. Break conventions that deserve breaking.",
    Taurus: "Ground your visions in practical reality. Revolutionary change requires stable foundations. Build the future you envision.",
    Gemini: "Ideas circulate freely in your network. Communication amplifies your unique vision. Connect the dots others can't see.",
    Cancer: "Nurture your inner rebel today. Collective care includes self-compassion. Your humanity strengthens your vision.",
    Leo: "Express your unique vision creatively. Individual brilliance serves collective awakening. Your light inspires others to shine.",
    Virgo: "Detail your revolutionary ideas carefully. Practical implementation matters. Change happens through patient attention.",
    Libra: "Partnerships amplify your innovations. Collaborative visions exceed individual dreams. Community is your medium.",
    Scorpio: "Transform collective consciousness through your power. Deep change requires your vision. Revolution can be quiet.",
    Sagittarius: "Expand your vision beyond all limits. Philosophy and innovation merge. Your truth serves universal liberation.",
    Capricorn: "Structure your revolutionary insights. Authority can serve awakening. Build institutions worthy of the future.",
    Aquarius: "The cosmos celebrates your unique brilliance. Trust your unconventional path. You are exactly the change needed.",
    Pisces: "Dreams inspire your visions of tomorrow. Intuition guides innovation. The future you sense is already becoming real.",
  },
  Pisces: {
    Aries: "Bold action emerges from your dreams. Trust intuitive impulses today. Sometimes faith requires a leap.",
    Taurus: "Ground your dreams in sensory reality. Beauty manifests through patient attention. Your visions deserve earthly expression.",
    Gemini: "Words carry your intuitive wisdom. Express what you sense but struggle to name. Poetry lives in your everyday speech.",
    Cancer: "Fellow water flows through your day. Emotional and psychic sensitivity peaks. Trust the feelings flowing through you.",
    Leo: "Express your dreams creatively today. Your imagination deserves an audience. Art carries what logic cannot.",
    Virgo: "Serve through your intuitive gifts. Practical compassion manifests through careful attention. Details can be sacred.",
    Libra: "Beauty and dreams merge in relationship. Connections carry spiritual significance. Love is more than it appears.",
    Scorpio: "Fellow water amplifies your depths. Transformation flows through surrender. What dissolves makes space for rebirth.",
    Sagittarius: "Spiritual adventures expand your consciousness. Faith and philosophy merge into living wisdom. Seek the infinite in everything.",
    Capricorn: "Ground your dreams in practical steps. Visions require structure to manifest. Build bridges between worlds.",
    Aquarius: "Collective consciousness flows through your visions. Intuition serves universal awakening. Your dreams belong to everyone.",
    Pisces: "The cosmos honors your oceanic soul. Boundaries dissolve into unity. You are everything and everything is you.",
  },
};

// Lucky focus based on element combination
function getLuckyFocus(birthElement: Element, currentElement: Element): string {
  const focuses: Record<string, string> = {
    "Fire-Fire": "bold creative projects",
    "Fire-Air": "collaborative innovation",
    "Fire-Earth": "grounding passion into form",
    "Fire-Water": "emotional courage",
    "Earth-Earth": "building lasting foundations",
    "Earth-Water": "nurturing growth",
    "Earth-Fire": "energizing steady plans",
    "Earth-Air": "practical communication",
    "Air-Air": "intellectual connections",
    "Air-Fire": "inspired conversations",
    "Air-Water": "intuitive insights",
    "Air-Earth": "grounded ideas",
    "Water-Water": "deep emotional flow",
    "Water-Earth": "manifesting dreams",
    "Water-Fire": "passionate feeling",
    "Water-Air": "expressing the ineffable",
  };
  
  return focuses[`${birthElement}-${currentElement}`] || "mindful presence";
}

export function generateDailyForecast(birthSign: string, currentSign: string): ForecastData {
  const birthElement = signElements[birthSign];
  const currentElement = signElements[currentSign];
  
  if (!birthElement || !currentElement) {
    return {
      headline: "The cosmos await your journey",
      forecast: "Complete your profile to receive your personalized daily forecast.",
      energy: "harmonious",
      luckyFocus: "self-discovery",
    };
  }
  
  const energy = getElementRelationship(birthElement, currentElement);
  const headline = generateHeadline(birthSign, currentSign, energy);
  const forecast = signForecasts[birthSign]?.[currentSign] || 
    `Your ${birthSign} Moon navigates today's ${currentSign} energy with grace. Trust the cosmic dance unfolding through you.`;
  const luckyFocus = getLuckyFocus(birthElement, currentElement);
  
  return {
    headline,
    forecast,
    energy,
    luckyFocus,
  };
}

export function getSignSymbol(sign: string): string {
  return signSymbols[sign] || "☽";
}

export function getSignElement(sign: string): Element | null {
  return signElements[sign] || null;
}
