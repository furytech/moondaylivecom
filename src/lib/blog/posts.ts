import { supabase } from "@/integrations/supabase/client";

export type BlogCategory = "Guides" | "Transits" | "Features" | "Product Updates";
export type CtaType = "birthday-calculator" | "dashboard" | "none";
export type PostStatus = "draft" | "approved" | "published";

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
  imageUrl?: string;
  /** Raw markdown body (frontmatter stripped). */
  content: string;
}

export interface BlogPostRow {
  id?: string;
  slug: string;
  title: string;
  category: BlogCategory;
  excerpt: string;
  author: string;
  content: string;
  keywords: string[];
  read_time: number;
  readMinutes?: number;
  readTime?: number;
  status: PostStatus;
  publish_at?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  featured?: boolean;
  cta_type?: CtaType;
  ctaType?: CtaType;
  image_url?: string;
  imageUrl?: string;
  meta_title?: string;
  meta_description?: string;
  reddit_post?: string;
  zodiac_sign_tag?: string;
  constellation_graphic_path?: string;
}

export const CATEGORIES: BlogCategory[] = ["Guides", "Transits", "Features", "Product Updates"];

export function categoryPath(cat: BlogCategory | string) {
  return cat.toLowerCase().replace(/\s+/g, "-");
}

export function rowToPost(row: BlogPostRow): BlogPost {
  const readTime = Number(row.read_time ?? row.readTime ?? row.readMinutes ?? 4);
  return {
    slug: row.slug,
    title: row.title,
    category: (row.category as BlogCategory) ?? "Guides",
    excerpt: row.excerpt || "",
    author: row.author || "Moonday Live Team",
    date: row.published_at || row.publish_at || row.created_at || new Date().toISOString(),
    readMinutes: readTime,
    readTime,
    keywords: Array.isArray(row.keywords) ? row.keywords.map(String) : [],
    featured: Boolean(row.featured),
    ctaType: (row.cta_type as CtaType) ?? (row.ctaType as CtaType) ?? "none",
    imageUrl: row.image_url || row.imageUrl,
    content: row.content || "",
    zodiacSignTag: row.zodiac_sign_tag,
    constellationGraphicPath: row.constellation_graphic_path,
  };
}

export function postToRow(post: Partial<BlogPost>): Partial<BlogPostRow> {
  const row: Partial<BlogPostRow> = {};
  if (post.slug !== undefined) row.slug = post.slug;
  if (post.title !== undefined) row.title = post.title;
  if (post.category !== undefined) row.category = post.category;
  if (post.excerpt !== undefined) row.excerpt = post.excerpt;
  if (post.content !== undefined) row.content = post.content;
  if (post.keywords !== undefined) row.keywords = post.keywords;
  if (post.readTime !== undefined || post.readMinutes !== undefined) {
    row.read_time = post.readTime ?? post.readMinutes;
  }
  if (post.author !== undefined) row.author = post.author;
  if (post.imageUrl !== undefined) row.image_url = post.imageUrl;
  if (post.ctaType !== undefined) row.cta_type = post.ctaType;
  return row;
}

export async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data as BlogPostRow[] || []).map(rowToPost);
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!slug || slug.startsWith(":")) return null;
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (error) return null;
  return data ? rowToPost(data as BlogPostRow) : null;
}

export async function getRelated(slug: string, category: BlogCategory, limit = 3): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .eq("category", category)
    .neq("slug", slug)
    .limit(limit);
  if (error) throw error;
  return (data as BlogPostRow[] || []).map(rowToPost);
}

// Admin helpers
export async function listAllPosts(): Promise<BlogPostRow[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as BlogPostRow[] || []);
}

export async function getPostBySlugAdmin(slug: string): Promise<BlogPostRow | null> {
  const { data, error } = await supabase.from("blog_posts").select("*").eq("slug", slug).single();
  if (error) return null;
  return data as BlogPostRow | null;
}

export async function upsertPost(post: Partial<BlogPostRow>): Promise<BlogPostRow> {
  if (post.id) {
    const { data, error } = await supabase
      .from("blog_posts")
      .update(post as any)
      .eq("id", post.id)
      .select()
      .single();
    if (error) throw error;
    return data as BlogPostRow;
  }
  const { data, error } = await supabase
    .from("blog_posts")
    .insert(post as any)
    .select()
    .single();
  if (error) throw error;
  return data as BlogPostRow;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function approvePost(id: string, publishAt?: string) {
  const { data, error } = await supabase
    .from("blog_posts")
    .update({ status: "approved", publish_at: publishAt || new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BlogPostRow;
}

export async function publishPostNow(id: string) {
  const { data, error } = await supabase
    .from("blog_posts")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BlogPostRow;
}
