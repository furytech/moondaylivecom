import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BlogPostRow } from "@/lib/blog/posts";
import {
  CHANNEL_KEYS,
  CHANNEL_LABEL,
  ChannelKey,
  SHARE_LABEL,
  postUrl,
  resolveZodiacAsset,
  shareIntentUrl,
  withCta,
} from "@/lib/channels";

/**
 * Transit feed for the admin panel.
 *
 * One card per transit. Inside it, one block per channel — Moonday Blog,
 * Reddit, Facebook/Instagram, Pinterest — each carrying its own draft, the
 * verified constellation thumbnail, a Copy Text control and a native Web Share
 * Intent. Automated channel publishers are gone; the blog is the only surface
 * this panel still publishes to directly.
 */

export type Channel = ChannelKey;
export const CHANNELS = CHANNEL_KEYS;

/** Draft copy for a channel, already wrapped with the top/bottom CTA. */
export const channelCopy = (post: BlogPostRow, channel: ChannelKey): string => {
  const raw =
    channel === "blog"
      ? post.content
      : channel === "reddit"
      ? post.reddit_post
      : channel === "facebook"
      ? (post as unknown as Record<string, string | null>).facebook_post
      : (post as unknown as Record<string, string | null>).pinterest_post;
  return withCta(raw ?? "", postUrl(post));
};

/** A blog transit is "missed" when its instant has passed but it never went live. */
export const isMissed = (status: string | null | undefined, when: string | null | undefined) => {
  if (!when) return false;
  const t = new Date(when).getTime();
  if (Number.isNaN(t) || t > Date.now()) return false;
  return status !== "published";
};

/** Count of blog publications that should have gone out but did not. */
export const countMissed = (posts: BlogPostRow[]) =>
  posts.reduce(
    (total, p) =>
      total + (isMissed(p.status, p.status === "published" ? p.published_at : p.publish_at) ? 1 : 0),
    0,
  );

