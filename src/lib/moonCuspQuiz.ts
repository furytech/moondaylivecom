/**
 * Moonday Moon Cusp Quiz: question bank
 * For people born on a day the Moon changed signs (a "Moon-change day").
 *
 * Every sign pair has its own five questions. All questions are about the Moon:
 * emotional needs, self-soothing, safety, how feelings move, how you give care.
 * In each question, `earlier` supports the sign the Moon was leaving and `later`
 * supports the sign it was entering. Shuffle the two options' display order per
 * question so neither side always appears first.
 *
 * Scoring (see scoreCuspQuiz below):
 *  1. Prior: the share of the person's local birth day (in THEIR timezone) that the
 *     Moon spent in each sign. Ingress at 02:00 local => ~8% earlier / ~92% later.
 *  2. Each answer doubles the odds toward the sign it supports.
 *  3. Result >= 0.75 for one sign => "clear". Otherwise => "close": show both signs
 *     and let the person choose the one that feels like home (Moonday's cusp principle:
 *     show both, invite reflection, never silently guess).
 */

export type MoonSign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
  | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export interface CuspQuestion {
  id: string;
  theme: string;
  prompt: string;
  /** Supports the sign the Moon was leaving */
  earlier: string;
  /** Supports the sign the Moon was entering */
  later: string;
}

export interface CuspPair {
  from: MoonSign;
  to: MoonSign;
  /** One-line astrological contrast, for internal reference and optional display */
  contrast: string;
  questions: CuspQuestion[];
}

export const MOON_NEEDS: Record<MoonSign, string> = 
{
  "Aries": "independence and immediacy",
  "Taurus": "comfort and steadiness",
  "Gemini": "conversation and variety",
  "Cancer": "belonging and a safe nest",
  "Leo": "warmth and being seen",
  "Virgo": "order and usefulness",
  "Libra": "harmony and partnership",
  "Scorpio": "depth and trust",
  "Sagittarius": "freedom and meaning",
  "Capricorn": "self-reliance and structure",
  "Aquarius": "space and kindred spirits",
  "Pisces": "gentleness and quiet escape"
};

