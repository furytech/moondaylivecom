// Neutral filler for the blurred part of a locked section. Free members see a blur of about the right length;
// the page never contains the real paid text. The words are generic and deterministic (same input length,
// same filler), so the layout does not jump and there is nothing to read through the blur.

const FILLER_WORDS = [
  "steady", "focus", "gentle", "rhythm", "clear", "intention", "quiet", "balance", "open", "attention",
  "soft", "energy", "patient", "pace", "present", "moment", "simple", "choice", "easy", "breath",
];

/** Filler text with about as many characters as `realText` (never the text itself). */
export function placeholderFor(realText: string | null | undefined): string {
  const target = (realText ?? "").trim().length;
  if (target === 0) return "";
  const words: string[] = [];
  let length = 0;
  for (let i = 0; length < target; i++) {
    const word = FILLER_WORDS[(i * 7 + 3) % FILLER_WORDS.length];
    words.push(word);
    length += word.length + 1;
  }
  const out = words.join(" ");
  return out.length > target ? out.slice(0, Math.max(1, target)).trimEnd() : out;
}
