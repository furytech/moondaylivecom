import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import MoonLoader from "@/components/MoonLoader";
import {
  listAllPosts,
  upsertPost,
  deletePost,
  approvePost,
  publishPostNow,
  BlogPostRow,
  CATEGORIES,
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
  status: "draft",
  featured: false,
  cta_type: "none",
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

  if (checkingAdmin) {
    return (
      <PageLayout>
        <div className="py-20 flex justify-center">
          <MoonLoader size="md" text="Checking access..." />
        </div>
      </PageLayout>
    );
  }

  if (!isAdmin) {
    return (
      <PageLayout>
        <SEO title="Admin — Moonday Live" />
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

  const openNew = () => setEditing({ ...defaultPost });
  const openEdit = (post: BlogPostRow) => setEditing({ ...post });

  const setField = <K extends keyof BlogPostRow>(key: K, value: BlogPostRow[K]) => {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <PageLayout>
      <SEO title="Journal Admin — Moonday Live" canonical="https://moondaylive.com/admin/blog" />
      <div className="w-full max-w-5xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl md:text-3xl text-foreground">Journal Admin</h1>
          <button
            onClick={openNew}
            className="px-4 py-2 rounded-full bg-primary/90 text-primary-foreground text-sm hover:bg-primary transition"
          >
            + New Post
          </button>
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
                  onChange={(e) => setField("category", e.target.value)}
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
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Author</label>
                <input
                  value={editing.author || ""}
                  onChange={(e) => setField("author", e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
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
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Publish At</label>
                <input
                  type="datetime-local"
                  value={editing.publish_at ? editing.publish_at.slice(0, 16) : ""}
                  onChange={(e) => setField("publish_at", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
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
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wider text-cream-muted mb-1">Image URL</label>
              <input
                value={editing.image_url || ""}
                onChange={(e) => setField("image_url", e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                placeholder="https://..."
              />
            </div>
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
                  <th className="px-4 py-3">Publish At</th>
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
                      {p.publish_at ? new Date(p.publish_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(p)} className="text-primary hover:underline text-xs">
                        Edit
                      </button>
                      {p.status === "draft" && (
                        <button onClick={() => handleApprove(p.id!)} className="text-primary hover:underline text-xs">
                          Approve
                        </button>
                      )}
                      {p.status !== "published" && (
                        <button onClick={() => handlePublishNow(p.id!)} className="text-emerald-400 hover:underline text-xs">
                          Publish Now
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
