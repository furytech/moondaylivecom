// Transition Day Quiz System
// Dynamic trait-based questions to distinguish between two candidate moon signs

export interface QuizQuestion {
  id: string;
  question: string;
  optionA: {
    text: string;
    signs: string[]; // Signs this answer supports
  };
  optionB: {
    text: string;
    signs: string[];
  };
}

export interface QuizResult {
  primarySign: string;
  secondarySign: string;
  confidence: number; // 0-100 percentage
  primaryScore: number;
  secondaryScore: number;
}

// Questions designed to distinguish between adjacent signs
const quizQuestions: QuizQuestion[] = [
  // Fire vs Earth transitions
  {
    id: "action-stability",
    question: "When facing a challenge, what is your first instinct?",
    optionA: {
      text: "Take immediate action and figure it out as I go",
      signs: ["Aries", "Leo", "Sagittarius"]
    },
    optionB: {
      text: "Pause, assess the situation, and make a careful plan",
      signs: ["Taurus", "Virgo", "Capricorn"]
    }
  },
  {
    id: "emotion-expression",
    question: "How do you typically express strong emotions?",
    optionA: {
      text: "Outwardly and openly — I need to let it out",
      signs: ["Aries", "Leo", "Cancer", "Pisces"]
    },
    optionB: {
      text: "Internally or selectively — I process privately first",
      signs: ["Taurus", "Virgo", "Capricorn", "Scorpio"]
    }
  },
  {
    id: "social-energy",
    question: "At a gathering with new people, you typically feel...",
    optionA: {
      text: "Energized — I love meeting new people and sharing ideas",
      signs: ["Gemini", "Leo", "Sagittarius", "Libra", "Aquarius"]
    },
    optionB: {
      text: "Selective — I prefer deep conversations with a few people",
      signs: ["Cancer", "Scorpio", "Pisces", "Capricorn", "Taurus"]
    }
  },
  {
    id: "decision-making",
    question: "When making important decisions, you rely more on...",
    optionA: {
      text: "Intuition and how it feels in my heart",
      signs: ["Cancer", "Pisces", "Scorpio", "Leo", "Sagittarius"]
    },
    optionB: {
      text: "Logic and careful analysis of the facts",
      signs: ["Virgo", "Capricorn", "Aquarius", "Gemini", "Libra"]
    }
  },
  {
    id: "change-comfort",
    question: "How do you feel about sudden changes in your routine?",
    optionA: {
      text: "Excited — change brings new possibilities",
      signs: ["Aries", "Gemini", "Sagittarius", "Aquarius"]
    },
    optionB: {
      text: "Unsettled — I prefer stability and predictability",
      signs: ["Taurus", "Cancer", "Virgo", "Capricorn"]
    }
  },
  {
    id: "conflict-response",
    question: "In a disagreement, your natural response is to...",
    optionA: {
      text: "Address it directly and speak my mind",
      signs: ["Aries", "Leo", "Scorpio", "Sagittarius"]
    },
    optionB: {
      text: "Seek harmony and find a diplomatic solution",
      signs: ["Libra", "Pisces", "Taurus", "Cancer"]
    }
  },
  {
    id: "creativity-expression",
    question: "Your creative expression tends to be...",
    optionA: {
      text: "Bold, dramatic, or unconventional",
      signs: ["Leo", "Aquarius", "Aries", "Sagittarius"]
    },
    optionB: {
      text: "Subtle, refined, or deeply personal",
      signs: ["Pisces", "Virgo", "Cancer", "Scorpio"]
    }
  },
  {
    id: "stress-response",
    question: "When stressed, you're most likely to...",
    optionA: {
      text: "Seek distraction through activity or socializing",
      signs: ["Gemini", "Sagittarius", "Aries", "Leo", "Libra"]
    },
    optionB: {
      text: "Withdraw and seek solitude to recharge",
      signs: ["Cancer", "Scorpio", "Pisces", "Capricorn", "Virgo"]
    }
  },
  {
    id: "loyalty-style",
    question: "Your loyalty to loved ones is expressed through...",
    optionA: {
      text: "Passionate devotion and emotional intensity",
      signs: ["Scorpio", "Leo", "Cancer", "Aries"]
    },
    optionB: {
      text: "Steady reliability and practical support",
      signs: ["Taurus", "Virgo", "Capricorn", "Libra"]
    }
  },
  {
    id: "future-orientation",
    question: "When thinking about the future, you focus more on...",
    optionA: {
      text: "Possibilities, adventures, and what could be",
      signs: ["Sagittarius", "Aquarius", "Gemini", "Aries"]
    },
    optionB: {
      text: "Security, stability, and building something lasting",
      signs: ["Taurus", "Cancer", "Capricorn", "Scorpio"]
    }
  },
  // --- Same-element neighbor distinguishers (close gaps for Taurus↔Gemini,
  // Scorpio↔Sagittarius, Capricorn↔Aquarius, Pisces↔Aries) ---
  {
    id: "ideal-sunday",
    question: "Your ideal Sunday is...",
    optionA: {
      text: "Slow and sensory — one thing done well, savored",
      signs: ["Taurus", "Cancer", "Capricorn", "Scorpio", "Virgo"]
    },
    optionB: {
      text: "Varied and stimulating — multiple plans, new ideas",
      signs: ["Gemini", "Sagittarius", "Aquarius", "Aries", "Leo"]
    }
  },
  {
    id: "depth-breadth",
    question: "You're more drawn to...",
    optionA: {
      text: "Going deep into one mystery until you understand it",
      signs: ["Scorpio", "Cancer", "Pisces", "Virgo", "Capricorn"]
    },
    optionB: {
      text: "Exploring many horizons and gathering wide experience",
      signs: ["Sagittarius", "Gemini", "Aquarius", "Leo", "Aries"]
    }
  },
  {
    id: "life-measure",
    question: "You measure a good life by...",
    optionA: {
      text: "Personal achievement, mastery, and a lasting legacy",
      signs: ["Capricorn", "Leo", "Aries", "Taurus", "Scorpio"]
    },
    optionB: {
      text: "Contribution to something larger than yourself",
      signs: ["Aquarius", "Pisces", "Sagittarius", "Libra", "Cancer"]
    }
  }
];

