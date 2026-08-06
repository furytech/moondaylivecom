import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import MoonLoader from "@/components/MoonLoader";
import ScheduledPublishPicker from "@/components/admin/ScheduledPublishPicker";
import {
  listAllPosts,
  upsertPost,
  deletePost,
  approvePost,
  publishPostNow,
  unpublishPost,
  BlogPostRow,
  BlogCategory,
  CATEGORIES,
  SIGNS,
  signImageUrl,
  resolveSignImage,
  buildRedditDraft,
} from "@/lib/blog/posts";

const defaultPost: Partial<BlogPostRow> = {
  slug: "",
  title: "",
  category: "Guides",
  excerpt: "",
  content: "",
  keywords: [],
  read_time: 4,
  author: "Moonday Live Team",
  reviewed_by: "Moonday Live Astrologer",
  status: "draft",
  featured: false,
  cta_type: "none",
  zodiac_sign_tag: "",
  constellation_graphic_path: "",
  image_url: "",
};


const toDatetimeLocalValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const fromDatetimeLocalValue = (value: string) => (value ? new Date(value).toISOString() : null);

const displayDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  // UTC is the canonical instant for transits — show it first, with the
  // viewer's local time as a secondary convenience.
  const utc = date.toLocaleString("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const local = date.toLocaleString(undefined, { timeZoneName: "short" });
  return `${utc} UTC · ${local}`;
};

