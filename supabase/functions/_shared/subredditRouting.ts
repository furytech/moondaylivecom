/**
 * Dynamic astrological Reddit targeting.
 *
 * Each Moon ingress lands in a different room. Technical / earth-and-air heavy
 * ingresses go to the rooms that reward chart mechanics; water and fire signs
 * go where lived experience is the currency. The map is the single source of
 * truth — the dispatcher stamps the result into the payload so nobody picks a
 * channel by hand during a transit shift.
 */

export interface SubredditRoute {
  /** Where the post goes. */
  subreddit: string
  /** Register hint handed to the content engine. */
  register: string
}

const DEFAULT_ROUTE: SubredditRoute = {
  subreddit: 'astrology',
  register: 'technical but readable; assume the reader knows the glyphs',
}

const ROUTES: Record<string, SubredditRoute> = {
  aries: { subreddit: 'astrology', register: 'fast, blunt, action-timing focused' },
  taurus: { subreddit: 'astrology', register: 'concrete, body-and-resource focused' },
  gemini: { subreddit: 'AskAstrologers', register: 'curious, question-led, information tempo' },
  cancer: { subreddit: 'astrology', register: 'reflective, lived-experience led' },
  leo: { subreddit: 'astrology', register: 'expressive, visible-behaviour led' },
  virgo: { subreddit: 'AdvancedAstrology', register: 'precise chart mechanics, condition and reception' },
  libra: { subreddit: 'astrology', register: 'relational, comparison and balance led' },
  scorpio: { subreddit: 'AdvancedAstrology', register: 'depth technique, dignity and aversion' },
  sagittarius: { subreddit: 'astrology', register: 'wide-angle, doctrine and tradition led' },
  capricorn: { subreddit: 'AdvancedAstrology', register: 'Saturnian rigour: timing, boundaries, testable claims' },
  aquarius: { subreddit: 'AdvancedAstrology', register: 'systems thinking, pattern tracking over cycles' },
  pisces: { subreddit: 'astrology', register: 'atmospheric, perceptual, low-certainty language' },
}

/** Normalises whatever the row holds ("Capricorn", "capricorn", null). */
export function resolveSubredditRoute(sign?: string | null): SubredditRoute {
  if (!sign) return DEFAULT_ROUTE
  return ROUTES[sign.trim().toLowerCase()] ?? DEFAULT_ROUTE
}

/** Bare subreddit name, no leading r/. An env override still wins. */
export function resolveSubreddit(sign?: string | null): string {
  const override = Deno.env.get('REDDIT_DEFAULT_SUBREDDIT')?.replace(/^\/?r\//, '').trim()
  if (override) return override
  return resolveSubredditRoute(sign).subreddit
}