export const MOON_CUSP_PAIRS: Record<string, CuspPair> = {
  "Aries-Taurus": {
    from: "Aries",
    to: "Taurus",
    contrast: "Aries: cardinal fire, a Moon that needs independence and immediacy. Taurus: fixed earth, a Moon that needs comfort and steadiness.",
    questions: [
      { id: "aries-taurus-1", theme: "Soothing",
        prompt: "When something upsets you, what actually helps you feel better?",
        earlier: "Doing something about it right away. Moving, acting, getting it out of my system.",
        later: "Slowing down. A good meal, a warm blanket, familiar comforts until it passes." },
      { id: "aries-taurus-2", theme: "Mood rhythm",
        prompt: "How do your moods usually move?",
        earlier: "Fast. A feeling flares up hot and is often gone an hour later.",
        later: "Slowly. It takes a lot to upset me, and once I am, it takes a while to let go." },
      { id: "aries-taurus-3", theme: "Safety",
        prompt: "What makes you feel emotionally safe?",
        earlier: "Freedom to do things my own way, on my own timeline.",
        later: "Stability. Knowing what to expect and that the basics are taken care of." },
      { id: "aries-taurus-4", theme: "Care",
        prompt: "When someone you love is hurting, your first instinct is to...",
        earlier: "Jump in and help them fight back or fix it.",
        later: "Be a steady presence. Bring food, sit with them, stay calm." },
      { id: "aries-taurus-5", theme: "Drain",
        prompt: "Which drains you more?",
        earlier: "Waiting around with nothing happening.",
        later: "Sudden changes to plans I'd already settled into." },
    ],
  },
  "Taurus-Gemini": {
    from: "Taurus",
    to: "Gemini",
    contrast: "Taurus: fixed earth, a Moon that needs comfort and steadiness. Gemini: mutable air, a Moon that needs conversation and variety.",
    questions: [
      { id: "taurus-gemini-1", theme: "Soothing",
        prompt: "When you're upset, what brings you back to yourself?",
        earlier: "Comfort for my body. Food, rest, touch, time in nature.",
        later: "Talking it through, reading or writing until I understand it." },
      { id: "taurus-gemini-2", theme: "Safety",
        prompt: "What does emotional security look like for you?",
        earlier: "Things staying steady. Same people, same places, same routines.",
        later: "Options and variety, and someone to talk to about anything." },
      { id: "taurus-gemini-3", theme: "Processing",
        prompt: "How do you take in a strong feeling?",
        earlier: "I feel it in my body first, quietly, before I can name it.",
        later: "I need to put it into words. I'm not sure what I feel until I say it." },
      { id: "taurus-gemini-4", theme: "Restlessness",
        prompt: "How long can you enjoy the same comforts?",
        earlier: "A long time. Familiar things keep feeling good.",
        later: "Not long. I get restless and need something new to feel like myself." },
      { id: "taurus-gemini-5", theme: "Care",
        prompt: "How do you most naturally show care?",
        earlier: "Practical comfort. Cooking, small gifts, physical affection.",
        later: "Conversation. Checking in, sending messages, sharing ideas and jokes." },
    ],
  },
  "Gemini-Cancer": {
    from: "Gemini",
    to: "Cancer",
    contrast: "Gemini: mutable air, a Moon that needs conversation and variety. Cancer: cardinal water, a Moon that needs belonging and a safe nest.",
    questions: [
      { id: "gemini-cancer-1", theme: "Soothing",
        prompt: "When you're upset, you tend to...",
        earlier: "Talk it out or distract myself with something interesting.",
        later: "Retreat to home, or to the people who feel like family." },
      { id: "gemini-cancer-2", theme: "Home",
        prompt: "What does home mean to you?",
        earlier: "A base to come and go from. I like being out and about.",
        later: "My sanctuary. It's where I recharge and feel most like myself." },
      { id: "gemini-cancer-3", theme: "Memory",
        prompt: "How do you relate to the past?",
        earlier: "I look ahead more than back. The past doesn't hold me much.",
        later: "I'm sentimental. I keep things, remember details, and feel the past strongly." },
      { id: "gemini-cancer-4", theme: "Processing",
        prompt: "When a strong feeling arrives...",
        earlier: "I can look at it almost from the outside and think it through.",
        later: "It washes over me, and I have to feel it before I can think about it." },
      { id: "gemini-cancer-5", theme: "Care",
        prompt: "How do you take care of the people you love?",
        earlier: "I keep them company with talk, humor, and news.",
        later: "I nurture and protect them. I want to look after them." },
    ],
  },
  "Cancer-Leo": {
    from: "Cancer",
    to: "Leo",
    contrast: "Cancer: cardinal water, a Moon that needs belonging and a safe nest. Leo: fixed fire, a Moon that needs warmth and being seen.",
    questions: [
      { id: "cancer-leo-1", theme: "Hurt",
        prompt: "When your feelings are hurt, you usually...",
        earlier: "Pull back into my shell and keep it to myself for a while.",
        later: "Need it acknowledged. Being ignored hurts more than the problem itself." },
      { id: "cancer-leo-2", theme: "Fuel",
        prompt: "What fills you up emotionally?",
        earlier: "Feeling needed and close to my inner circle.",
        later: "Feeling appreciated and seen for who I really am." },
      { id: "cancer-leo-3", theme: "Affection",
        prompt: "How do you show affection?",
        earlier: "Quiet caretaking. I tend to people behind the scenes.",
        later: "Big and warm. I like to celebrate people and make a fuss." },
      { id: "cancer-leo-4", theme: "Mood rhythm",
        prompt: "How do your moods move?",
        earlier: "They ebb and flow. I can be up and down like the tides.",
        later: "Mostly steady and sunny, and I don't like letting people see me low." },
      { id: "cancer-leo-5", theme: "Safety",
        prompt: "What makes you feel secure?",
        earlier: "Home, family, and familiar people around me.",
        later: "Being respected and having room to shine." },
    ],
  },
  "Leo-Virgo": {
    from: "Leo",
    to: "Virgo",
    contrast: "Leo: fixed fire, a Moon that needs warmth and being seen. Virgo: mutable earth, a Moon that needs order and usefulness.",
    questions: [
      { id: "leo-virgo-1", theme: "Soothing",
        prompt: "When you're stressed, what steadies you?",
        earlier: "Something that lifts my spirits. Creating, playing, or being with people who adore me.",
        later: "Cleaning, organizing, or fixing something until I feel in control again." },
      { id: "leo-virgo-2", theme: "Care",
        prompt: "How do you show love?",
        earlier: "Generous gestures and wholehearted affection.",
        later: "Practical help. I notice what someone needs and quietly do it." },
      { id: "leo-virgo-3", theme: "Inner voice",
        prompt: "What does your inner voice sound like most days?",
        earlier: "Encouraging. I believe in myself even when things are hard.",
        later: "Critical. I notice every flaw, especially my own." },
      { id: "leo-virgo-4", theme: "Need",
        prompt: "What do you most need to feel okay?",
        earlier: "To feel special and wholeheartedly appreciated.",
        later: "To feel useful and know things are in order." },
      { id: "leo-virgo-5", theme: "Hurt",
        prompt: "What stings the most?",
        earlier: "Being overlooked or not taken seriously.",
        later: "Things going wrong because someone was careless." },
    ],
  },
  "Virgo-Libra": {
    from: "Virgo",
    to: "Libra",
    contrast: "Virgo: mutable earth, a Moon that needs order and usefulness. Libra: cardinal air, a Moon that needs harmony and partnership.",
    questions: [
      { id: "virgo-libra-1", theme: "Soothing",
        prompt: "When you're upset, your first move is to...",
        earlier: "Make a list, tidy up, and solve the practical part.",
        later: "Reach out to someone close. I feel better once I'm connected." },
      { id: "virgo-libra-2", theme: "Conflict",
        prompt: "When something is off between you and someone else...",
        earlier: "I'd rather name the problem and fix it, even if it's awkward.",
        later: "The tension unsettles me until things feel balanced again." },
      { id: "virgo-libra-3", theme: "Peace",
        prompt: "What brings you inner peace?",
        earlier: "Order, and things working the way they should.",
        later: "Beauty, balance, and being on good terms with people." },
      { id: "virgo-libra-4", theme: "Processing",
        prompt: "How do you make sense of your feelings?",
        earlier: "Privately. I sort and analyze them on my own.",
        later: "Through other people. Talking, comparing notes, reflecting together." },
      { id: "virgo-libra-5", theme: "Care",
        prompt: "How do you take care of someone?",
        earlier: "Helping in practical, detailed ways.",
        later: "Being a good partner. Attentive, fair, making things pleasant." },
    ],
  },
  "Libra-Scorpio": {
    from: "Libra",
    to: "Scorpio",
    contrast: "Libra: cardinal air, a Moon that needs harmony and partnership. Scorpio: fixed water, a Moon that needs depth and trust.",
    questions: [
      { id: "libra-scorpio-1", theme: "Closeness",
        prompt: "What do you want most in a close relationship?",
        earlier: "Ease, fairness, and keeping things pleasant.",
        later: "Depth and total honesty, even when it gets intense." },
      { id: "libra-scorpio-2", theme: "Trust",
        prompt: "How does trust work for you?",
        earlier: "I give people the benefit of the doubt fairly easily.",
        later: "Trust is earned slowly, and once broken it's very hard to rebuild." },
      { id: "libra-scorpio-3", theme: "Hurt",
        prompt: "When you're hurt, you usually...",
        earlier: "Smooth it over and try to restore the balance.",
        later: "Go quiet, feel it deeply, and don't easily forget." },
      { id: "libra-scorpio-4", theme: "Privacy",
        prompt: "How much of your inner life do people see?",
        earlier: "Quite a lot. I like talking things through together.",
        later: "Very little. Few people know what's really going on inside." },
      { id: "libra-scorpio-5", theme: "Drain",
        prompt: "Which drains you more?",
        earlier: "Ongoing tension, rudeness, or ugliness around me.",
        later: "Shallow connection, small talk, or sensing someone is hiding something." },
    ],
  },
  "Scorpio-Sagittarius": {
    from: "Scorpio",
    to: "Sagittarius",
    contrast: "Scorpio: fixed water, a Moon that needs depth and trust. Sagittarius: mutable fire, a Moon that needs freedom and meaning.",
    questions: [
      { id: "scorpio-sagittarius-1", theme: "Heavy feelings",
        prompt: "When a heavy feeling hits, you...",
        earlier: "Go all the way into it until I reach the bottom.",
        later: "Look for the bright side, a laugh, or a change of scene." },
      { id: "scorpio-sagittarius-2", theme: "Safety",
        prompt: "What makes you feel emotionally safe?",
        earlier: "A few deeply trusted people who know everything about me.",
        later: "Freedom. Room to move, travel, and not feel tied down." },
      { id: "scorpio-sagittarius-3", theme: "Intensity",
        prompt: "How intense are your emotions?",
        earlier: "All-or-nothing. When I feel something, I feel it completely.",
        later: "Hot but light. I feel things strongly and bounce back quickly." },
      { id: "scorpio-sagittarius-4", theme: "Betrayal",
        prompt: "When someone lets you down badly...",
        earlier: "I remember, and it changes things for good.",
        later: "I'd rather move on and look forward." },
      { id: "scorpio-sagittarius-5", theme: "Restoring",
        prompt: "What restores you?",
        earlier: "Solitude and deep reflection.",
        later: "Adventure, learning, big ideas, the open road." },
    ],
  },
  "Sagittarius-Capricorn": {
    from: "Sagittarius",
    to: "Capricorn",
    contrast: "Sagittarius: mutable fire, a Moon that needs freedom and meaning. Capricorn: cardinal earth, a Moon that needs self-reliance and structure.",
    questions: [
      { id: "sagittarius-capricorn-1", theme: "Soothing",
        prompt: "When you're upset, you tend to...",
        earlier: "Get out. A walk, a trip, a new idea, a good laugh.",
        later: "Get to work. I steady myself by being productive." },
      { id: "sagittarius-capricorn-2", theme: "Expression",
        prompt: "How do you show your emotions?",
        earlier: "Openly. I wear my heart on my sleeve.",
        later: "Carefully. I keep my feelings under control, especially in public." },
      { id: "sagittarius-capricorn-3", theme: "Safety",
        prompt: "What makes you feel secure?",
        earlier: "Freedom, and something to look forward to.",
        later: "Being self-reliant and having a plan." },
      { id: "sagittarius-capricorn-4", theme: "Childhood",
        prompt: "Thinking back to childhood, you were more...",
        earlier: "Restless and curious. I wanted to explore.",
        later: "Responsible. I grew up fast." },
      { id: "sagittarius-capricorn-5", theme: "Outlook",
        prompt: "When something worries you, your instinct is...",
        earlier: "It'll work out. Something good is around the corner.",
        later: "Prepare for the worst. Once I'm ready for it, I can relax." },
    ],
  },
  "Capricorn-Aquarius": {
    from: "Capricorn",
    to: "Aquarius",
    contrast: "Capricorn: cardinal earth, a Moon that needs self-reliance and structure. Aquarius: fixed air, a Moon that needs space and kindred spirits.",
    questions: [
      { id: "capricorn-aquarius-1", theme: "Soothing",
        prompt: "When you're upset, you...",
        earlier: "Push through and handle my responsibilities.",
        later: "Step back and look at it from a distance, almost objectively." },
      { id: "capricorn-aquarius-2", theme: "Belonging",
        prompt: "Where do you feel you belong?",
        earlier: "With family, tradition, and structures I can rely on.",
        later: "With friends and kindred spirits more than tradition." },
      { id: "capricorn-aquarius-3", theme: "Need",
        prompt: "What do you need in order to feel okay?",
        earlier: "To feel competent and in control of my life.",
        later: "To feel free to be myself, even if that's unusual." },
      { id: "capricorn-aquarius-4", theme: "Closeness",
        prompt: "How do you do closeness?",
        earlier: "I show love through reliability and providing.",
        later: "I need space even when I'm close to someone. I connect as a friend first." },
      { id: "capricorn-aquarius-5", theme: "Drain",
        prompt: "Which drains you more?",
        earlier: "Chaos, unreliability, things left undone.",
        later: "Pressure to conform or fit someone else's mold." },
    ],
  },
  "Aquarius-Pisces": {
    from: "Aquarius",
    to: "Pisces",
    contrast: "Aquarius: fixed air, a Moon that needs space and kindred spirits. Pisces: mutable water, a Moon that needs gentleness and quiet escape.",
    questions: [
      { id: "aquarius-pisces-1", theme: "Others' feelings",
        prompt: "When people around you are upset...",
        earlier: "I can stay calm and see things objectively.",
        later: "I absorb their mood almost like a sponge." },
      { id: "aquarius-pisces-2", theme: "Soothing",
        prompt: "When you're upset, you tend to...",
        earlier: "Think it through rationally and detach a little.",
        later: "Withdraw into music, art, sleep, or quiet." },
      { id: "aquarius-pisces-3", theme: "Compassion",
        prompt: "Where does your compassion go first?",
        earlier: "To people as a whole. Causes and the bigger picture.",
        later: "To whoever is in front of me, sometimes more than is good for me." },
      { id: "aquarius-pisces-4", theme: "Boundaries",
        prompt: "Your emotional boundaries are...",
        earlier: "Clear. I need my independence.",
        later: "Soft. I tend to merge with the people I love." },
      { id: "aquarius-pisces-5", theme: "Inner world",
        prompt: "What does your inner world mostly hold?",
        earlier: "Ideas, theories, and visions of the future.",
        later: "Feelings, images, intuitions, and daydreams." },
    ],
  },
  "Pisces-Aries": {
    from: "Pisces",
    to: "Aries",
    contrast: "Pisces: mutable water, a Moon that needs gentleness and quiet escape. Aries: cardinal fire, a Moon that needs independence and immediacy.",
    questions: [
      { id: "pisces-aries-1", theme: "Hurt",
        prompt: "When you're hurt, you...",
        earlier: "Take it in, retreat, and need quiet time to recover.",
        later: "React quickly. I'd rather confront it than stew." },
      { id: "pisces-aries-2", theme: "Mood rhythm",
        prompt: "Your moods are usually...",
        earlier: "Subtle and shifting, shaped by my surroundings.",
        later: "Direct. I know what I feel and it shows." },
      { id: "pisces-aries-3", theme: "Need",
        prompt: "What do you need most when life is hard?",
        earlier: "Gentleness, understanding, and permission to drift for a while.",
        later: "Independence, and a challenge to rise to." },
      { id: "pisces-aries-4", theme: "Conflict",
        prompt: "When there's conflict...",
        earlier: "I avoid it or go along to keep the peace.",
        later: "I face it head-on and clear the air." },
      { id: "pisces-aries-5", theme: "Restoring",
        prompt: "What restores you?",
        earlier: "Solitude, water, music, or a creative or spiritual escape.",
        later: "Movement. Exercise, a project, something new to start." },
    ],
  },
};

