/**
 * Reddit renders a blank line as a full paragraph gap (what reads as "double
 * spacing"). A plain single newline is the opposite problem: Reddit's markdown
 * joins those lines into one run-on paragraph.
 *
 * The correct single-spaced result is a Markdown hard break: two trailing
 * spaces before the newline. This helper collapses every blank-line run into
 * that hard break so pasted and webhook-dispatched copy look identical.
 */
export function redditSingleSpace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{2,}/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("  \n")
    .trim();
}

const SITE_URL = "https://moondaylive.com";

/** Same source-url rule the dispatcher uses. */
export function redditSourceUrl(post: { slug?: string | null; category?: string | null }): string {
  if (!post.slug) return SITE_URL;
  return post.category ? `${SITE_URL}/blog/${post.category}/${post.slug}` : `${SITE_URL}/blog/${post.slug}`;
}

/** Reddit self-posts can't render images, so the brand mark is a plain link line. */
export function redditBrandLink(href: string = SITE_URL): string {
  return `[Moonday Live -> ${href.replace(/^https?:\/\//, "")}](${href})`;
}

/**
 * Byte-identical to the webhook payload body: brand link, copy, brand link,
 * all single-spaced with Markdown hard breaks.
 */
export function redditBodyWithBrand(
  text: string,
  post: { slug?: string | null; category?: string | null } = {},
): string {
  const link = redditBrandLink(redditSourceUrl(post));
  // The body stays single-spaced (hard breaks), but the brand links sit in
  // their own paragraphs so Reddit renders them as standalone lines instead of
  // merging them into the first/last sentence.
  return `${link}\n\n${redditSingleSpace(text)}\n\n${link}`;
}


