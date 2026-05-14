import {
  SIGN_ELEMENT,
  SIGN_MODALITY,
  type TriadMoon,
  type ZodiacSign,
} from "@/lib/sovereignEngine";

/* ────────────────────────────────────────────────────────────
   Pulse Synthesis — Sign Attributes Library + Dynamic Generators

   Three lenses map to three registers of meaning:
     • Tropical  → Social weather (collective communication)
     • Sidereal  → Internal nervous system (biological + grounding)
     • Draconic  → Soul intent (evolutionary "why")

   Tone: Nouveau-Deco. Sophisticated, precise, sovereign.
   Guardrail: never fear-based, never predictive of misfortune.
   Every alignment is framed as an instrument for learning + balance.
   ──────────────────────────────────────────────────────────── */

export type LensRegister = "tropical" | "sidereal" | "draconic";

export interface LensAttribute {
  /** One-line headline for the expose panel. */
  headline: string;
  /** Two- to three-sentence detail for the expanded view. */
  detail: string;
  /** Single craft-oriented action the reader can practice. */
  practice: string;
}

export type SignAttributeLibrary = Record<
  ZodiacSign,
  Record<LensRegister, LensAttribute>
>;

/* ── The Library ──────────────────────────────────────────── */

export const SIGN_ATTRIBUTES: SignAttributeLibrary = {
  Aries: {
    tropical: {
      headline: "Collective tempo favors initiation.",
      detail:
        "Conversations land cleaner when they begin instead of negotiate. The room rewards the first clear sentence over the most caveated one.",
      practice: "Open the meeting with the verb, not the apology.",
    },
    sidereal: {
      headline: "The nervous system is primed to discharge.",
      detail:
        "Physical energy concentrates near the head and hands. The body wants forward motion; stillness without an outlet becomes friction.",
      practice: "Move once with intent before you sit down to think.",
    },
    draconic: {
      headline: "Soul intent: authorize a beginning only you can name.",
      detail:
        "The underlying vector is toward sovereign initiation — a permission slip you have been waiting to sign for yourself.",
      practice: "Name one thing you will start in your own voice this week.",
    },
  },
  Taurus: {
    tropical: {
      headline: "Collective weather rewards measured pace.",
      detail:
        "The room values tactile, durable work over performative speed. Decisions sealed today tend to hold their shape tomorrow.",
      practice: "Choose the slower option that you can actually keep.",
    },
    sidereal: {
      headline: "Body wants traction, not stimulation.",
      detail:
        "The nervous system regulates through the senses — texture, weight, breath, slow food. Overstimulation reads as static.",
      practice: "Reduce inputs by one channel for the next two hours.",
    },
    draconic: {
      headline: "Soul intent: re-anchor in what is already yours.",
      detail:
        "The pull is toward worth — not earning it, but registering what you already hold and stewarding it without apology.",
      practice: "List three resources (skill, relationship, time) you already own.",
    },
  },
  Gemini: {
    tropical: {
      headline: "Collective conversation moves in short loops.",
      detail:
        "Many small exchanges outperform one long monologue. The room is in scan mode and rewards modular language.",
      practice: "Send the three-sentence note instead of the essay.",
    },
    sidereal: {
      headline: "Nervous system is gathering signal.",
      detail:
        "Lungs and hands lead. Capture quickly and sort later — premature synthesis will feel forced and fail to hold.",
      practice: "Keep an open notebook for the next four hours; do not edit yet.",
    },
    draconic: {
      headline: "Soul intent: name the bridge between two ideas.",
      detail:
        "A connection has been forming under the surface. The day offers a chance to articulate the link without flattening either side.",
      practice: "Write one sentence that begins, 'These two things are related because…'",
    },
  },
  Cancer: {
    tropical: {
      headline: "Collective field is sensitive to belonging.",
      detail:
        "Soft framing carries more weight than data. People are reading tone before content — small acknowledgments compound.",
      practice: "Open with care, then deliver the substance.",
    },
    sidereal: {
      headline: "Nervous system is reading the room.",
      detail:
        "The body is acting as a barometer; the gut is data, not noise. Honor what the feeling reports before you argue with it.",
      practice: "Eat warm. Drink water. Decide after.",
    },
    draconic: {
      headline: "Soul intent: tend the inner room.",
      detail:
        "The pull is toward home as interior architecture — not real estate, but the room inside you that needs lamp light.",
      practice: "Spend ten minutes in the part of your space you keep avoiding.",
    },
  },
  Leo: {
    tropical: {
      headline: "Collective stage favors visible authorship.",
      detail:
        "Own the work in your name. Passive voice and shared credit will read as evasion in this climate, not generosity.",
      practice: "Sign the work. Send it under your own byline.",
    },
    sidereal: {
      headline: "Body regulates through expression.",
      detail:
        "The heart and spine want to be used. Performance — even small, private performance — discharges what would otherwise stagnate.",
      practice: "Speak one paragraph aloud before you write it.",
    },
    draconic: {
      headline: "Soul intent: claim the line that has been waiting.",
      detail:
        "There is a sentence about who you are that you have been almost-saying. The underlying vector is toward stating it plainly.",
      practice: "Finish the sentence: 'I am the one who…'",
    },
  },
  Virgo: {
    tropical: {
      headline: "Collective field rewards refinement.",
      detail:
        "Small calibrations compound into disproportionate clarity. The room values craft today over scale.",
      practice: "Edit one existing thing rather than start a new one.",
    },
    sidereal: {
      headline: "Nervous system is in audit mode.",
      detail:
        "Excellent for editing, punishing for first drafts. The body wants order; give it a small completed loop to settle.",
      practice: "Close one open task fully before opening another.",
    },
    draconic: {
      headline: "Soul intent: useful work as private devotion.",
      detail:
        "The pull is toward service rendered without performance — a quiet competence that needs no audience to be real.",
      practice: "Do one useful thing that no one will see.",
    },
  },
  Libra: {
    tropical: {
      headline: "Collective field asks for proportion.",
      detail:
        "Balance opposing inputs before naming the verdict. The room reads premature certainty as imbalance, not strength.",
      practice: "State both sides aloud before you choose.",
    },
    sidereal: {
      headline: "Nervous system is relational.",
      detail:
        "The body calibrates through other bodies. Decisions made in pure solitude today will need a second pass with another voice.",
      practice: "Run the choice past one person whose taste you trust.",
    },
    draconic: {
      headline: "Soul intent: rebalance an old asymmetry.",
      detail:
        "A quiet correction is available — a relationship, an agreement, or an inner ledger that has been tilted longer than it should have been.",
      practice: "Name the asymmetry. You do not have to fix it today.",
    },
  },
  Scorpio: {
    tropical: {
      headline: "Collective surface runs deeper than it shows.",
      detail:
        "What is unsaid is doing most of the work in the room. Reading subtext is more useful than insisting on the text.",
      practice: "Ask the question whose answer you actually want.",
    },
    sidereal: {
      headline: "Nervous system is concentrating.",
      detail:
        "Depth of focus is available; small talk will cost disproportionately. The body wants the long, single-tracked task.",
      practice: "Block one ninety-minute window of single focus.",
    },
    draconic: {
      headline: "Soul intent: look at what was tactfully averted.",
      detail:
        "The pull is toward an honest gaze at something you have been politely walking around. Truth here is structural, not destructive.",
      practice: "Write one sentence about the thing you keep almost-saying.",
    },
  },
  Sagittarius: {
    tropical: {
      headline: "Collective field widens.",
      detail:
        "Long-range framing lands better than tactical detail. The room is asking for the meaning of the work, not its checklist.",
      practice: "Lead with the why; the how can follow.",
    },
    sidereal: {
      headline: "Nervous system is expansive.",
      detail:
        "Movement — literal walking, or conceptual range — restores signal. Confinement to a single small frame will read as static.",
      practice: "Take the conversation outside, even for ten minutes.",
    },
    draconic: {
      headline: "Soul intent: a wider story is reorganizing the small ones.",
      detail:
        "The underlying vector is toward meaning. Smaller decisions will start to make sense once you name the larger arc they belong to.",
      practice: "Write one sentence describing the arc of this season.",
    },
  },
  Capricorn: {
    tropical: {
      headline: "Collective field rewards structure.",
      detail:
        "Show the architecture, not just the intention. The room trusts visible scaffolding over enthusiastic gesture today.",
      practice: "Diagram the plan in three steps before pitching it.",
    },
    sidereal: {
      headline: "Body is load-bearing.",
      detail:
        "The system can carry weight today — choose what is actually worth carrying. Bones, posture, and patience lead.",
      practice: "Stand up straight and decline one obligation that is not yours.",
    },
    draconic: {
      headline: "Soul intent: long arcs over visible bursts.",
      detail:
        "The pull is toward mastery — quiet, accumulating, unspectacular. The reward is structural, not narrative.",
      practice: "Add one small repetition to the practice you are already building.",
    },
  },
  Aquarius: {
    tropical: {
      headline: "Collective field thinks in systems.",
      detail:
        "Propose the principle, then the example. The room moves faster when it sees the pattern before the instance.",
      practice: "Lead with the rule; demo it once.",
    },
    sidereal: {
      headline: "Nervous system is pattern-seeking.",
      detail:
        "Step back two paces before any close-up decision. The body wants altitude — the wide view will calm what proximity agitates.",
      practice: "Walk away from the screen and look at the whole board.",
    },
    draconic: {
      headline: "Soul intent: private work in service of a larger weave.",
      detail:
        "The pull is toward the collective. What you craft alone today contributes to a fabric you may not yet see in full.",
      practice: "Name the larger weave your work belongs to.",
    },
  },
  Pisces: {
    tropical: {
      headline: "Collective field dissolves edges.",
      detail:
        "Meaning travels through tone, image, and pause. Hard outlines will read as brittle; gradient is more fluent.",
      practice: "Soften the email by one degree before sending.",
    },
    sidereal: {
      headline: "Nervous system is permeable.",
      detail:
        "You will absorb whichever room you sit in. Curate inputs deliberately — environment is medication today, not background.",
      practice: "Choose the room you work from with intention.",
    },
    draconic: {
      headline: "Soul intent: let an old definition soften into the next.",
      detail:
        "The pull is toward dissolution of a self-description that has finished its work. Something is becoming the next thing through you.",
      practice: "Notice one identity-line you no longer need to defend.",
    },
  },
};