export function getCuspPair(from: MoonSign, to: MoonSign): CuspPair | undefined {
  return MOON_CUSP_PAIRS[`${from}-${to}`];
}

/** Front-end copy. Placeholders: {from} {to} {date} {time} {sign} {other} {need} */
export const CUSP_COPY = {
  intro: {
    eyebrow: "Moon-change birthday",
    headline: "The Moon changed signs on the day you were born.",
    body:
      "On {date}, the Moon left {from} and entered {to} at {time} your time. " +
      "Without a birth time, most astrology sites quietly pick one and hope. We don't guess. " +
      "These five questions were written for the {from}–{to} crossing alone. They ask about " +
      "your emotional instincts, the part of you the Moon governs, so you can anchor your true Lunar Signature.",
    cta: "Find my Moon",
    note: "About a minute. You can retake it anytime from your Account page.",
  },
  resultClear: {
    headline: "Your Moon is in {sign}.",
    body: "Your answers point clearly to {sign}: a Moon that needs {need}.",
  },
  resultClose: {
    headline: "You're a {from}–{to} Moon.",
    body:
      "Your answers lean {sign}, but your {other} side came through too. That's common on a " +
      "crossing day. Read both and choose the one that feels like home.",
    chooseSign: "{sign} feels like me",
  },
};

