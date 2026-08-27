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
