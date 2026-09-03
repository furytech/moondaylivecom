import { supabase } from "@/integrations/supabase/client";

export type BlogCategory = "Guides" | "Transits" | "Features" | "Product Updates";
export type CtaType = "birthday-calculator" | "dashboard" | "none";
export type PostStatus = "draft" | "approved" | "scheduled" | "published";
/** Per-channel lifecycle for Reddit / Substack editions of a post. */
export type ChannelStatus = "draft" | "approved" | "scheduled" | "sent";

export const SITE_URL = "https://moondaylive.com";
export const SIGNS_PUBLIC_PATH = "/assets/signs";

export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export interface BlogPost {
  slug: string;
  title: string;
  category: BlogCategory;
  excerpt: string;
  author: string;
  reviewedBy: string;
  date: string; // ISO
  readMinutes: number;
  readTime: number;
  keywords: string[];
  featured?: boolean;
  ctaType?: CtaType;
  imageUrl?: string;
  /** Raw markdown body (frontmatter stripped). */
  content: string;
  zodiacSignTag?: string;
  constellationGraphicPath?: string;
  /** Guest astrologer attribution, when this edition has a guest voice. */
  guestDisplayName?: string | null;
  guestBio?: string | null;
}


export interface BlogPostRow {
  id?: string;
  slug: string;
  title: string;
  category: BlogCategory;
  excerpt: string;
  author: string;
  reviewed_by: string;
  content: string;
  keywords: string[];
  read_time: number;
  readMinutes?: number;
  readTime?: number;
  status: PostStatus;
  publish_at?: string | null;
  published_at?: string | null;
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
  substack_post?: string;
  reddit_status?: ChannelStatus;
  reddit_scheduled_at?: string | null;
  reddit_posted_at?: string | null;
  substack_status?: ChannelStatus;
  substack_scheduled_at?: string | null;
  substack_sent_at?: string | null;
  /** Last time the formatted edition was emailed by the Substack draft bridge. */
  substack_bridge_sent_at?: string | null;
  substack_error?: string | null;
  /** Reddit auto-post outcome, surfaced on the channel audit page. */
  reddit_error?: string | null;
  reddit_permalink?: string | null;
  reddit_attempted_at?: string | null;
  zodiac_sign_tag?: string;
  constellation_graphic_path?: string;
  reviewedBy?: string;
  guest_contribution_id?: string | null;
  guest_display_name?: string | null;
  guest_bio?: string | null;
}


export const CATEGORIES: BlogCategory[] = ["Guides", "Transits", "Features", "Product Updates"];

export function categoryPath(cat: BlogCategory | string) {
  return cat.toLowerCase().replace(/\s+/g, "-");
}

export function capitalizeSign(sign?: string | null): string {
  if (!sign) return "";
  const s = sign.trim().toLowerCase();
  const match = SIGNS.find((x) => x.toLowerCase() === s);
  return match || s.charAt(0).toUpperCase() + s.slice(1);
}

export function signImageUrl(sign?: string | null): string | null {
  const name = capitalizeSign(sign);
  if (!name) return null;
  return `${SITE_URL}${SIGNS_PUBLIC_PATH}/${name}.png`;
}

export function resolveSignImage(post: Partial<BlogPost>): string | null {
  if (post.imageUrl) return post.imageUrl;
  const fromPath = post.constellationGraphicPath;
  if (fromPath) {
    const file = fromPath.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
    const url = signImageUrl(file);
    if (url) return url;
  }
  return signImageUrl(post.zodiacSignTag);
}

export function rowToPost(row: BlogPostRow): BlogPost {
  const readTime = Number(row.read_time ?? row.readTime ?? row.readMinutes ?? 4);
  const zodiacSignTag = row.zodiac_sign_tag;
  const constellationGraphicPath = row.constellation_graphic_path;
  const autoImage = signImageUrl(zodiacSignTag) || (constellationGraphicPath ? `${SITE_URL}${constellationGraphicPath}` : undefined);
  return {
    slug: row.slug,
    title: row.title,
    category: (row.category as BlogCategory) ?? "Guides",
    excerpt: row.excerpt || "",
    author: row.author || "Moonday Live Team",
    reviewedBy: row.reviewed_by || row.reviewedBy || "Moonday Live Astrologer",
    date: row.published_at || row.publish_at || row.created_at || new Date().toISOString(),
    readMinutes: readTime,
    readTime,
    keywords: Array.isArray(row.keywords) ? row.keywords.map(String) : [],
    featured: Boolean(row.featured),
    ctaType: (row.cta_type as CtaType) ?? (row.ctaType as CtaType) ?? "none",
    imageUrl: row.image_url || row.imageUrl || autoImage,
    content: row.content || "",
    zodiacSignTag,
    constellationGraphicPath,
    guestDisplayName: row.guest_display_name ?? null,
    guestBio: row.guest_bio ?? null,
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
  if (post.reviewedBy !== undefined) row.reviewed_by = post.reviewedBy;
  if (post.imageUrl !== undefined) row.image_url = post.imageUrl;
  if (post.ctaType !== undefined) row.cta_type = post.ctaType;
  if (post.zodiacSignTag !== undefined) row.zodiac_sign_tag = post.zodiacSignTag;
  if (post.constellationGraphicPath !== undefined) row.constellation_graphic_path = post.constellationGraphicPath;
  return row;
}


/** Public visibility rule: status must be published AND publish_at must have passed. */
const liveFilter = () => `publish_at.is.null,publish_at.lte.${new Date().toISOString()}`;

export async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .or(liveFilter())
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
    .or(liveFilter())
    .maybeSingle();
  if (error) return null;
  return data ? rowToPost(data as BlogPostRow) : null;
}

