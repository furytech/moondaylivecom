// Word counts and cross-page similarity for the Library sign articles.
// Run: npx tsx scripts/library-article-check.ts [Sign ...]
// Words counted: paragraphs, bullet items, FAQ answers and the closing text (not headings, chips or navigation).
import { libraryArticles } from "../src/content/library";

const words = (t: string) => t.toLowerCase().replace(/[^a-z0-9'\s]/g, " ").split(/\s+/).filter(Boolean);

function bodyText(a: (typeof libraryArticles)[string]): string[] {
  return [
    ...a.sections.flatMap((s) => [...s.paragraphs, ...(s.list?.items ?? [])]),
    ...a.faqs.map((f) => f.answer),
    a.closing.text,
  ];
}

const only = process.argv.slice(2);
const signs = Object.keys(libraryArticles);
const shingles = new Map<string, Set<string>>();
for (const sign of signs) {
  const all = words(bodyText(libraryArticles[sign]).join(" "));
  const set = new Set<string>();
  for (let i = 0; i + 5 <= all.length; i++) set.add(all.slice(i, i + 5).join(" "));
  shingles.set(sign, set);
  if (!only.length || only.includes(sign)) {
    const a = libraryArticles[sign];
    console.log(
      `${sign.padEnd(12)} words=${all.length}  faqs=${a.faqs.length}  sections=${a.sections.length}  title=${(a.seoTitle ?? "").length}c  desc=${(a.seoDescription ?? "").length}c`,
    );
  }
}

let worst = { pct: 0, a: "", b: "", sample: [] as string[] };
const pairs: { a: string; b: string; pct: number }[] = [];
for (let i = 0; i < signs.length; i++) {
  for (let j = i + 1; j < signs.length; j++) {
    const A = shingles.get(signs[i])!;
    const B = shingles.get(signs[j])!;
    const shared = [...A].filter((s) => B.has(s));
    const pct = (shared.length / Math.min(A.size, B.size)) * 100;
    pairs.push({ a: signs[i], b: signs[j], pct });
    if (pct > worst.pct) worst = { pct, a: signs[i], b: signs[j], sample: shared.slice(0, 8) };
  }
}
pairs.sort((x, y) => y.pct - x.pct);
console.log(`\nHighest shared 5-word phrases: ${worst.pct.toFixed(2)}% (${worst.a} vs ${worst.b})`);
console.log("top 5 pairs:", pairs.slice(0, 5).map((p) => `${p.a}/${p.b} ${p.pct.toFixed(2)}%`).join(", "));
if (worst.sample.length) console.log("sample shared phrases:", worst.sample.join(" | "));
