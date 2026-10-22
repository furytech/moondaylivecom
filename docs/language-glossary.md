# Language glossary: translate, never soften

Rule from Martin. Daily content never makes body, health or medical claims, but it also never goes vague to avoid them.
Every medical, clinical or diagnostic term is **replaced by a plain, descriptive phrase that keeps its exact meaning and
function**, described as lived experience (how it feels and how it affects mood, energy and reactions), not as anatomy or
diagnosis.

Do not delete the idea. Do not swap in a stand-in that loses the meaning ("your deeper instincts", "your inner waters",
"your inner critic" are not translations of "nervous system"). Adjust only the grammar to fit the sentence.

| Instead of | Say |
| --- | --- |
| nervous system | "how you take in and process the day's events, and how much they stir or settle your mood" / "your sensitivity to everything coming at you" |
| fight-or-flight, adrenaline, cortisol | "that keyed-up, braced-for-impact feeling" / "your on-alert mode" |
| anxiety (the condition) | "a restless, uneasy worry that's hard to set down" |
| depression (the condition) | "a heavy, low mood that drains your motivation" |
| insomnia | "a restless night where sleep won't come easily" |
| hypochondria | "imagining the worst about your health" / "turning every small twinge into a worst-case story" |
| hormones | "your natural emotional tides" |
| somatic / body tension | "the stress you carry and feel physically" (no body parts added: "tight shoulders" or "a clenched jaw" only if the original line already named them) |
| immune system | "your resilience, your ability to bounce back" |
| circulation, blood flow | "your energy moving freely instead of feeling stuck" |
| clinical phrasing ("bodily hygiene"), in a bathing or washing context only | ritual language: "a simple cleansing ritual" |
| sleep hygiene | "sleep routine" |
| a foot bath | "a warm foot soak scented with eucalyptus, as a ritual of release" |
| metabolize (as a figure for feelings) | "work through", "let it move through you and settle" |
| hand on belly, warm your chest | "rest one hand over your heart as a quiet gesture of kindness to yourself", "let a sense of warmth gather and settle" |

**Allowed as written:** a hand over the heart, a warm bath, a foot soak, slow breathing, scents like eucalyptus or
frankincense, plain self-care ("take a slow walk", "rest early", "drink some water", "stretch").

**No new body.** A rewrite never adds a body part, body region or physical sensation that the original line did not have (no "tight jaw", "clenched shoulders", "upper body", "pelvis"). Only the approved wording may carry a body meaning: "the stress you carry and feel physically" and the hand over the heart. Moving where a held object rests ("against your chest" becomes "as you rest a hand over your heart") is fine.

**Fit, not just words.** A glossary phrase must fit the sentence in grammar and in meaning. "Your sensitivity to everything coming at you" is something you have, not a place: nothing sits "in" it. Use the short noun form wherever a noun fits and the long "how you take in and process the day's events" clause only where a whole clause fits.

**Any term not listed:** follow the same principle. Say what it feels like and what it does to mood, energy and reactions.

## Also in daily content

- US spelling ("favorite", "color", "center", "organize").
- Energy lines never name legs, knees, pulse or heartbeat, and never mention seasons or the weather of the year (the same
  day is a different season for every reader).
- Variety: no opening phrase such as "The day rewards..." starts more than 2 of any 24 lines, and no phrase of five or
  more words repeats in more than 2 of any 24 lines.

## Where it is enforced

- `src/lib/dailyContentGuard.ts`: finds the terms above (and other diagnosis, condition, body-mechanism and clinical
  terms) in generated or stored text. Stored lines that trip it are never shown.
- `scripts/lib/languageGlossary.ts`: the same glossary for prompts, plus the check that a rewrite carries the glossary
  phrase for the term it replaced.
- `scripts/regen-flagged-triads.ts` and `scripts/check-regen-output.ts`: rewrite flagged stored lines with the glossary and
  independently re-check the result.
