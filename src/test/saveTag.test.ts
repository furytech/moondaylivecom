import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const GOLD = "#F5C451";

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: number[]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hslToRgb = (h: number, s: number, l: number) => {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((x) => Math.round(x * 255));
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("Pricing SAVE tag", () => {
  const css = readFileSync("src/index.css", "utf8");
  const pricing = readFileSync("src/pages/Pricing.tsx", "utf8");

  it("is warm gold with dark navy bold text, and the text contrast is at least 4.5:1", () => {
    const m = css.match(/--navy-deep:\s*(\d+)\s+(\d+)%\s+(\d+)%/)!;
    const navy = hslToRgb(+m[1], +m[2], +m[3]);
    expect(contrast(navy, hex(GOLD))).toBeGreaterThanOrEqual(4.5);
    const tag = pricing.slice(pricing.indexOf('data-testid="save-tag"'), pricing.indexOf("PRICES.yearly.savings"));
    expect(tag).toContain(`bg-[${GOLD}]`);
    expect(tag).toContain("text-[hsl(var(--navy-deep))]");
    expect(tag).toContain("font-bold");
  });

  it("is the only place that uses that gold on the Pricing page and the shared styles", () => {
    expect(pricing.split(GOLD).length - 1).toBe(1);
    expect(css.toLowerCase()).not.toContain(GOLD.toLowerCase());
    expect(readFileSync("tailwind.config.ts", "utf8").toLowerCase()).not.toContain(GOLD.toLowerCase());
  });
});