export interface CuspScore {
  probabilityEarlier: number; // 0..1
  probabilityLater: number;   // 0..1
  leading: MoonSign;
  other: MoonSign;
  certainty: "clear" | "close";
}

/**
 * @param pair the sign pair for this birthday
 * @param fractionOfDayBeforeIngress share (0..1) of the person's LOCAL birth day before the Moon changed sign
 * @param answers one entry per answered question: "earlier" | "later"
 */
export function scoreCuspQuiz(
  pair: CuspPair,
  fractionOfDayBeforeIngress: number,
  answers: Array<"earlier" | "later">,
): CuspScore {
  const prior = Math.min(0.97, Math.max(0.03, fractionOfDayBeforeIngress));
  let odds = prior / (1 - prior); // odds in favour of the earlier sign
  for (const a of answers) odds *= a === "earlier" ? 2 : 0.5;
  const pEarlier = odds / (1 + odds);
  const leadingEarlier = pEarlier >= 0.5;
  const pLead = leadingEarlier ? pEarlier : 1 - pEarlier;
  return {
    probabilityEarlier: pEarlier,
    probabilityLater: 1 - pEarlier,
    leading: leadingEarlier ? pair.from : pair.to,
    other: leadingEarlier ? pair.to : pair.from,
    certainty: pLead >= 0.75 ? "clear" : "close",
  };
}