const relativeTime = (ms: number) => {
  const abs = Math.abs(ms);
  const s = Math.floor(abs / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const mo = Math.floor(d / 30);
  const y = Math.floor(d / 365);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (y > 0) return rtf.format(ms > 0 ? y : -y, "year");
  if (mo > 0) return rtf.format(ms > 0 ? mo : -mo, "month");
  if (d > 0) return rtf.format(ms > 0 ? d : -d, "day");
  if (h > 0) return rtf.format(ms > 0 ? h : -h, "hour");
  if (m > 0) return rtf.format(ms > 0 ? m : -m, "minute");
  return rtf.format(ms > 0 ? s : -s, "second");
};

const ApprovalPill = ({ status, deadline }: { status: string; deadline: Date }) => {
  const overdue = deadline.getTime() < Date.now() && status !== "published";
  const label = status === "draft" ? "Pending approval" : status;
  const cls = overdue
    ? "bg-red-500/15 text-red-300 font-semibold"
    : status === "draft" || status === "approved"
    ? "bg-amber-400/15 text-amber-300 font-semibold"
    : status === "scheduled"
    ? "bg-yellow-400/15 text-yellow-300 font-semibold"
    : "bg-emerald-500/15 text-emerald-400";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs uppercase tracking-wide ${cls}`}
      title={deadline.toISOString()}
    >
      {label}
    </span>
  );
};

const DeadlineBadge = ({ status, deadline }: { status: string; deadline: Date }) => {
  const now = Date.now();
  const due = deadline.getTime();
  if (status === "published") {
    return <span className="text-xs text-emerald-400">{relativeTime(due - now)}</span>;
  }
  const isPast = due < now;
  const cls = isPast ? "text-red-300" : "text-cream-muted";
  const prefix = isPast ? "Overdue" : status === "scheduled" ? "Publishing" : "Due";
  return (
    <span className={`text-xs ${cls}`} title={deadline.toISOString()}>
      {prefix} {relativeTime(due - now)}
    </span>
  );
};

type Tone = "primary" | "sky" | "emerald" | "amber" | "red";

const BORDER_TONES: Record<Tone, string> = {
  primary: "border-primary/70 text-primary hover:bg-primary/10",
  sky: "border-sky-400/70 text-sky-400 hover:bg-sky-400/10",
  emerald: "border-emerald-400/70 text-emerald-400 hover:bg-emerald-400/10",
  amber: "border-amber-400/70 text-amber-400 hover:bg-amber-400/10",
  red: "border-red-400/70 text-red-400 hover:bg-red-400/10",
};

/** Outlined pill. Same shape desktop and mobile, min 44px tap target on phones. */
const ActionBtn = ({
  children,
  onClick,
  href,
  tone = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  tone?: Tone;
  disabled?: boolean;
}) => {
  const cls = `inline-flex items-center justify-center min-h-[38px] rounded-full border-[1.75px] px-4 text-xs tracking-wide transition ${
    disabled ? "border-border/30 text-cream-muted/40 cursor-not-allowed" : BORDER_TONES[tone]
  }`;
  if (href && !disabled) {
    // Preview/admin runs inside an iframe; Facebook & co. refuse to be framed
    // (ERR_BLOCKED_BY_RESPONSE). Force a real top-level tab.
    const openExternal = (e: React.MouseEvent) => {
      e.preventDefault();
      const win = window.open(href, "_blank", "noopener,noreferrer");
      if (!win) {
        try {
          (window.top ?? window).location.href = href;
        } catch {
          window.location.href = href;
        }
      }
    };
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onClick={openExternal}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
};

export interface ChannelMatrixProps {
  posts: BlogPostRow[];
  displayDate: (value?: string | null) => string;
  downloadId: string | null;

  onEdit: (post: BlogPostRow) => void;
  onApprove?: (post: BlogPostRow) => void;
  onDelete: (id: string) => void;
  onDownloadImage: (post: BlogPostRow) => void;

  onPublishNow: (id: string) => void;
  blogPublishingId?: string | null;
  onSchedule: (post: BlogPostRow) => void;
  onUnscheduleBlog: (id: string) => void;
  onUnpublish: (id: string) => void;
}

const ChannelMatrix = ({
  posts,
  displayDate,
  downloadId,
  onEdit,
  onApprove,
  onDelete,
  onDownloadImage,
  onPublishNow,
  blogPublishingId,
  onSchedule,
  onUnscheduleBlog,
  onUnpublish,
}: ChannelMatrixProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [fbPostingId, setFbPostingId] = useState<string | null>(null);
  /** postId -> live Facebook URL on success, or `error:<msg>` on failure. */
  const [fbResults, setFbResults] = useState<Record<string, string>>({});

  // Direct Page publish through the facebook-post function (Graph API v20.0).
  // The Page token lives in backend secrets; this just passes the post id.
  const postToFacebook = async (p: BlogPostRow) => {
    if (!p.id || fbPostingId) return;
    setFbPostingId(p.id);
    setFbResults((r) => ({ ...r, [p.id!]: "" }));
    try {
      const { data, error } = await supabase.functions.invoke("facebook-post", {
        body: { post_id: p.id },
      });
      if (error) throw new Error(error.message || "Post failed");
      if (data?.error) throw new Error(data.error);
      setFbResults((r) => ({ ...r, [p.id!]: data?.url || "posted" }));
    } catch (e) {
      setFbResults((r) => ({
        ...r,
        [p.id!]: `error:${e instanceof Error ? e.message : "Post failed"}`,
      }));
    } finally {
      setFbPostingId(null);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-background/60 px-4 py-8 text-center text-cream-muted">
        Nothing here yet.
      </div>
    );
  }

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch {
      /* clipboard blocked — the text stays visible in the block */
    }
  };

  return (
    <div className="space-y-4">
      {posts.map((p) => {
        const sign = p.zodiac_sign_tag
          ? p.zodiac_sign_tag.charAt(0).toUpperCase() + p.zodiac_sign_tag.slice(1)
          : null;
        const headerDate = p.status === "published" ? p.published_at || p.publish_at : p.publish_at;
        const missed = isMissed(p.status, headerDate);
        const asset = resolveZodiacAsset(p.zodiac_sign_tag, p.image_url);
        const url = postUrl(p);

        return (
          <div
            key={p.id}
            className={`rounded-xl border-[1.5px] bg-background/60 overflow-hidden transition-colors ${
              missed
                ? "border-red-500/60"
                : "border-[hsl(var(--reveal-strong)/0.85)] hover:border-[hsl(var(--reveal-strong))]"
            }`}
          >
            {/* Transit header */}
            <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 border-b border-border/30 bg-background/40">
              <div className="min-w-0">
                <div className="text-foreground font-display text-base">
                  {sign ? `Moon in ${sign}` : p.category}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <ApprovalPill
                    status={p.status || "draft"}
                    deadline={new Date(headerDate || Date.now())}
                  />
                  <DeadlineBadge
                    status={p.status || "draft"}
                    deadline={new Date(headerDate || Date.now())}
                  />
                </div>
                <div className="text-xs text-cream-muted mt-1.5 break-words">{p.title}</div>
                <div className="text-[11px] text-cream-muted/80 mt-1">{displayDate(headerDate)}</div>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto md:shrink-0">
                {onApprove && p.status === "draft" && (
                  <ActionBtn tone="emerald" onClick={() => onApprove(p)}>
                    Approve
                  </ActionBtn>
                )}
                <ActionBtn onClick={() => onEdit(p)}>Edit</ActionBtn>
                <ActionBtn tone="sky" onClick={() => onDownloadImage(p)}>
                  {downloadId === p.id ? "Downloaded!" : "Get Image"}
                </ActionBtn>
                <ActionBtn tone="red" onClick={() => onDelete(p.id!)}>
                  Delete
                </ActionBtn>
              </div>
            </div>

            {/* Asset validation */}
            {asset.warning && (
              <div className="mx-4 mt-3 rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200">
                Image check: {asset.warning}
              </div>
            )}

            {/* Four channel blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-4">
              {CHANNEL_KEYS.map((c) => {
                const text = channelCopy(p, c);
                const key = `${p.id}-${c}`;
                return (
                  <div
                    key={c}
                    className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      {asset.url && (
                        <img
                          src={asset.url}
                          alt={`${asset.sign ?? "Transit"} constellation`}
                          loading="lazy"
                          className="h-12 w-12 rounded-md object-cover border border-border/40 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-foreground text-sm">{CHANNEL_LABEL[c]}</div>
                        <div className="text-[11px] text-cream-muted">
                          {text ? `${text.length} characters` : "No draft yet"}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] leading-relaxed text-cream-muted whitespace-pre-wrap break-words">
                      {text ? `${text.slice(0, 240)}${text.length > 240 ? "…" : ""}` : "—"}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <ActionBtn
                        tone="primary"
                        disabled={!text}
                        onClick={() => copy(key, text)}
                      >
                        {copied === key ? "Copied!" : "Copy text"}
                      </ActionBtn>
                      <ActionBtn
                        tone="sky"
                        href={shareIntentUrl(c, {
                          title: p.title,
                          text,
                          url,
                          imageUrl: asset.url,
                        })}
                      >
                        {SHARE_LABEL[c]}
                      </ActionBtn>
                      {c === "facebook" && (
                        <>
                          <ActionBtn
                            tone="emerald"
                            disabled={!text || fbPostingId === p.id}
                            onClick={() => postToFacebook(p)}
                          >
                            {fbPostingId === p.id ? "Posting…" : "Post to Page"}
                          </ActionBtn>
                          {fbResults[p.id!]?.startsWith("error:") ? (
                            <span className="text-[11px] text-red-300 self-center">
                              {fbResults[p.id!].slice(6)}
                            </span>
                          ) : fbResults[p.id!] ? (
                            <a
                              href={fbResults[p.id!]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-400 underline self-center"
                            >
                              Posted — view on Facebook
                            </a>
                          ) : null}
                        </>
                      )}
                      {c === "blog" && (
                        <>
                          {p.status !== "published" && (
                            <ActionBtn
                              tone="emerald"
                              disabled={blogPublishingId === p.id}
                              onClick={() => onPublishNow(p.id!)}
                            >
                              {blogPublishingId === p.id ? "Publishing…" : "Publish now"}
                            </ActionBtn>
                          )}
                          <ActionBtn tone="sky" onClick={() => onSchedule(p)}>
                            {p.status === "scheduled" ? "Reschedule" : "Schedule"}
                          </ActionBtn>
                          {p.status === "scheduled" && (
                            <ActionBtn tone="amber" onClick={() => onUnscheduleBlog(p.id!)}>
                              Unschedule
                            </ActionBtn>
                          )}
                          {p.status === "published" && (
                            <ActionBtn tone="amber" onClick={() => onUnpublish(p.id!)}>
                              Unpublish
                            </ActionBtn>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChannelMatrix;
