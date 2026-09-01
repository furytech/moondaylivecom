/**
 * Single source of truth for the four distribution channels.
 *
 * The admin panel, the clipboard copy and the review email all read from here,
 * so what the operator sees on screen is byte-identical to what gets shared.
 *
 * Posting is manual now: Reddit, Facebook/Instagram and Pinterest go out via
 * client-side Web Share Intents, not backend API publishers.
 */

export const SITE_URL = "https://moondaylive.com";

export type ChannelKey = "blog" | "reddit" | "facebook" | "pinterest";

export const CHANNEL_KEYS: ChannelKey[] = ["blog", "reddit", "facebook", "pinterest"];

export const CHANNEL_LABEL: Record<ChannelKey, string> = {
  blog: "Moonday Blog",
  reddit: "Reddit",
  facebook: "Facebook / Instagram",
  pinterest: "Pinterest",
};

/** Column on blog_posts holding this channel's draft. */
export const CHANNEL_FIELD: Record<ChannelKey, string> = {
  blog: "content",
  reddit: "reddit_post",
  facebook: "facebook_post",
  pinterest: "pinterest_post",
};

/* ------------------------------------------------------------------ CTA */

export const CTA_TEXT = "Check your moon sign on MoondayLive.com";

/** Plain-text/markdown CTA line used at the top and bottom of every block. */
export function ctaLine(href: string = SITE_URL): string {
  return `${CTA_TEXT} → ${href}`;
}

/** Wraps a draft with the CTA at top and bottom. Idempotent. */
export function withCta(text: string | null | undefined, href: string = SITE_URL): string {
  const body = (text ?? "").trim();
  if (!body) return "";
  const line = ctaLine(href);
  const already = body.startsWith(line);
  return already ? body : `${line}\n\n${body}\n\n${line}`;
}

/* ------------------------------------------------------------ Zodiac art */

export const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

/**
 * Verified constellation artwork.
 *
 * Each PNG was checked (OCR pass over the asset) for the zodiac name typeset
 * on the graphic itself. `labelPosition` records where that name sits.
 * Anything absent from this manifest is treated as unverified and raises a
 * validation warning in the admin panel and the review email.
 */
export const ZODIAC_ASSET_MANIFEST: Record<
  string,
  { path: string; labelPosition: "above" | "below" }
> = Object.fromEntries(
  ZODIAC_SIGNS.map((s) => [s, { path: `/assets/signs/${s}.png`, labelPosition: "below" as const }]),
);

export interface ZodiacAsset {
  sign: string | null;
  /** Absolute, hotlinkable URL. */
  url: string | null;
  verified: boolean;
  warning: string | null;
}

const titleCase = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();

export function resolveZodiacAsset(
  zodiacSignTag?: string | null,
  imageUrl?: string | null,
): ZodiacAsset {
  const sign = zodiacSignTag ? titleCase(zodiacSignTag.trim()) : null;

  if (!sign) {
    return {
      sign: null,
      url: imageUrl?.trim() || null,
      verified: false,
      warning: "No zodiac sign tag on this transit, so no constellation asset could be matched.",
    };
  }

  const entry = ZODIAC_ASSET_MANIFEST[sign];
  if (!entry) {
    return {
      sign,
      url: imageUrl?.trim() || null,
      verified: false,
      warning: `No verified constellation asset registered for ${sign}.`,
    };
  }

  return {
    sign,
    url: `${SITE_URL}${entry.path}`,
    verified: true,
    warning:
      entry.labelPosition === "below"
        ? null
        : `${sign} artwork carries its name above the constellation, not beneath it.`,
  };
}

/* ----------------------------------------------------------- Share links */

export interface ShareContext {
  title: string;
  text: string;
  /** Canonical Moonday URL for this transit. */
  url: string;
  imageUrl?: string | null;
}

/**
 * Native submission URL per platform.
 *
 * Reddit deliberately opens clean at reddit.com so the native community
 * suggestion box can pick the room at submission time.
 */
export function shareIntentUrl(channel: ChannelKey, ctx: ShareContext): string {
  if (channel === "reddit") return "https://reddit.com";
  if (channel === "facebook") {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      ctx.url,
    )}&quote=${encodeURIComponent(ctx.text.slice(0, 2000))}`;
  }
  if (channel === "pinterest") {
    const media = ctx.imageUrl ? `&media=${encodeURIComponent(ctx.imageUrl)}` : "";
    return `https://www.pinterest.com/pin-builder/?url=${encodeURIComponent(
      ctx.url,
    )}${media}&description=${encodeURIComponent(ctx.text.slice(0, 500))}`;
  }
  return ctx.url;
}

export const SHARE_LABEL: Record<ChannelKey, string> = {
  blog: "View on site",
  reddit: "Open Reddit",
  facebook: "Share to Facebook",
  pinterest: "Create Pin",
};

/** Canonical public URL for a transit post. */
export function postUrl(post: { slug?: string | null; category?: string | null }): string {
  if (!post.slug) return SITE_URL;
  return post.category
    ? `${SITE_URL}/blog/${post.category}/${post.slug}`
    : `${SITE_URL}/blog/${post.slug}`;
}
