// Share links for a member's own Moon sign. The link carries only the sign: no birthday, no name,
// no combination content. Pure on purpose: the page, the member's share screen and the build-time
// prerender (scripts/prerender-seo.mjs) all use it.

import { SITE_URL, ZODIAC_SIGNS, canonicalUrl } from "./seo.js";
import { getMoonSignDeepDive } from "./moonSignContent.js";

export type ShareableSign = (typeof ZODIAC_SIGNS)[number];

/** "cancer" / "Cancer" -> "Cancer", anything else -> null */
export function parseShareSign(input?: string | null): ShareableSign | null {
  const wanted = (input || "").trim().toLowerCase();
  return ZODIAC_SIGNS.find((s) => s.toLowerCase() === wanted) ?? null;
}

export const sharedMoonPath = (sign: string) => `/shared-moon/${sign.toLowerCase()}`;
export const sharedMoonUrl = (sign: string) => canonicalUrl(sharedMoonPath(sign));

/** One Open Graph image per Moon sign: public/og/moon-<sign>.png, 1200x630. */
export const moonOgImage = (sign: string) => `${SITE_URL}/og/moon-${sign.toLowerCase()}.png`;

export function buildSharedMoonPageSeo(sign: string) {
  const dive = getMoonSignDeepDive(sign);
  const path = sharedMoonPath(sign);
  return {
    path,
    canonical: canonicalUrl(path),
    title: `${sign} Moon${dive ? `: ${dive.archetype}` : ""} — Moonday Live`,
    description: `A friend shared their ${sign} Moon sign${dive ? ` (${dive.archetype})` : ""}. Add your birthday and email to find your own Moon sign.`,
    ogImage: moonOgImage(sign),
  };
}