// Select the most distinguishing questions for two specific signs
export function selectQuestionsForSigns(signA: string, signB: string, count: number = 5): QuizQuestion[] {
  // Score each question by how well it distinguishes the two signs
  const scoredQuestions = quizQuestions.map(q => {
    const aInOptionA = q.optionA.signs.includes(signA);
    const aInOptionB = q.optionB.signs.includes(signA);
    const bInOptionA = q.optionA.signs.includes(signB);
    const bInOptionB = q.optionB.signs.includes(signB);
    
    // Best case: signA in one option, signB in the other
    let score = 0;
    if ((aInOptionA && bInOptionB) || (aInOptionB && bInOptionA)) {
      score = 3; // Perfect distinguisher
    } else if ((aInOptionA && !bInOptionA) || (aInOptionB && !bInOptionB)) {
      score = 2; // One sign present, other not
    } else if ((aInOptionA || aInOptionB) && (bInOptionA || bInOptionB)) {
      score = 1; // Both present but might still help
    }
    
    return { question: q, score };
  });
  
  // Sort by score and take the top ones
  const sorted = scoredQuestions.sort((a, b) => b.score - a.score);
  return sorted.slice(0, count).map(sq => sq.question);
}

// Calculate quiz results based on answers
export function calculateQuizResult(
  signA: string,
  signB: string,
  answers: Record<string, 'A' | 'B'>
): QuizResult {
  let scoreA = 0;
  let scoreB = 0;
  let totalQuestions = 0;
  
  Object.entries(answers).forEach(([questionId, answer]) => {
    const question = quizQuestions.find(q => q.id === questionId);
    if (!question) return;
    
    totalQuestions++;
    const selectedOption = answer === 'A' ? question.optionA : question.optionB;
    
    if (selectedOption.signs.includes(signA)) scoreA++;
    if (selectedOption.signs.includes(signB)) scoreB++;
  });
  
  const total = scoreA + scoreB;
  const primaryIsA = scoreA >= scoreB;
  
  const primaryScore = primaryIsA ? scoreA : scoreB;
  const secondaryScore = primaryIsA ? scoreB : scoreA;
  
  // Calculate confidence based on score difference
  const scoreDifference = primaryScore - secondaryScore;
  const maxDifference = totalQuestions;
  
  // Base confidence of 50%, plus up to 50% based on score difference
  const confidence = Math.min(100, Math.round(50 + (scoreDifference / maxDifference) * 50));
  
  return {
    primarySign: primaryIsA ? signA : signB,
    secondarySign: primaryIsA ? signB : signA,
    confidence,
    primaryScore,
    secondaryScore
  };
}

// Get all available questions
export function getAllQuestions(): QuizQuestion[] {
  return quizQuestions;
}
