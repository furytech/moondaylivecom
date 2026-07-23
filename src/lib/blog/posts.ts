import matter from "gray-matter";

export type BlogCategory = "Guides" | "Transits" | "Features" | "Product Updates";
export type CtaType = "birthday-calculator" | "dashboard" | "none";

export interface BlogPost {
  slug: string;
  title: string;
  category: BlogCategory;
  excerpt: string;
  author: string;
  date: string; // ISO
  readMinutes: number;
  readTime: number;
  keywords: string[];
  featured?: boolean;
  ctaType?: CtaType;
  /** Raw markdown body (frontmatter stripped). */
  content: string;
}

export const CATEGORIES: BlogCategory[] = ["Guides", "Transits", "Features", "Product Updates"];

// Eager-load every markdown file in /src/content/blog/ as raw text.
const files = import.meta.glob("/src/content/blog/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function parsePost(raw: string, filepath: string): BlogPost {
  const { data, content } = matter(raw);
  const slug =
    (data.slug as string) ??
    filepath.split("/").pop()!.replace(/\.md$/, "");
  const readTime = Number(data.readTime ?? data.readMinutes ?? 4);
  return {
    slug,
    title: String(data.title ?? slug),
    category: (data.category as BlogCategory) ?? "Guides",
    excerpt: String(data.excerpt ?? ""),
    author: String(data.author ?? "Moonday Live Team"),
    date: String(data.date ?? new Date().toISOString().slice(0, 10)),
    readMinutes: readTime,
    readTime,
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    featured: Boolean(data.featured),
    ctaType: (data.ctaType as CtaType) ?? "none",
    content: content.trim(),
  };
}

export const POSTS: BlogPost[] = Object.entries(files)
  .map(([path, raw]) => parsePost(raw, path))
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}

export function getRelated(slug: string, category: BlogCategory, limit = 3) {
  return POSTS.filter((p) => p.slug !== slug && p.category === category).slice(0, limit);
}

export function categoryPath(cat: BlogCategory) {
  return cat.toLowerCase().replace(/\s+/g, "-");
}