/* ── Public accessors ─────────────────────────────────────── */

export function getLensAttribute(
  register: LensRegister,
  sign: ZodiacSign,
): LensAttribute {
  return SIGN_ATTRIBUTES[sign][register];
}

/* ── Synthesis generator ──────────────────────────────────── */

export interface SynthesisResult {
  /** The full Sovereign Synthesis paragraph. */
  body: string;
  /** Short subtitle that classifies the day. */
  subtitle: string;
  /** Optional one-line cue when divergence highlights Sidereal vs Tropical. */
  frictionCue?: string;
}

/**
 * Compose the Sovereign Synthesis from a TriadMoon.
 * Highlights friction between Sidereal (internal) and Tropical (social mask)
 * when they diverge, and frames every configuration as an instrument for
 * learning and balance — never as fortune or warning.
 */
export function generateSynthesis(triad: TriadMoon): SynthesisResult {
  const social = triad.tropical.sign;
  const internal = triad.sidereal.sign;
  const soul = triad.draconic.sign;

  const sameSI = social === internal;
  const sameID = internal === soul;
  const sameSD = social === soul;
  const allSame = sameSI && sameID;

  const socialAttr = SIGN_ATTRIBUTES[social].tropical;
  const internalAttr = SIGN_ATTRIBUTES[internal].sidereal;
  const soulAttr = SIGN_ATTRIBUTES[soul].draconic;

  // Unified — all three lenses agree.
  if (allSame) {
    return {
      subtitle: `Unified in ${social}`,
      body: `All three lenses converge in ${social}. The social atmosphere, the internal nervous system, and the underlying soul-vector are speaking one language — a rare clean channel. ${socialAttr.headline} ${internalAttr.headline.toLowerCase()} Move with measured confidence; refinement matters more than novelty today.`,
    };
  }

  // Internal + Soul agree, social diverges.
  if (sameID && !sameSI) {
    return {
      subtitle: `Inner accord · ${internal}`,
      body: `The internal system and the soul's intent both move in ${internal}, while the social atmosphere wears ${social}. ${internalAttr.headline} ${soulAttr.headline} Underneath, a quiet certainty is forming that does not need to perform itself outwardly. Let the room have its weather; keep your craft.`,
      frictionCue: `Outer ${social} · Inner ${internal} — the mask and the wiring differ.`,
    };
  }

  // Social + Internal agree, soul diverges.
  if (sameSI && !sameID) {
    return {
      subtitle: `Outer accord · ${social}`,
      body: `Outside and inside both wear ${social} — the room and the nervous system rhyme. The soul, however, is reaching toward ${soul}. ${socialAttr.headline} ${soulAttr.headline} The day will feel coherent and productive, with a low, persistent pull toward something the schedule does not name. Honor it after the work is done.`,
    };
  }

  // Social + Soul agree, internal diverges.
  if (sameSD && !sameSI) {
    return {
      subtitle: `Direction agrees · ${social}`,
      body: `The social atmosphere and the soul's vector both share ${social}, framing an internal system tuned to ${internal}. ${socialAttr.headline} ${internalAttr.headline} Public action and deeper direction agree; the friction is technical, not directional. Adjust the instrument, not the song.`,
      frictionCue: `Outer ${social} · Inner ${internal} — adjust cadence, not course.`,
    };
  }

  // Fully divergent — three different signs. Foreground Sidereal vs Tropical friction.
  const elInternal = SIGN_ELEMENT[internal];
  const elSocial = SIGN_ELEMENT[social];
  const sharedElement = elInternal === elSocial;
  const modInternal = SIGN_MODALITY[internal];
  const modSocial = SIGN_MODALITY[social];

  const translation = sharedElement
    ? `Both registers share an elemental key (${elInternal}), so the friction is tempo rather than translation — the inner ${modInternal} pulse meets an outer ${modSocial} cadence. Match cadence and the day opens.`
    : `Two distinct elements are at play (${elInternal} inside, ${elSocial} outside), so the work is translation: render internal motion in a vocabulary the room can receive.`;

  return {
    subtitle: "Divergent Alignment · Layered Navigation",
    body: `An internal ${internal} signal meets an external ${social} climate, with the soul angling toward ${soul}. ${internalAttr.headline} ${socialAttr.headline} ${translation} Treat divergence as instrumentation, not obstacle — three registers give you three honest places to stand.`,
    frictionCue: `Social mask: ${social} · Internal system: ${internal}. Translate, do not collapse.`,
  };
}
