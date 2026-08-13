// Minimal Markdown -> HTML converter used for rich-text clipboard copies.
// Substack (and most editors) render pasted HTML, so this prevents raw "##"
// hash marks from showing up in the newsletter editor.

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const inline = (value: string) =>
  escapeHtml(value)
    // images first, then links
    .replace(
      /!\[([^\]]*)\]\(([^)\s]+)\)/g,
      (_m, alt, src) => `<img src="${src}" alt="${alt}" />`,
    )
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_m, text, href) => `<a href="${href}">${text}</a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");

export function markdownToHtml(markdown: string): string {
  const blocks = markdown.replace(/\r\n/g, "\n").split(/\n{2,}/);

  return blocks
    .map((raw) => {
      const block = raw.trim();
      if (!block) return "";

      if (/^---+$/.test(block)) return "<hr />";

      const heading = block.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${inline(heading[2].trim())}</h${level}>`;
      }

      // Standalone image line
      if (/^!\[[^\]]*\]\([^)\s]+\)$/.test(block)) {
        return `<p>${inline(block)}</p>`;
      }

      if (/^[-*]\s+/m.test(block) && block.split("\n").every((l) => /^[-*]\s+/.test(l.trim()))) {
        const items = block
          .split("\n")
          .map((l) => `<li>${inline(l.trim().replace(/^[-*]\s+/, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      if (block.split("\n").every((l) => /^\d+\.\s+/.test(l.trim()))) {
        const items = block
          .split("\n")
          .map((l) => `<li>${inline(l.trim().replace(/^\d+\.\s+/, ""))}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }

      if (/^>\s?/.test(block)) {
        const quote = block
          .split("\n")
          .map((l) => l.replace(/^>\s?/, ""))
          .join(" ");
        return `<blockquote><p>${inline(quote)}</p></blockquote>`;
      }

      return `<p>${inline(block).replace(/\n/g, "<br />")}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

// Plain-text fallback: readable copy with the Markdown syntax stripped.
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^---+$/gm, "—")
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, "$2")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1 ($2)")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1$2")
    .trim();
}
