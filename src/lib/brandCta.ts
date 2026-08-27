export const SITE_URL = "https://moondaylive.com";

/** Hosted CTA button image (navy pill, lime border, logo). */
export const BRAND_CTA_URL = `${SITE_URL}/moonday-cta-button.png`;

/**
 * Clickable button for Substack. A linked <img> survives Substack's
 * sanitizer where styled anchors get flattened into plain text links.
 */
export function brandButtonHtml(href: string = SITE_URL): string {
  return `<p style="text-align:center;margin:28px 0;"><a href="${href}" target="_blank" rel="noopener"><img src="${BRAND_CTA_URL}" alt="Check your moon sign on MoondayLive.com" width="520" style="width:100%;max-width:520px;height:auto;border:0;display:inline-block;" /></a></p>`;
}

/** Wrap rendered Substack HTML with the button at the top and bottom. */
export function wrapSubstackHtml(html: string, href: string = SITE_URL): string {
  const btn = brandButtonHtml(href);
  return `${btn}\n${html}\n${btn}`;
}

/** Plain-text fallback: link line at top and bottom. */
export function wrapSubstackPlain(text: string, href: string = SITE_URL): string {
  const line = `Check your moon sign on MoondayLive.com -> ${href}`;
  return `${line}\n\n${text.trim()}\n\n${line}`;
}
