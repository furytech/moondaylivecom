export interface TransitFAQ {
  question: string;
  answer: string;
}

export interface TransitFAQData {
  sign: string;
  slug: string;
  faqs: TransitFAQ[];
}

export const transitFAQs: TransitFAQData[] = [
  {
    sign: 'Aries',
    slug: 'aries',
    faqs: [
      {
        question: 'What does Moon in Aries mean?',
        answer: 'Moon in Aries marks one of the most energetically charged transits in the lunar cycle — a 2.5-day window when collective emotional energy shifts toward action, initiation, and bold instinct. The moon moves fastest through Aries, amplifying urgency and the impulse to begin things that have been postponed.',
      },
      {
        question: 'How does Moon in Aries affect emotions and behavior?',
        answer: 'During Moon in Aries, emotional responses tend to be immediate, unfiltered, and short-lived — frustration flares quickly but rarely lingers. You may notice a lower tolerance for ambiguity and a stronger pull toward making decisions rather than deliberating. This is the transit most associated with courage that surprises even the person feeling it.',
      },
      {
        question: 'What should I focus on during Moon in Aries?',
        answer: 'Moon in Aries is the optimal window for launching, initiating, and breaking inertia on projects that have stalled. Physical movement — especially competitive or high-intensity activity — channels the transit\'s charge productively. Avoid locking in long-term commitments made purely in the heat of the moment.',
      },
    ],
  },
  {
    sign: 'Taurus',
    slug: 'taurus',
    faqs: [
      {
        question: 'What does Moon in Taurus mean?',
        answer: 'Moon in Taurus is considered the moon\'s strongest placement — it\'s where lunar energy settles, stabilizes, and produces its most grounded expression. This 2.5-day transit slows the emotional pace and draws attention toward what is dependable, sensory, and real.',
      },
      {
        question: 'How does Moon in Taurus affect emotions and behavior?',
        answer: 'Emotional steadiness characterizes Moon in Taurus — people tend to be more patient, less reactive, and more anchored in the body. Comfort becomes a genuine need rather than a preference, and there\'s often a pull toward familiar pleasures: food, nature, music, or physical rest. Resistance to change runs high during this transit.',
      },
      {
        question: 'What should I focus on during Moon in Taurus?',
        answer: 'Moon in Taurus rewards slowing down — this is the best transit for financial decisions, creative work that requires patience, and deepening existing relationships. Grounding practices like cooking, gardening, or time outside amplify the transit\'s stabilizing quality. Pushing against resistance during Taurus Moon rarely works; building steadily does.',
      },
    ],
  },
  {
    sign: 'Gemini',
    slug: 'gemini',
    faqs: [
      {
        question: 'What does Moon in Gemini mean?',
        answer: 'Moon in Gemini accelerates the mental and social dimensions of emotional life — this 2.5-day transit brings curiosity, conversational energy, and a tendency to process feelings through intellect, dialogue, and idea exchange.',
      },
      {
        question: 'How does Moon in Gemini affect emotions and behavior?',
        answer: 'During Moon in Gemini, emotional experience becomes more intellectual — feelings get analyzed, communicated, and categorized rather than simply felt. Attention scatters across multiple interests simultaneously, and social stimulation feels necessary rather than optional. Decision-making can suffer as the mind weighs too many variables at once.',
      },
      {
        question: 'What should I focus on during Moon in Gemini?',
        answer: 'Moon in Gemini is the strongest transit for writing, pitching ideas, networking, and any work requiring verbal precision. Scheduling important conversations here tends to produce more articulate outcomes than during water or earth moon transits. Give yourself permission for the scattered energy — trying to force singular focus during Gemini Moon is working against the current.',
      },
    ],
  },
  {
    sign: 'Cancer',
    slug: 'cancer',
    faqs: [
      {
        question: 'What does Moon in Cancer mean?',
        answer: 'Moon in Cancer is the moon\'s home sign — this transit produces the most emotionally sensitive, inward-turning, and memory-rich 2.5 days of the lunar cycle. Feelings run deeper and closer to the surface, and the pull toward home, family, and belonging becomes paramount.',
      },
      {
        question: 'How does Moon in Cancer affect emotions and behavior?',
        answer: 'During Moon in Cancer, intuition heightens and defensive shells soften or thicken depending on safety. Moods ebb and flow like tides, and nostalgia often surfaces. There is a primal need for sanctuary, comfort food, and quiet emotional reassurance.',
      },
      {
        question: 'What should I focus on during Moon in Cancer?',
        answer: 'Moon in Cancer is ideal for restorative self-care, intimate home gatherings, cooking nourishing meals, and processing lingering feelings. Clear your calendar of abrasive social demands and prioritize psychological safety and emotional replenishment.',
      },
    ],
  },
  {
    sign: 'Leo',
    slug: 'leo',
    faqs: [
      {
        question: 'What does Moon in Leo mean?',
        answer: 'Moon in Leo shifts the emotional climate into warm self-expression, creativity, and heartfelt vitality. Over these 2.5 days, the collective mood seeks celebration, play, and authentic recognition.',
      },
      {
        question: 'How does Moon in Leo affect emotions and behavior?',
        answer: 'Emotions become generous, dramatic, and expressive. People crave genuine appreciation and feel motivated to share their talents. When wounded, pride flares quickly, but forgiveness comes easily when met with warmth and respect.',
      },
      {
        question: 'What should I focus on during Moon in Leo?',
        answer: 'Focus on creative self-expression, romantic gestures, presenting your work, and spending time with loved ones who appreciate your light. Avoid seeking validation from critics; channel your energy into generative joy.',
      },
    ],
  },
  {
    sign: 'Virgo',
    slug: 'virgo',
    faqs: [
      {
        question: 'What does Moon in Virgo mean?',
        answer: 'Moon in Virgo directs emotional energy toward discernment, practical service, and somatic alignment. This 2.5-day transit grounds the mind in daily rituals, organization, and refinement.',
      },
      {
        question: 'How does Moon in Virgo affect emotions and behavior?',
        answer: 'Emotional fulfillment comes through order and competence. You may notice heightened sensitivity to physical clutter or bodily tension. The impulse to fix, edit, or critique increases, which can create anxiety if perfectionism takes over.',
      },
      {
        question: 'What should I focus on during Moon in Virgo?',
        answer: 'Focus on decluttering your physical environment, meal prepping, streamlining work systems, and gentle somatic health practices. Channel the analytical focus into practical care rather than harsh self-judgment.',
      },
    ],
  },
  {
    sign: 'Libra',
    slug: 'libra',
    faqs: [
      {
        question: 'What does Moon in Libra mean?',
        answer: 'Moon in Libra centers on relational harmony, aesthetic balance, and mutual understanding. Over these 2.5 days, the emotional compass calibrates to partnership, justice, and beauty.',
      },
      {
        question: 'How does Moon in Libra affect emotions and behavior?',
        answer: 'Feelings are experienced through the mirror of relationship. There is a natural aversion to conflict and a strong drive toward compromise. Indecision can peak as you balance competing perspectives.',
      },
      {
        question: 'What should I focus on during Moon in Libra?',
        answer: 'Focus on collaborative work, mediating disputes, beautifying your living or workspace, and meaningful one-on-one connections. Practice making firm decisions without needing everyone\'s approval first.',
      },
    ],
  },
  {
    sign: 'Scorpio',
    slug: 'scorpio',
    faqs: [
      {
        question: 'What does Moon in Scorpio mean?',
        answer: 'Moon in Scorpio draws emotional currents into the deep waters of truth, psychological insight, and transformation. This 2.5-day window asks for emotional honesty and the courage to look beneath surfaces.',
      },
      {
        question: 'How does Moon in Scorpio affect emotions and behavior?',
        answer: 'Feelings run intense, private, and fiercely loyal. Superficial pleasantries feel exhausting. Intuition and suspicion both rise, and long-buried emotional truths often emerge to be processed and released.',
      },
      {
        question: 'What should I focus on during Moon in Scorpio?',
        answer: 'Focus on deep focused research, shadow work, honest emotional intimacy, and releasing outworn attachments. Honor your need for privacy and avoid power struggles.',
      },
    ],
  },
  {
    sign: 'Sagittarius',
    slug: 'sagittarius',
    faqs: [
      {
        question: 'What does Moon in Sagittarius mean?',
        answer: 'Moon in Sagittarius lifts the emotional frequency toward optimism, philosophical expansion, and wanderlust. This 2.5-day transit recharges hope and encourages looking at the broader horizon.',
      },
      {
        question: 'How does Moon in Sagittarius affect emotions and behavior?',
        answer: 'Emotional energy turns adventurous, blunt, and buoyant. Routine feels confining, and the desire for freedom, laughter, and exploration dominates. People speak with unguarded directness.',
      },
      {
        question: 'What should I focus on during Moon in Sagittarius?',
        answer: 'Focus on learning, outdoor exploration, travel planning, publishing, and philosophical contemplation. Be mindful of making promises larger than your bandwidth can sustain.',
      },
    ],
  },
  {
    sign: 'Capricorn',
    slug: 'capricorn',
    faqs: [
      {
        question: 'What does Moon in Capricorn mean?',
        answer: 'Moon in Capricorn calls emotional energy into mastery, containment, and long-term architectural building. Over these 2.5 days, emotional maturity and practical commitments take center stage.',
      },
      {
        question: 'How does Moon in Capricorn affect emotions and behavior?',
        answer: 'Emotions are held with quiet dignity and pragmatic composure. Vulnerability is shared selectively. There is satisfaction in responsibility, structure, and tangible progress toward enduring goals.',
      },
      {
        question: 'What should I focus on during Moon in Capricorn?',
        answer: 'Focus on setting boundaries, strategic career planning, completing demanding structural tasks, and honoring commitments. Remember that self-discipline is a form of care, but allow space for rest.',
      },
    ],
  },
  {
    sign: 'Aquarius',
    slug: 'aquarius',
    faqs: [
      {
        question: 'What does Moon in Aquarius mean?',
        answer: 'Moon in Aquarius broadens emotional perception into intellectual detachment, collective vision, and radical authenticity. Over these 2.5 days, the mind questions convention and seeks innovative paths.',
      },
      {
        question: 'How does Moon in Aquarius affect emotions and behavior?',
        answer: 'Feelings are processed through an objective, bird\'s-eye perspective. You may feel a need for physical or emotional space alongside a deep dedication to group causes, friendships, and community.',
      },
      {
        question: 'What should I focus on during Moon in Aquarius?',
        answer: 'Focus on community organizing, technological innovation, brainstorming future visions, and connecting with kindred spirits. Embrace your eccentricities without needing to conform.',
      },
    ],
  },
  {
    sign: 'Pisces',
    slug: 'pisces',
    faqs: [
      {
        question: 'What does Moon in Pisces mean?',
        answer: 'Moon in Pisces closes the zodiac wheel in oceanic empathy, imagination, and spiritual dissolution. This 2.5-day transit softens psychological boundaries and awakens the dream realm.',
      },
      {
        question: 'How does Moon in Pisces affect emotions and behavior?',
        answer: 'Sensitivity to external environments and collective feelings reaches its peak. Logic yields to intuition, poetry, and symbolic resonance. Escapist urges can arise when material demands feel harsh.',
      },
      {
        question: 'What should I focus on during Moon in Pisces?',
        answer: 'Focus on artistic creation, meditation, music, dream journaling, and restorative surrender. Protect your energetic boundaries with gentle, grounded practices.',
      },
    ],
  },
];

export function getFAQsBySlug(slug: string): TransitFAQ[] {
  if (!slug) return [];
  const normalized = slug.toLowerCase().trim();
  const entry = transitFAQs.find(
    (item) => item.slug === normalized || item.sign.toLowerCase() === normalized
  );
  return entry ? entry.faqs : [];
}
