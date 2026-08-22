import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Search, ArrowUpDown, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import MoonLoader from "@/components/MoonLoader";
import ScheduledPublishPicker from "@/components/admin/ScheduledPublishPicker";
import ResponsiveModal from "@/components/ui/responsive-modal";
import {
  listAllPosts,
  upsertPost,
  deletePost,
  publishPostNow,
  unpublishPost,
  schedulePost,
  BlogPostRow,
  BlogCategory,
  CATEGORIES,
  SIGNS,
  signImageUrl,
  resolveSignImage,
  scheduleChannel,
  setChannelSent,
  ChannelStatus,
} from "@/lib/blog/posts";
import { markdownToHtml, markdownToPlainText } from "@/lib/blog/markdownToHtml";
import ChannelMatrix, { countMissed, Channel } from "@/components/admin/ChannelMatrix";
import DispatchPreview from "@/components/admin/DispatchPreview";

/** Yellow SCHEDULED pill used inside the editor's Substack panel. */
const ChannelBadge = ({ status }: { status?: ChannelStatus | string | null }) => {
  const s = status || "draft";
  const cls =
    s === "scheduled"
      ? "bg-yellow-400/15 text-yellow-300 font-semibold"
      : s === "sent" || s === "published"
      ? "bg-emerald-500/15 text-emerald-400"
      : s === "approved"
      ? "bg-primary/15 text-primary"
      : "bg-cream-muted/10 text-cream-muted";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${cls}`}>
      {s === "scheduled" ? "SCHEDULED" : s}
    </span>
  );
};

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

const FIELD =
  "w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none";
const LABEL = "block text-xs uppercase tracking-wider text-cream-muted mb-1";

const BlogAdmin = () => {
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [substackCopiedId, setSubstackCopiedId] = useState<string | null>(null);
  const [redditCopiedId, setRedditCopiedId] = useState<string | null>(null);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<"substack" | "reddit" | null>(null);
  const [filling, setFilling] = useState(false);
  const [telegramTesting, setTelegramTesting] = useState(false);
  // Substack hand-off. The n8n webhook URL is a per-browser admin setting so it
  // can be swapped between test and production workflows without a redeploy.
  const DEFAULT_SUBSTACK_HOOK = "http://192.241.153.228:8055/webhook/substack-post";
  const [substackHook, setSubstackHook] = useState(() => {
    const stored = localStorage.getItem("moonday.substackWebhook");
    // Migrate the retired /substack-approval path to the live /substack-post one.
    if (!stored || stored.includes("/webhook/substack-approval")) return DEFAULT_SUBSTACK_HOOK;
    return stored;
  });
  const [substackSending, setSubstackSending] = useState(false);
  const [substackSent, setSubstackSent] = useState(false);
  // Email-to-draft bridge (manual rerun; it also fires automatically on publish).
  const [bridgeSending, setBridgeSending] = useState(false);
  const [bridgeSent, setBridgeSent] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "queue" | "all" | "draft" | "approved" | "scheduled" | "published" | "missed"
  >("queue");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [redditScheduleTarget, setRedditScheduleTarget] = useState<BlogPostRow | null>(null);
  const [redditScheduleIso, setRedditScheduleIso] = useState<string | null>(null);
  const [redditSendingId, setRedditSendingId] = useState<string | null>(null);
  const [substackScheduleTarget, setSubstackScheduleTarget] = useState<BlogPostRow | null>(null);
  const [substackScheduleIso, setSubstackScheduleIso] = useState<string | null>(null);
  const [substackSendingId, setSubstackSendingId] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<BlogPostRow | null>(null);
  const [rescheduleIso, setRescheduleIso] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<{ post: BlogPostRow; channel: Channel } | null>(
    null,
  );

  const setField = <K extends keyof BlogPostRow>(key: K, value: BlogPostRow[K] | null) => {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const openEdit = (post: BlogPostRow) => {
    setSubstackSent(false);
    // Show the stored newsletter as-is. We deliberately no longer derive it
    // from the article body — that produced a Substack edition identical to the
    // blog post. Empty rows use "Regenerate newsletter" instead.
    setEditing({ ...post });
  };

  // Telegram deep links land here as /admin/blog?post=<id>. Open that post's
  // editor as soon as the list has loaded, then drop the param so a refresh
  // does not reopen it. We also widen the filter/search so the row is visible
  // in the table behind the editor (e.g. an already-published transit).
  useEffect(() => {
    const wanted = searchParams.get("post");
    if (!wanted || editing || posts.length === 0) return;
    const match = posts.find((p) => p.id === wanted);
    if (match) {
      setStatusFilter("all");
      setSearchQuery("");
      openEdit(match);
      searchParams.delete("post");
      setSearchParams(searchParams, { replace: true });
    } else {
      setMessage("That post is no longer in the Journal — it may have been deleted.");
      searchParams.delete("post");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, searchParams]);


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

  // Confirms the Telegram bot can actually reach you, without waiting for a
  // real transit to fire.
  const handleTestTelegram = async () => {
    setTelegramTesting(true);
    setMessage("Pinging Telegram…");
    try {
      const { data, error } = await supabase.functions.invoke("telegram-notify", {
        body: { kind: "test" },
      });
      if (error) throw error;
      setMessage(
        data?.sent
          ? "Telegram test sent — check your chat with the bot."
          : `Telegram did not send: ${data?.error || "unknown reason"}`,
      );
    } catch (err: any) {
      setMessage(`Telegram test failed: ${err.message}`);
    } finally {
      setTelegramTesting(false);
    }
  };

  // Manual posting hand-off: flags Substack as sent (or reverts it) so the
  // matrix reflects what has actually gone out.
  const handleToggleChannelSent = async (post: BlogPostRow, channel: "substack" | "reddit") => {
    const isSent =
      channel === "reddit" ? post.reddit_status === "sent" : post.substack_status === "sent";
    const label = channel === "reddit" ? "Reddit post" : "Substack edition";
    try {
      await setChannelSent(post.id!, channel, !isSent);
      setMessage(isSent ? `${label} reverted to draft.` : `Marked as posted on ${channel === "reddit" ? "Reddit" : "Substack"}.`);
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
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

  // Copies the Substack newsletter copy as rich text so the editor renders
  // real headings/links instead of raw Markdown hash marks.
  const handleCopySubstack = async (post: Partial<BlogPostRow>) => {
    const text = post.substack_post?.trim();
    if (!text) {
      setMessage("No Substack copy on this post yet.");
      return;
    }
    const html = markdownToHtml(text);
    const plain = markdownToPlainText(text);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      setMessage("Substack copy copied as formatted text — paste straight in.");
    } catch {
      await navigator.clipboard.writeText(plain);
      setMessage("Substack copy copied as plain text.");
    }
    setSubstackCopiedId(post.id || null);
    setTimeout(() => setSubstackCopiedId((cur) => (cur === post.id ? null : cur)), 2000);
  };

  // Reddit is plain-text only — copy it verbatim, no Markdown conversion.
  const handleCopyReddit = async (post: Partial<BlogPostRow>) => {
    const text = post.reddit_post?.trim();
    if (!text) {
      setMessage("No Reddit copy on this post yet.");
      return;
    }
    await navigator.clipboard.writeText(text);
    setMessage("Reddit post copied.");
    setRedditCopiedId(post.id || null);
    setTimeout(() => setRedditCopiedId((cur) => (cur === post.id ? null : cur)), 2000);
  };

  // Saves the reviewed Substack copy, then hands it off to the backend edge
  // function, which forwards it to the n8n webhook (avoiding the HTTPS→HTTP
  // mixed-content block that would occur in the browser).
  const handleApproveSubstack = async () => {
    if (!editing) return;
    const body = editing.substack_post?.trim();
    if (!body) {
      setMessage("Draft the Substack copy first — the preview is empty.");
      return;
    }
    setSubstackSending(true);
    setSubstackSent(false);
    try {
      const scheduledIso = editing.substack_scheduled_at || null;
      const isQueued = !!scheduledIso && new Date(scheduledIso).getTime() > Date.now();
      const saved = await upsertPost({
        ...editing,
        substack_status: isQueued ? "scheduled" : "sent",
        substack_sent_at: isQueued ? null : new Date().toISOString(),
      });
      setEditing(saved);
      const payload = {
        source: "moonday-admin",
        type: "substack",
        post_id: saved.id,
        slug: saved.slug,
        title: saved.title,
        excerpt: saved.excerpt,
        zodiac_sign_tag: saved.zodiac_sign_tag,
        image_url: resolveSignImage({
          imageUrl: saved.image_url,
          zodiacSignTag: saved.zodiac_sign_tag,
          constellationGraphicPath: saved.constellation_graphic_path,
        }),
        publish_at: saved.publish_at,
        substack_post: saved.substack_post,
        substack_status: saved.substack_status,
        scheduled_at: saved.substack_scheduled_at ?? null,
        sent_at: new Date().toISOString(),
        webhook_url: substackHook.trim() || undefined,
      };
      const { error } = await supabase.functions.invoke("substack-approval", { body: payload });
      if (error) throw error;
      localStorage.setItem("moonday.substackWebhook", substackHook);
      setSubstackSent(true);
      setMessage("Substack draft sent — check your Substack dashboard to review and publish.");
      refetch();
    } catch (err: any) {
      setMessage(`Substack send failed: ${err.message}`);
    } finally {
      setSubstackSending(false);
    }
  };

  // Regenerates channel copy with the AI generator so each platform gets a
  // genuinely distinct piece (the old behaviour just re-wrapped the blog body,
  // which is why Substack read identically to the website article).

  // Email-to-draft bridge. Sends the current saved edition to the admin inbox
  // pre-formatted so Substack is a paste, not a rebuild. Runs automatically on
  // publish; this button is for reruns after an edit.
  const handleEmailSubstackDraft = async () => {
    if (!editing?.id) {
      setMessage("Save the post first, then email the draft.");
      return;
    }
    setBridgeSending(true);
    setBridgeSent(false);
    setMessage("Emailing the formatted Substack draft…");
    try {
      const { data, error } = await supabase.functions.invoke("substack-bridge-send", {
        body: { post_id: editing.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBridgeSent(true);
      setEditing((prev) =>
        prev ? { ...prev, substack_bridge_sent_at: new Date().toISOString() } : prev,
      );
      setMessage("Formatted draft sent to your inbox.");
      refetch();
    } catch (err: any) {
      setMessage(`Could not email the draft: ${err.message}`);
    } finally {
      setBridgeSending(false);
    }
  };

  const handleRegenerateChannel = async (channel: "substack" | "reddit") => {
    if (!editing?.id) {
      setMessage("Save the post first, then regenerate.");
      return;
    }
    setRegenerating(channel);
    setMessage(`Regenerating the ${channel === "reddit" ? "Reddit" : "Substack"} edition…`);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-channel-copy", {
        body: { post_id: editing.id, channels: [channel] },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setEditing((prev) =>
        prev
          ? {
              ...prev,
              substack_post: data?.substack_post ?? prev.substack_post,
              reddit_post: data?.reddit_post ?? prev.reddit_post,
            }
          : prev,
      );
      setSubstackSent(false);
      setMessage(`${channel === "reddit" ? "Reddit" : "Substack"} copy regenerated.`);
      refetch();
    } catch (err: any) {
      setMessage(`Regeneration failed: ${err.message}`);
    } finally {
      setRegenerating(null);
    }
  };

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

  const handleUnpublish = async (id: string) => {
    if (!confirm("Unpublish this post? It will revert to draft and be hidden from the public blog."))
      return;
    try {
      await unpublishPost(id);
      setMessage("Post unpublished and reverted to draft.");
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  /** Retracts a scheduled blog post back to draft (keeps the time for re-use). */
  const handleUnscheduleBlog = async (id: string) => {
    if (!confirm("Unschedule this post? It reverts to draft and will not auto-publish.")) return;
    try {
      await unpublishPost(id);
      setMessage("Blog post unscheduled — back in Drafts.");
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  /** Retracts a scheduled Substack or Reddit edition back to draft. */
  const handleUnscheduleChannel = async (id: string, channel: "substack" | "reddit") => {
    const label = channel === "reddit" ? "Reddit post" : "Substack edition";
    if (!confirm(`Unschedule the ${label}? It reverts to draft.`)) return;
    try {
      await scheduleChannel(id, channel, null);
      setMessage(`${label} unscheduled — back to draft.`);
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  /** One-tap approval: the Reddit edition inherits the transit's publish time. */
  const openRedditSchedule = async (p: BlogPostRow) => {
    const iso = p.publish_at || null;
    if (!iso || new Date(iso).getTime() <= Date.now()) {
      await handleSendRedditNow(p);
      return;
    }
    try {
      await scheduleChannel(p.id!, "reddit", iso);
      setMessage(`Reddit approved — auto-posts at the transit (${displayDate(iso)}).`);
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  /** Sends the Reddit payload to the approval webhook right now. */
  const handleSendRedditNow = async (post: BlogPostRow) => {
    if (!post.reddit_post?.trim()) {
      setMessage("No Reddit copy on this post yet.");
      return;
    }
    setRedditSendingId(post.id || null);
    setMessage("Sending the Reddit post to the approval webhook…");
    try {
      const { data, error } = await supabase.functions.invoke("reddit-auto-post", {
        body: { post_id: post.id, force: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessage(
        data?.skipped
          ? `Reddit dispatch skipped: ${data.reason}`
          : "Reddit post sent to the approval webhook.",
      );
      refetch();
    } catch (err: any) {
      setMessage(`Reddit dispatch failed: ${err.message}`);
    } finally {
      setRedditSendingId(null);
    }
  };

  const confirmRedditSchedule = async () => {
    if (!redditScheduleTarget || !redditScheduleIso) return;
    try {
      if (new Date(redditScheduleIso).getTime() <= Date.now()) {
        const target = redditScheduleTarget;
        setRedditScheduleTarget(null);
        await handleSendRedditNow(target);
        return;
      }
      await scheduleChannel(redditScheduleTarget.id!, "reddit", redditScheduleIso);
      setMessage(`Reddit post queued for ${displayDate(redditScheduleIso)}.`);
      setRedditScheduleTarget(null);
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  /** One-tap approval: the Substack edition inherits the transit's publish time. */
  const openSubstackSchedule = async (p: BlogPostRow) => {
    const iso = p.publish_at || null;
    if (!iso || new Date(iso).getTime() <= Date.now()) {
      await handleSendSubstackNow(p);
      return;
    }
    try {
      await scheduleChannel(p.id!, "substack", iso);
      setMessage(`Substack approved — auto-sends at the transit (${displayDate(iso)}).`);
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  /** Sends the Substack payload to the n8n webhook right now. */
  const handleSendSubstackNow = async (post: BlogPostRow) => {
    if (!post.substack_post?.trim()) {
      setMessage("No newsletter copy on this post yet.");
      return;
    }
    setSubstackSendingId(post.id || null);
    setMessage("Sending the Substack edition to the n8n webhook…");
    try {
      const { data, error } = await supabase.functions.invoke("substack-auto-post", {
        body: { post_id: post.id, force: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessage(
        data?.skipped
          ? `Substack dispatch skipped: ${data.reason}`
          : "Substack edition sent to the n8n webhook.",
      );
      refetch();
    } catch (err: any) {
      setMessage(`Substack dispatch failed: ${err.message}`);
    } finally {
      setSubstackSendingId(null);
    }
  };

  const confirmSubstackSchedule = async () => {
    if (!substackScheduleTarget || !substackScheduleIso) return;
    try {
      if (new Date(substackScheduleIso).getTime() <= Date.now()) {
        const target = substackScheduleTarget;
        setSubstackScheduleTarget(null);
        await handleSendSubstackNow(target);
        return;
      }
      await scheduleChannel(substackScheduleTarget.id!, "substack", substackScheduleIso);
      setMessage(`Substack edition queued for ${displayDate(substackScheduleIso)}.`);
      setSubstackScheduleTarget(null);
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };


  const openReschedule = (p: BlogPostRow) => {
    setRescheduleTarget(p);
    setRescheduleIso(p.publish_at || null);
  };

  const confirmReschedule = async () => {
    if (!rescheduleTarget || !rescheduleIso) return;
    setRescheduling(true);
    try {
      if (new Date(rescheduleIso).getTime() <= Date.now()) {
        await publishPostNow(rescheduleTarget.id!);
        setMessage("That time has passed — published live now.");
      } else {
        await schedulePost(rescheduleTarget.id!, rescheduleIso);
        setMessage(`Scheduled for ${displayDate(rescheduleIso)}.`);
      }
      setRescheduleTarget(null);
      refetch();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setRescheduling(false);
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

  // A post "needs attention" when a channel missed its instant.
  const hasMissed = (p: BlogPostRow) => countMissed([p]) > 0;

  const counts = {
    queue: posts.filter((p) => p.status !== "published").length,
    all: posts.length,
    missed: posts.filter(hasMissed).length,
    draft: posts.filter((p) => p.status === "draft").length,
    approved: posts.filter((p) => p.status === "approved").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
  };

  const sortKey = (p: BlogPostRow) => {
    const t = new Date(p.publish_at || p.published_at || p.created_at || 0).getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  const matchesSearch = (p: BlogPostRow) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const hay = [
      p.title,
      p.excerpt,
      p.slug,
      p.category,
      p.zodiac_sign_tag,
      Array.isArray(p.keywords) ? p.keywords.join(" ") : "",
      p.content,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  };

  const visiblePosts = [...posts]
    .filter((p) =>
      statusFilter === "all"
        ? true
        : statusFilter === "queue"
        ? p.status !== "published"
        : statusFilter === "missed"
        ? hasMissed(p)
        : p.status === statusFilter,
    )
    .filter(matchesSearch)
    .sort((a, b) => (sortDirection === "asc" ? sortKey(a) - sortKey(b) : sortKey(b) - sortKey(a)));

  const FILTERS: { key: typeof statusFilter; label: string }[] = [
    { key: "approved", label: "Approved" },
    { key: "scheduled", label: "Scheduled" },
    { key: "draft", label: "Drafts" },
    { key: "queue", label: "Review queue" },
    { key: "missed", label: "Not sent" },
    { key: "published", label: "Published" },
    { key: "all", label: "All" },
  ];

  const signImagePreview = editing
    ? resolveSignImage({
        imageUrl: editing.image_url,
        zodiacSignTag: editing.zodiac_sign_tag,
        constellationGraphicPath: editing.constellation_graphic_path,
      })
    : null;

  return (
    <PageLayout>
      <SEO
        title="Journal Admin — Moonday Live"
        description="Manage and approve Journal posts for Moonday Live."
        canonical="https://moondaylive.com/admin/blog"
      />
      <div className="w-full max-w-5xl mx-auto py-8 px-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="font-display text-2xl md:text-3xl text-foreground">Journal Admin</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTestTelegram}
              disabled={telegramTesting}
              className="inline-flex items-center gap-2 min-h-[44px] sm:min-h-0 px-4 py-2 rounded-full border border-sky-400/40 text-sky-400 text-sm hover:bg-sky-400/10 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {telegramTesting ? "Pinging…" : "Test Telegram"}
            </button>
            <button
              onClick={handleFillSchedule}
              disabled={filling}
              className="min-h-[44px] sm:min-h-0 px-4 py-2 rounded-full border border-primary/40 text-primary text-sm hover:bg-primary/10 transition disabled:opacity-50"
            >
              {filling ? "Drafting…" : "Fill Transit Schedule (30d)"}
            </button>
            <button
              onClick={openNew}
              className="min-h-[44px] sm:min-h-0 px-4 py-2 rounded-full bg-primary/90 text-primary-foreground text-sm hover:bg-primary transition"
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

        {countMissed(posts) > 0 && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex flex-wrap items-center justify-between gap-3">
            <span>
              {countMissed(posts)} channel {countMissed(posts) === 1 ? "post" : "posts"} did not go
              out on time.
            </span>
            <button
              onClick={() => setStatusFilter("missed")}
              className="text-xs underline hover:no-underline whitespace-nowrap"
            >
              Show them
            </button>
          </div>
        )}

        <div className="mb-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts by title, sign, keyword..."
              aria-label="Search posts"
              className="w-full h-11 pl-10 pr-4 rounded-full bg-background/70 border border-border/50 text-foreground placeholder:text-cream-muted/60 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition text-sm"
            />
          </div>
        </div>

        {/* Horizontally scrollable on narrow screens so every filter stays
            reachable instead of wrapping into a wall of chips. */}
        <div className="mb-4 -mx-1 px-1 overflow-x-auto sm:overflow-visible">
          <div className="flex gap-2 sm:flex-wrap w-max sm:w-auto pb-1">
            <button
              onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
              className="inline-flex items-center gap-2 shrink-0 px-3 py-2 rounded-full border border-border/40 text-cream-muted text-xs hover:text-foreground transition"
              aria-label="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortDirection === "asc" ? "Oldest first" : "Newest first"}
            </button>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`shrink-0 px-3 py-2 rounded-full text-xs border transition ${
                  statusFilter === f.key
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border/40 text-cream-muted hover:text-foreground"
                }`}
              >
                {f.label} ({counts[f.key]})
              </button>
            ))}
          </div>
        </div>

        {loadingPosts ? (
          <div className="py-12 flex justify-center">
            <MoonLoader size="md" text="Loading posts..." />
          </div>
        ) : (
          <ChannelMatrix
            posts={visiblePosts}
            displayDate={displayDate}
            substackCopiedId={substackCopiedId}
            redditCopiedId={redditCopiedId}
            downloadId={downloadId}
            onEdit={openEdit}
            onDelete={handleDelete}
            onDownloadImage={handleDownloadImage}
            onPublishNow={handleApproveAndPublish}
            onSchedule={openReschedule}
            onUnscheduleBlog={handleUnscheduleBlog}
            onUnpublish={handleUnpublish}
            onUnscheduleChannel={handleUnscheduleChannel}
            onScheduleReddit={openRedditSchedule}
            onSendRedditNow={handleSendRedditNow}
            redditSendingId={redditSendingId}
            onScheduleSubstack={openSubstackSchedule}
            onSendSubstackNow={handleSendSubstackNow}
            substackSendingId={substackSendingId}
            onToggleSent={handleToggleChannelSent}
            onCopySubstack={handleCopySubstack}
            onCopyReddit={handleCopyReddit}
            onPreviewPayload={(post, channel) => setPreviewTarget({ post, channel })}
          />
        )}

        {/* Post editor — dialog on desktop, full-height drawer on mobile. */}
        <ResponsiveModal
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          title={editing?.id ? "Edit Post" : "New Post"}
          description={editing?.title || undefined}
          className="sm:max-w-3xl"
          footer={
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none min-h-[44px] px-5 rounded-full bg-primary/90 text-primary-foreground text-sm hover:bg-primary transition"
              >
                Save Post
              </button>
              <button
                onClick={() => setEditing(null)}
                className="flex-1 sm:flex-none min-h-[44px] px-5 rounded-full border border-border/50 text-cream-muted text-sm hover:text-foreground transition"
              >
                Cancel
              </button>
            </div>
          }
        >
          {editing && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={LABEL}>Slug</label>
                  <input
                    value={editing.slug || ""}
                    onChange={(e) => setField("slug", e.target.value)}
                    className={FIELD}
                    placeholder="unified-daily-moon-tracker"
                  />
                </div>
                <div>
                  <label className={LABEL}>Title</label>
                  <input
                    value={editing.title || ""}
                    onChange={(e) => setField("title", e.target.value)}
                    className={FIELD}
                  />
                </div>
                <div>
                  <label className={LABEL}>Category</label>
                  <select
                    value={editing.category || "Guides"}
                    onChange={(e) => setField("category", e.target.value as BlogCategory)}
                    className={FIELD}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Zodiac Sign Tag</label>
                  <select
                    value={editing.zodiac_sign_tag || ""}
                    onChange={(e) => {
                      const sign = e.target.value;
                      setEditing((prev) => {
                        if (!prev) return prev;
                        const img = sign ? signImageUrl(sign) : "";
                        const graphic = sign ? `/assets/signs/${sign}.png` : "";
                        return {
                          ...prev,
                          zodiac_sign_tag: sign,
                          image_url: img,
                          constellation_graphic_path: graphic,
                        };
                      });
                    }}
                    className={FIELD}
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
                  <label className={LABEL}>Author</label>
                  <input
                    value={editing.author || ""}
                    onChange={(e) => setField("author", e.target.value)}
                    className={FIELD}
                  />
                </div>
                <div>
                  <label className={LABEL}>Reviewed By</label>
                  <input
                    value={editing.reviewed_by || ""}
                    onChange={(e) => setField("reviewed_by", e.target.value)}
                    className={FIELD}
                    placeholder="Astrologer who reviewed this post"
                  />
                </div>
                <div>
                  <label className={LABEL}>Read Time (min)</label>
                  <input
                    type="number"
                    value={editing.read_time || 4}
                    onChange={(e) => setField("read_time", Number(e.target.value))}
                    className={FIELD}
                  />
                </div>
                <div>
                  <label className={LABEL}>Status</label>
                  <select
                    value={editing.status || "draft"}
                    onChange={(e) => setField("status", e.target.value as any)}
                    className={FIELD}
                  >
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL}>Scheduled Publish Date &amp; Time</label>
                  <ScheduledPublishPicker value={editing.publish_at} onChange={handleScheduleChange} />
                </div>
                <div>
                  <label className={LABEL}>Published At (live date shown)</label>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocalValue(editing.published_at)}
                    onChange={(e) => setField("published_at", fromDatetimeLocalValue(e.target.value))}
                    className={FIELD}
                  />
                </div>
                <div>
                  <label className={LABEL}>CTA Type</label>
                  <select
                    value={editing.cta_type || "none"}
                    onChange={(e) => setField("cta_type", e.target.value as any)}
                    className={FIELD}
                  >
                    <option value="none">None</option>
                    <option value="birthday-calculator">Birthday Calculator</option>
                    <option value="dashboard">Dashboard</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className={LABEL}>Excerpt</label>
                <textarea
                  value={editing.excerpt || ""}
                  onChange={(e) => setField("excerpt", e.target.value)}
                  rows={2}
                  className={FIELD}
                />
              </div>
              <div className="mb-4">
                <label className={LABEL}>Content (Markdown)</label>
                <textarea
                  value={editing.content || ""}
                  onChange={(e) => setField("content", e.target.value)}
                  rows={12}
                  className={`${FIELD} font-mono`}
                />
              </div>

              {/* Substack Preview — the long-form newsletter version. */}
              <div className="mb-6 rounded-xl border border-accent/25 bg-accent/5 p-4">
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <h3 className="font-display text-sm uppercase tracking-[0.2em] text-accent">
                    Substack Preview
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleRegenerateChannel("substack")}
                      disabled={regenerating !== null}
                      className="min-h-[40px] px-3 rounded-full border border-accent/40 text-accent text-xs hover:bg-accent/10 transition disabled:opacity-50"
                    >
                      {regenerating === "substack" ? "Regenerating…" : "Regenerate newsletter"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopySubstack(editing)}
                      className="min-h-[40px] px-3 rounded-full border border-accent/40 text-accent text-xs hover:bg-accent/10 transition"
                    >
                      Copy Substack post
                    </button>
                  </div>
                </div>
                <p className="text-xs text-cream-muted/70 mb-3">
                  Long-form macro newsletter in Markdown — distinct from the website article. Paste
                  straight into the Substack editor.
                </p>
                <textarea
                  value={editing.substack_post || ""}
                  onChange={(e) => setField("substack_post", e.target.value)}
                  rows={14}
                  placeholder="Substack copy is generated with the transit draft — or write it here."
                  className={`${FIELD} font-mono`}
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-xs uppercase tracking-wider text-cream-muted">
                      Substack delivery
                    </label>
                    <ChannelBadge status={editing.substack_status} />
                  </div>
                  <p className="text-xs text-cream-muted/80">
                    Goes out with the transit: {editing.publish_at ? displayDate(editing.publish_at) : "as soon as the blog publishes"}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const approved = editing.substack_status === "scheduled";
                      setEditing((prev) =>
                        prev
                          ? {
                              ...prev,
                              substack_scheduled_at: approved ? prev.substack_scheduled_at : prev.publish_at ?? null,
                              substack_status: approved ? "draft" : "scheduled",
                            }
                          : prev,
                      );
                      setSubstackSent(false);
                    }}
                    className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs uppercase tracking-wider text-foreground hover:bg-primary/20"
                  >
                    {editing.substack_status === "scheduled" ? "Approved — undo" : "Approve for this transit"}
                  </button>
                  <p className="text-xs text-cream-muted/60">
                    Once approved it dispatches automatically at the transit time — no separate date to pick.
                  </p>
                </div>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className={LABEL}>n8n Substack webhook URL</label>
                    <input
                      value={substackHook}
                      onChange={(e) => {
                        setSubstackHook(e.target.value);
                        setSubstackSent(false);
                      }}
                      placeholder="https://your-n8n-instance/webhook/moonday-substack"
                      className={FIELD}
                    />
                    <p className="text-xs text-cream-muted/60 mt-1">
                      Production sends route through the backend to avoid mixed-content/CORS issues.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={handleApproveSubstack}
                      disabled={substackSending}
                      className="min-h-[44px] px-4 rounded-full bg-accent/90 text-accent-foreground text-sm hover:bg-accent transition disabled:opacity-50"
                    >
                      {substackSending ? "Sending…" : "Approve & Send to Substack"}
                    </button>
                    {substackSent && (
                      <span className="text-xs text-accent">✓ Draft sent — check Substack.</span>
                    )}
                  </div>
                </div>

                {/* Email-to-draft bridge: fires automatically on publish, this
                    is the manual rerun after an edit. */}
                <div className="mt-4 rounded-lg border border-accent/20 bg-background/40 p-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={handleEmailSubstackDraft}
                      disabled={bridgeSending || !editing.substack_post?.trim()}
                      className="min-h-[44px] px-4 rounded-full border border-accent/40 text-accent text-sm hover:bg-accent/10 transition disabled:opacity-50"
                    >
                      {bridgeSending ? "Emailing…" : "Email me the formatted draft"}
                    </button>
                    {bridgeSent && (
                      <span className="text-xs text-accent">✓ Sent — paste it into Substack.</span>
                    )}
                  </div>
                  <p className="text-xs text-cream-muted/60 mt-2">
                    Sends this edition to your inbox with headings and emphasis already
                    applied — select all, paste into Substack, hit send. This happens
                    automatically the moment the post publishes.
                    {editing.substack_bridge_sent_at && (
                      <>
                        {" "}Last sent{" "}
                        {new Date(editing.substack_bridge_sent_at).toLocaleString()}.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Reddit copy — deliberately its own voice, not the blog intro. */}
              <div className="mb-6 rounded-xl border border-border/40 bg-background/40 p-4">
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <h3 className="font-display text-sm uppercase tracking-[0.2em] text-cream-muted">
                    Reddit Post
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <ChannelBadge status={editing.reddit_status} />
                    <button
                      type="button"
                      onClick={() => handleRegenerateChannel("reddit")}
                      disabled={regenerating !== null}
                      className="min-h-[40px] px-3 rounded-full border border-border/50 text-cream-muted text-xs hover:bg-white/5 transition disabled:opacity-50"
                    >
                      {regenerating === "reddit" ? "Regenerating…" : "Regenerate Reddit post"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const text = editing.reddit_post?.trim();
                        if (!text) {
                          setMessage("No Reddit copy on this post yet.");
                          return;
                        }
                        await navigator.clipboard.writeText(text);
                        setMessage("Reddit copy copied — title on line one, body below.");
                      }}
                      className="min-h-[40px] px-3 rounded-full border border-border/50 text-cream-muted text-xs hover:bg-white/5 transition"
                    >
                      Copy Reddit post
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const posted = editing.reddit_status === "sent";
                        setEditing((prev) =>
                          prev
                            ? {
                                ...prev,
                                reddit_status: posted ? "draft" : "sent",
                                reddit_posted_at: posted ? null : new Date().toISOString(),
                              }
                            : prev,
                        );
                      }}
                      className="min-h-[40px] px-3 rounded-full border border-border/50 text-cream-muted text-xs hover:bg-white/5 transition"
                    >
                      {editing.reddit_status === "sent" ? "Mark not posted" : "Mark posted"}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-cream-muted/70 mb-3">
                  First line is the Reddit title, blank line, then the body. Written for the feed —
                  it should not share an opening with the article or the newsletter.
                </p>
                <textarea
                  value={editing.reddit_post || ""}
                  onChange={(e) => setField("reddit_post", e.target.value)}
                  rows={8}
                  placeholder="Reddit copy is generated with the transit draft — or write it here."
                  className={`${FIELD} font-mono`}
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-xs uppercase tracking-wider text-cream-muted">
                      Reddit delivery
                    </label>
                    <ChannelBadge status={editing.reddit_status} />
                  </div>
                  <p className="text-xs text-cream-muted/80">
                    Goes out with the transit: {editing.publish_at ? displayDate(editing.publish_at) : "as soon as the blog publishes"}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const approved = editing.reddit_status === "scheduled";
                      setEditing((prev) =>
                        prev
                          ? {
                              ...prev,
                              reddit_scheduled_at: approved ? prev.reddit_scheduled_at : prev.publish_at ?? null,
                              reddit_status: approved ? "draft" : "scheduled",
                            }
                          : prev,
                      );
                    }}
                    className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs uppercase tracking-wider text-foreground hover:bg-primary/20"
                  >
                    {editing.reddit_status === "scheduled" ? "Approved — undo" : "Approve for this transit"}
                  </button>
                  <p className="text-xs text-cream-muted/60">
                    Once approved it dispatches automatically at the transit time — no separate date to pick.
                  </p>
                </div>
              </div>


              <div className="mb-4">
                <label className={LABEL}>Keywords (comma separated)</label>
                <input
                  value={Array.isArray(editing.keywords) ? editing.keywords.join(", ") : ""}
                  onChange={(e) =>
                    setField(
                      "keywords",
                      e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean),
                    )
                  }
                  className={FIELD}
                />
              </div>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Image URL</label>
                  <input
                    value={editing.image_url || ""}
                    onChange={(e) => setField("image_url", e.target.value)}
                    className={FIELD}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className={LABEL}>Constellation Path</label>
                  <input
                    value={editing.constellation_graphic_path || ""}
                    onChange={(e) => setField("constellation_graphic_path", e.target.value)}
                    className={FIELD}
                    placeholder="/assets/signs/Sign.png"
                  />
                </div>
              </div>
              {signImagePreview && (
                <div className="mb-4 rounded-xl border border-border/40 bg-[#0a0f1a] p-4 flex items-center justify-center">
                  <img
                    src={signImagePreview}
                    alt="Sign card preview"
                    className="max-h-40 object-contain"
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <input
                  id="featured"
                  type="checkbox"
                  checked={!!editing.featured}
                  onChange={(e) => setField("featured", e.target.checked)}
                  className="w-5 h-5 rounded border-border/50 bg-background/60"
                />
                <label htmlFor="featured" className="text-sm text-cream-muted">
                  Featured post
                </label>
              </div>
            </>
          )}
        </ResponsiveModal>

        {/* Schedule picker — same responsive shell. */}
        {/* Reddit scheduling — same flow as the blog's reschedule dialog. */}
        <ResponsiveModal
          open={!!redditScheduleTarget}
          onOpenChange={(open) => !open && setRedditScheduleTarget(null)}
          title="Schedule Reddit post"
          description={redditScheduleTarget?.title}
          footer={
            <div className="flex gap-3">
              <button
                onClick={confirmRedditSchedule}
                disabled={!redditScheduleIso}
                className="flex-1 sm:flex-none min-h-[44px] px-5 rounded-full bg-primary/90 text-primary-foreground text-sm hover:bg-primary transition disabled:opacity-50"
              >
                Confirm schedule
              </button>
              <button
                onClick={() => setRedditScheduleTarget(null)}
                className="flex-1 sm:flex-none min-h-[44px] px-5 rounded-full border border-border/50 text-cream-muted text-sm hover:text-foreground transition"
              >
                Cancel
              </button>
            </div>
          }
        >
          <ScheduledPublishPicker value={redditScheduleIso} onChange={setRedditScheduleIso} />
          {redditScheduleIso && (
            <p className="text-xs text-cream-muted mt-3">
              Sent to the approval webhook: {displayDate(redditScheduleIso)}
            </p>
          )}
        </ResponsiveModal>

        {/* Substack scheduling — identical controls to Reddit. */}
        <ResponsiveModal
          open={!!substackScheduleTarget}
          onOpenChange={(open) => !open && setSubstackScheduleTarget(null)}
          title="Schedule Substack edition"
          description={substackScheduleTarget?.title}
          footer={
            <div className="flex gap-3">
              <button
                onClick={confirmSubstackSchedule}
                disabled={!substackScheduleIso}
                className="flex-1 sm:flex-none min-h-[44px] px-5 rounded-full bg-primary/90 text-primary-foreground text-sm hover:bg-primary transition disabled:opacity-50"
              >
                Confirm schedule
              </button>
              <button
                onClick={() => setSubstackScheduleTarget(null)}
                className="flex-1 sm:flex-none min-h-[44px] px-5 rounded-full border border-border/50 text-cream-muted text-sm hover:text-foreground transition"
              >
                Cancel
              </button>
            </div>
          }
        >
          <ScheduledPublishPicker value={substackScheduleIso} onChange={setSubstackScheduleIso} />
          {substackScheduleIso && (
            <p className="text-xs text-cream-muted mt-3">
              Sent to the n8n webhook: {displayDate(substackScheduleIso)}
            </p>
          )}
        </ResponsiveModal>


        <ResponsiveModal
          open={!!rescheduleTarget}
          onOpenChange={(open) => !open && setRescheduleTarget(null)}
          title="Schedule publication"
          description={rescheduleTarget?.title}
          className="sm:max-w-md"
          footer={
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRescheduleTarget(null)}
                className="flex-1 sm:flex-none min-h-[44px] px-4 rounded-full border border-border/50 text-cream-muted text-sm hover:text-foreground transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmReschedule}
                disabled={!rescheduleIso || rescheduling}
                className="flex-1 sm:flex-none min-h-[44px] px-5 rounded-full bg-primary/90 text-primary-foreground text-sm hover:bg-primary transition disabled:opacity-50"
              >
                {rescheduling ? "Saving…" : "Confirm schedule"}
              </button>
            </div>
          }
        >
          <ScheduledPublishPicker value={rescheduleIso} onChange={setRescheduleIso} />
          {rescheduleIso && (
            <p className="text-xs text-cream-muted mt-3">Goes live: {displayDate(rescheduleIso)}</p>
          )}
        </ResponsiveModal>

        <ResponsiveModal
          open={!!previewTarget}
          onOpenChange={(open) => !open && setPreviewTarget(null)}
          title="Outgoing payload"
          description={previewTarget?.post.title}
          className="sm:max-w-3xl"
        >
          {previewTarget && (
            <DispatchPreview
              post={previewTarget.post}
              initialChannel={previewTarget.channel}
              displayDate={displayDate}
            />
          )}
        </ResponsiveModal>
      </div>

    </PageLayout>
  );
};

export default BlogAdmin;