export async function getRelated(slug: string, category: BlogCategory, limit = 3): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .or(liveFilter())
    .eq("category", category)
    .neq("slug", slug)
    .limit(limit);
  if (error) throw error;
  return (data as BlogPostRow[] || []).map(rowToPost);
}

/* Reddit publishes through the approval webhook pipeline: the `reddit-auto-post`
 * edge function POSTs the finished payload and the webhook owns the posting. */


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
  const now = new Date().toISOString();
  // publish_at must also move to now — the public blog hides posts whose
  // scheduled instant is still in the future, even when status = published.
  const { data, error } = await supabase
    .from("blog_posts")
    .update({ status: "published", published_at: now, publish_at: now })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BlogPostRow;
}

/** Re-queues a post for a future instant. The hourly publisher makes it live. */
export async function schedulePost(id: string, publishAtIso: string) {
  const { data, error } = await supabase
    .from("blog_posts")
    .update({ status: "scheduled", publish_at: publishAtIso, published_at: null })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BlogPostRow;
}

/** Queues (or clears) a channel edition for a future instant. */
export async function scheduleChannel(
  id: string,
  channel: "substack" | "reddit",
  scheduledAtIso: string | null,
) {
  // When unscheduling (null) we only flip the status back to draft and keep the
  // stored time, so the row still renders exactly as it did before scheduling.
  const patch =
    channel === "reddit"
      ? scheduledAtIso
        ? { reddit_status: "scheduled", reddit_scheduled_at: scheduledAtIso }
        : { reddit_status: "draft" }
      : scheduledAtIso
        ? { substack_status: "scheduled", substack_scheduled_at: scheduledAtIso }
        : { substack_status: "draft" };
  const { data, error } = await supabase
    .from("blog_posts")
    .update(patch as any)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BlogPostRow;
}

/** Manually flags the Substack edition as sent (or back to draft) after the
 *  newsletter was published by hand. */
export async function setChannelSent(
  id: string,
  channel: "substack" | "reddit",
  sent: boolean,
) {
  const now = new Date().toISOString();
  const patch =
    channel === "substack"
      ? sent
        ? { substack_status: "sent", substack_sent_at: now }
        : { substack_status: "draft", substack_sent_at: null }
      : sent
        ? { reddit_status: "sent", reddit_posted_at: now }
        : { reddit_status: "draft", reddit_posted_at: null };
  const { data, error } = await supabase
    .from("blog_posts")
    .update(patch as any)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BlogPostRow;
}


/** Reverts a post to draft. The scheduled publish time is preserved so the
 *  post stays findable and can simply be re-approved. */
export async function unpublishPost(id: string) {
  const { data, error } = await supabase
    .from("blog_posts")
    .update({ status: "draft", published_at: null })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BlogPostRow;
}

/**
 * Builds a Substack newsletter draft from the blog post so older rows (created
 * before the Substack column existed) can still be reviewed and edited here.
 */
export function buildSubstackDraft(post: Partial<BlogPostRow>): string {
  const sign = capitalizeSign(post.zodiac_sign_tag);
  const title = post.title || "Moonday Live";
  const image = post.image_url || (sign ? signImageUrl(sign) : null);
  const url = post.slug
    ? `${SITE_URL}/blog/${categoryPath(post.category || "Guides")}/${post.slug}`
    : SITE_URL;

  const body = (post.content || "")
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/^#\s+.*$/m, "")
    .trim();

  // Skip the excerpt when it just restates the title (avoids a duplicate
  // headline sitting under the image in the newsletter).
  const excerpt = post.excerpt?.trim() || "";
  const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const intro = excerpt && normalize(excerpt) !== normalize(title) ? excerpt : "";

  return [
    `# ${title}`,
    image ? `![${sign || title}](${image})` : "",
    intro,
    body,
    `---`,
    `Read the full transit on [Moonday Live](${url}). For entertainment and reflection only.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