const BlogAdmin = () => {
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["admin-check"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: session.session.user.id,
        _role: "admin",
      });
      if (error) return false;
      return !!data;
    },
  });

  const { data: posts = [], isLoading: loadingPosts, refetch } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: listAllPosts,
    enabled: isAdmin === true,
  });

  const [editing, setEditing] = useState<Partial<BlogPostRow> | null>(null);
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [filling, setFilling] = useState(false);
  const [queueing, setQueueing] = useState(false);
  const [queued, setQueued] = useState(false);
  // Substack hand-off. The n8n webhook URL is a per-browser admin setting so it
  // can be swapped between test and production workflows without a redeploy.
  const [substackHook, setSubstackHook] = useState(
    () => localStorage.getItem("moonday.substackWebhook") || "",
  );
  const [substackSending, setSubstackSending] = useState(false);
  const [substackSent, setSubstackSent] = useState(false);

  // Pre-builds drafts for every real Moon ingress in the next 30 days so the
  // schedule is never empty ahead of a transit.
  const handleFillSchedule = async () => {
    setFilling(true);
    setMessage("Calculating upcoming Moon ingresses and drafting posts…");
    try {
      const { data, error } = await supabase.functions.invoke("fill-transit-schedule", {
        body: { days: 30, limit: 8 },
      });
      if (error) throw error;
      const created = data?.created_count ?? 0;
      const skipped = data?.skipped?.length ?? 0;
      setMessage(
        created > 0
          ? `Created ${created} transit draft${created === 1 ? "" : "s"} at their real ingress times${skipped ? ` (${skipped} already scheduled)` : ""}.`
          : `Schedule is already full — ${skipped} upcoming transit${skipped === 1 ? "" : "s"} already have drafts.`,
      );
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setFilling(false);
    }
  };


  const handleCopyReddit = async (post: BlogPostRow) => {
    const text = post.reddit_post || "";
    if (!text) {
      setMessage("No Reddit post drafted for this row yet.");
      return;
    }
    // Reddit text posts do not render markdown images inline, but users still
    // want the image reference above the post body. Prepend it so the artwork
    // sits at the top of the copied text; they can then drag the file in, or
    // use this as the image post body with the caption below it.
    const imageUrl = resolveSignImage({
      imageUrl: post.image_url,
      zodiacSignTag: post.zodiac_sign_tag,
      constellationGraphicPath: post.constellation_graphic_path,
    });
    const parts: string[] = [];
    if (imageUrl) {
      parts.push(`![${post.zodiac_sign_tag || "Sign"} card](${imageUrl})`);
      parts.push("");
    }
    parts.push(text.trim());
    try {
      await navigator.clipboard.writeText(parts.join("\n"));
      setCopiedId(post.id || null);
      setTimeout(() => setCopiedId((cur) => (cur === post.id ? null : cur)), 2000);
    } catch {
      setMessage("Copy failed — browser blocked clipboard access.");
    }
  };

  const handleDownloadImage = async (post: BlogPostRow) => {
    const url = resolveSignImage({
      imageUrl: post.image_url,
      zodiacSignTag: post.zodiac_sign_tag,
      constellationGraphicPath: post.constellation_graphic_path,
    });
    if (!url) {
      setMessage("No sign image available for this post.");
      return;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${post.zodiac_sign_tag || "sign"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      setDownloadId(post.id || null);
      setTimeout(() => setDownloadId((cur) => (cur === post.id ? null : cur)), 2000);
    } catch {
      // Fallback: open the image in a new tab so the user can save it manually.
      window.open(url, "_blank", "noopener,noreferrer");
      setMessage("Image opened in a new tab — right-click and Save As.");
    }
  };


  const handleApproveAndPublish = async (id: string) => {
    try {
      await publishPostNow(id);
      setMessage("Approved and published live.");
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  // Scheduling: the picked instant drives status. Future => scheduled (the
  // hourly publisher flips it live), now/past => published immediately.
  const handleScheduleChange = (iso: string | null) => {
    if (!editing) return;
    if (!iso) {
      setEditing({ ...editing, publish_at: null });
      return;
    }
    const isFuture = new Date(iso).getTime() > Date.now();
    setEditing({
      ...editing,
      publish_at: iso,
      status: isFuture ? "scheduled" : "published",
      published_at: isFuture ? editing.published_at ?? null : iso,
    });
  };

  // Copies the Substack newsletter copy to the clipboard.
  const handleCopySubstack = async (post: Partial<BlogPostRow>) => {
    const text = post.substack_post?.trim();
    if (!text) {
      setMessage("No Substack copy on this post yet.");
      return;
    }
    await navigator.clipboard.writeText(text);
    setMessage("Substack copy copied to clipboard.");
  };

  // Drafts a Reddit title + body from the blog content currently in the editor.
  const handleGenerateReddit = () => {
    if (!editing) return;
    const { title, body } = buildRedditDraft(editing);
    setField("reddit_post", `${title}\n\n${body}`);
    setQueued(false);
  };

  // Approval hand-off: saves the reviewed Reddit copy and marks the row
  // approved with a publish time. The scheduled n8n run polls for approved
  // rows and performs the actual Reddit post — nothing is posted from here.
  const handleApproveForN8n = async () => {
    if (!editing) return;
    if (!editing.reddit_post?.trim()) {
      setMessage("Draft the Reddit copy first — the preview is empty.");
      return;
    }
    setQueueing(true);
    try {
      const saved = await upsertPost({
        ...editing,
        status: "approved",
        publish_at: editing.publish_at || new Date().toISOString(),
      });
      setEditing(saved);
      setQueued(true);
      setMessage("Approved. The next scheduled n8n run will pick this up for Reddit.");
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setQueueing(false);
    }
  };


  if (checkingAdmin) {
    return (
      <PageLayout>
        <SEO title="Admin — Moonday Live" description="Journal administration for Moonday Live." />
        <div className="py-20 flex justify-center">
          <MoonLoader size="md" text="Checking access..." />
        </div>
      </PageLayout>
    );
  }

  if (!isAdmin) {
    return (
      <PageLayout>
        <SEO title="Admin — Moonday Live" description="Journal administration for Moonday Live." />
        <div className="max-w-2xl mx-auto py-20 text-center">
          <h1 className="font-display text-2xl text-foreground mb-4">Admin Access Required</h1>
          <p className="text-cream-muted">
            This area is restricted to administrators. If you need access, add your user to the{" "}
            <code className="text-primary">user_roles</code> table with role{" "}
            <code className="text-primary">admin</code>.
          </p>
        </div>
      </PageLayout>
    );
  }

  const handleSave = async () => {
    if (!editing) return;
    try {
      await upsertPost(editing);
      setEditing(null);
      setMessage("Saved.");
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approvePost(id);
      setMessage("Post approved and scheduled.");
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handlePublishNow = async (id: string) => {
    try {
      await publishPostNow(id);
      setMessage("Post published.");
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleUnpublish = async (id: string) => {
    if (!confirm("Unpublish this post? It will revert to draft and be hidden from the public blog.")) return;
    try {
      await unpublishPost(id);
      setMessage("Post unpublished and reverted to draft.");
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try {
      await deletePost(id);
      setMessage("Deleted.");
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const openNew = () => {
    setQueued(false);
    setEditing({ ...defaultPost });
  };
  const openEdit = (post: BlogPostRow) => {
    setQueued(false);
    setEditing({ ...post });
  };

  const setField = <K extends keyof BlogPostRow>(key: K, value: BlogPostRow[K] | null) => {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <PageLayout>
      <SEO title="Journal Admin — Moonday Live" description="Manage and approve Journal posts for Moonday Live." canonical="https://moondaylive.com/admin/blog" />
      <div className="w-full max-w-5xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl md:text-3xl text-foreground">Journal Admin</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFillSchedule}
              disabled={filling}
              className="px-4 py-2 rounded-full border border-primary/40 text-primary text-sm hover:bg-primary/10 transition disabled:opacity-50"
            >
              {filling ? "Drafting…" : "Fill Transit Schedule (30d)"}
            </button>
            <button
              onClick={openNew}
              className="px-4 py-2 rounded-full bg-primary/90 text-primary-foreground text-sm hover:bg-primary transition"
            >
              + New Post
            </button>
          </div>
        </div>


        {message && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
            {message}
          </div>
        )}

        {editing && (
          <div className="mb-10 rounded-xl border border-border/40 bg-background/70 p-6 backdrop-blur">
            <h2 className="font-display text-lg text-foreground mb-4">
              {editing.id ? "Edit Post" : "New Post"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Slug</label>
                <input
                  value={editing.slug || ""}
                  onChange={(e) => setField("slug", e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                  placeholder="unified-daily-moon-tracker"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Title</label>
                <input
                  value={editing.title || ""}
                  onChange={(e) => setField("title", e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Category</label>
                <select
                  value={editing.category || "Guides"}
                  onChange={(e) => setField("category", e.target.value as BlogCategory)}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Zodiac Sign Tag</label>
                <select
                  value={editing.zodiac_sign_tag || ""}
                  onChange={(e) => {
                    const sign = e.target.value;
                    setEditing((prev) => {
                      if (!prev) return prev;
                      const img = sign ? signImageUrl(sign) : "";
                      const graphic = sign ? `/assets/signs/${sign}.png` : "";
                      return { ...prev, zodiac_sign_tag: sign, image_url: img, constellation_graphic_path: graphic };
                    });
                  }}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                >
                  <option value="">— None —</option>
                  {SIGNS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Author</label>
                <input
                  value={editing.author || ""}
                  onChange={(e) => setField("author", e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Reviewed By</label>
                <input
                  value={editing.reviewed_by || ""}
                  onChange={(e) => setField("reviewed_by", e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                  placeholder="Astrologer who reviewed this post"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Read Time (min)</label>
                <input
                  type="number"
                  value={editing.read_time || 4}
                  onChange={(e) => setField("read_time", Number(e.target.value))}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Status</label>
                <select
                  value={editing.status || "draft"}
                  onChange={(e) => setField("status", e.target.value as any)}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">
                  Scheduled Publish Date &amp; Time
                </label>
                <ScheduledPublishPicker
                  value={editing.publish_at}
                  onChange={handleScheduleChange}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Published At (live date shown)</label>
                <input
                  type="datetime-local"
                  value={toDatetimeLocalValue(editing.published_at)}
                  onChange={(e) => setField("published_at", fromDatetimeLocalValue(e.target.value))}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">CTA Type</label>
                <select
                  value={editing.cta_type || "none"}
                  onChange={(e) => setField("cta_type", e.target.value as any)}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                >
                  <option value="none">None</option>
                  <option value="birthday-calculator">Birthday Calculator</option>
                  <option value="dashboard">Dashboard</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Excerpt</label>
              <textarea
                value={editing.excerpt || ""}
                onChange={(e) => setField("excerpt", e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Content (Markdown)</label>
              <textarea
                value={editing.content || ""}
                onChange={(e) => setField("content", e.target.value)}
                rows={12}
                className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground font-mono focus:border-primary/60 focus:outline-none"
              />
            </div>
            {/* Reddit Preview — drafted here, approved here, picked up by the
                scheduled n8n run. Nothing posts to Reddit from the browser. */}
            <div className="mb-6 rounded-xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <h3 className="font-display text-sm uppercase tracking-[0.2em] text-primary">Reddit Preview</h3>
                <button
                  type="button"
                  onClick={handleGenerateReddit}
                  className="px-3 py-1.5 rounded-full border border-primary/40 text-primary text-xs hover:bg-primary/10 transition"
                >
                  Regenerate from post
                </button>
              </div>
              <p className="text-xs text-cream-muted/70 mb-3">
                Title on the first line, blank line, then the body. The sign image is attached above the text when copied.
              </p>
              <textarea
                value={editing.reddit_post || ""}
                onChange={(e) => setField("reddit_post", e.target.value)}
                rows={8}
                placeholder="Click “Regenerate from post” to draft a Reddit title and body from the blog content."
                className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground font-mono focus:border-primary/60 focus:outline-none"
              />
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleApproveForN8n}
                  disabled={queueing}
                  className="px-4 py-2 rounded-full bg-primary/90 text-primary-foreground text-sm hover:bg-primary transition disabled:opacity-50"
                >
                  {queueing ? "Queuing…" : "Approve & Send to n8n"}
                </button>
                {queued && (
                  <span className="text-xs text-primary">
                    ✓ Approved — queued for the next scheduled n8n run.
                  </span>
                )}
              </div>
            </div>

            {/* Substack Preview — the long-form newsletter version of this transit. */}
            <div className="mb-6 rounded-xl border border-accent/25 bg-accent/5 p-4">
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <h3 className="font-display text-sm uppercase tracking-[0.2em] text-accent">Substack Preview</h3>
                <button
                  type="button"
                  onClick={() => handleCopySubstack(editing)}
                  className="px-3 py-1.5 rounded-full border border-accent/40 text-accent text-xs hover:bg-accent/10 transition"
                >
                  Copy Substack post
                </button>
              </div>
              <p className="text-xs text-cream-muted/70 mb-3">
                Journal-style newsletter copy in Markdown. Paste straight into the Substack editor.
              </p>
              <textarea
                value={editing.substack_post || ""}
                onChange={(e) => setField("substack_post", e.target.value)}
                rows={10}
                placeholder="Substack copy is generated with the transit draft — or write it here."
                className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground font-mono focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Keywords (comma separated)</label>
              <input
                value={Array.isArray(editing.keywords) ? editing.keywords.join(", ") : ""}
                onChange={(e) =>
                  setField(
                    "keywords",
                    e.target.value
                      .split(",")
                      .map((k) => k.trim())
                      .filter(Boolean)
                  )
                }
                className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
              />
            </div>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Image URL</label>
                <input
                  value={editing.image_url || ""}
                  onChange={(e) => setField("image_url", e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Constellation Path</label>
                <input
                  value={editing.constellation_graphic_path || ""}
                  onChange={(e) => setField("constellation_graphic_path", e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                  placeholder="/assets/signs/Sign.png"
                />
              </div>
            </div>
            {resolveSignImage({
              imageUrl: editing.image_url,
              zodiacSignTag: editing.zodiac_sign_tag,
              constellationGraphicPath: editing.constellation_graphic_path,
            }) && (
              <div className="mb-4 rounded-xl border border-border/40 bg-[#0a0f1a] p-4 flex items-center justify-center">
                <img
                  src={resolveSignImage({
                    imageUrl: editing.image_url,
                    zodiacSignTag: editing.zodiac_sign_tag,
                    constellationGraphicPath: editing.constellation_graphic_path,
                  })!}
                  alt="Sign card preview"
                  className="max-h-40 object-contain"
                />
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <input
                id="featured"
                type="checkbox"
                checked={!!editing.featured}
                onChange={(e) => setField("featured", e.target.checked)}
                className="rounded border-border/50 bg-background/60"
              />
              <label htmlFor="featured" className="text-sm text-cream-muted">
                Featured post
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-full bg-primary/90 text-primary-foreground text-sm hover:bg-primary transition"
              >
                Save Post
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-5 py-2 rounded-full border border-border/50 text-cream-muted text-sm hover:text-foreground transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loadingPosts ? (
          <div className="py-12 flex justify-center">
            <MoonLoader size="md" text="Loading posts..." />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/40 bg-background/60">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-border/40 text-cream-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Scheduled</th>
                  <th className="px-4 py-3">Live Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-b border-border/30 last:border-0">
                    <td className="px-4 py-3 text-foreground">{p.title}</td>
                    <td className="px-4 py-3 text-cream-muted">{p.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${
                          p.status === "published"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : p.status === "approved"
                            ? "bg-primary/15 text-primary"
                            : "bg-cream-muted/10 text-cream-muted"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-cream-muted">
                      {displayDate(p.publish_at)}
                    </td>
                    <td className="px-4 py-3 text-cream-muted">
                      {displayDate(p.published_at)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => openEdit(p)} className="text-primary hover:underline text-xs">
                        Edit
                      </button>
                      {p.status !== "published" && (
                        <button
                          onClick={() => handleApproveAndPublish(p.id!)}
                          className="text-emerald-400 hover:underline text-xs"
                        >
                          Approve & Publish
                        </button>
                      )}
                      {p.status === "published" && (
                        <button
                          onClick={() => handleUnpublish(p.id!)}
                          className="text-amber-400 hover:underline text-xs"
                        >
                          Unpublish
                        </button>
                      )}
                      <button
                        onClick={() => handleCopyReddit(p)}
                        disabled={!p.reddit_post}
                        className={`text-xs hover:underline ${
                          p.reddit_post ? "text-primary" : "text-cream-muted/40 cursor-not-allowed"
                        }`}
                      >
                        {copiedId === p.id ? "Copied!" : "Copy Reddit Post"}
                      </button>
                      {resolveSignImage({
                        imageUrl: p.image_url,
                        zodiacSignTag: p.zodiac_sign_tag,
                        constellationGraphicPath: p.constellation_graphic_path,
                      }) && (
                        <button
                          onClick={() => handleDownloadImage(p)}
                          className="text-xs text-primary hover:underline"
                        >
                          {downloadId === p.id ? "Downloaded!" : "Get Image"}
                        </button>
                      )}
                      <button onClick={() => handleDelete(p.id!)} className="text-red-400 hover:underline text-xs">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default BlogAdmin;
