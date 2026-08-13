import { BlogPostRow, ChannelStatus } from "@/lib/blog/posts";

/**
 * Channel-first view of the publishing schedule.
 *
 * The old layout was one row per post with a column per channel, which made it
 * impossible to see at a glance whether a given channel actually went out.
 * Here each transit is a block, and inside it the rows are the three outlets we
 * publish to — Blog, Substack, Reddit — with their own UTC instant, status and
 * remedy action.
 */

export type Channel = "blog" | "substack" | "reddit";

const CHANNEL_LABEL: Record<Channel, string> = {
  blog: "Moonday Blog",
  substack: "Substack",
  reddit: "Reddit",
};

/** A channel is "missed" when its instant has passed but it never went out. */
export const isMissed = (status: string | null | undefined, when: string | null | undefined) => {
  if (!when) return false;
  const t = new Date(when).getTime();
  if (Number.isNaN(t) || t > Date.now()) return false;
  return !(status === "published" || status === "sent");
};

export const channelState = (post: BlogPostRow, channel: Channel) => {
  if (channel === "blog") {
    return { status: (post.status || "draft") as string, when: post.publish_at || post.published_at || null };
  }
  if (channel === "reddit") {
    return { status: (post.reddit_status || "draft") as string, when: post.reddit_scheduled_at || post.publish_at || null };
  }
  return { status: (post.substack_status || "draft") as string, when: post.substack_scheduled_at || post.publish_at || null };
};

/** Count of channel deliveries that should have gone out but did not. */
export const countMissed = (posts: BlogPostRow[]) =>
  posts.reduce((total, p) => {
    return (
      total +
      (["blog", "substack", "reddit"] as Channel[]).filter((c) => {
        const { status, when } = channelState(p, c);
        return isMissed(status, when);
      }).length
    );
  }, 0);

const StatusPill = ({
  status,
  missed,
  onClick,
}: {
  status: string;
  missed: boolean;
  onClick?: () => void;
}) => {
  const cls = missed
    ? "bg-red-500/15 text-red-300 font-semibold"
    : status === "scheduled"
    ? "bg-yellow-400/15 text-yellow-300 font-semibold"
    : status === "sent" || status === "published"
    ? "bg-emerald-500/15 text-emerald-400"
    : status === "approved"
    ? "bg-primary/15 text-primary"
    : "bg-cream-muted/10 text-cream-muted";
  const label = missed ? "NOT SENT" : status === "scheduled" ? "SCHEDULED" : status;
  return (
    <span
      onClick={onClick}
      title={onClick ? "Click to unschedule and revert to draft" : undefined}
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs uppercase tracking-wide ${cls} ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      }`}
    >
      {label}
    </span>
  );
};

const LinkBtn = ({
  children,
  onClick,
  tone = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "primary" | "sky" | "emerald" | "amber" | "red";
  disabled?: boolean;
}) => {
  const tones: Record<string, string> = {
    primary: "text-primary",
    sky: "text-sky-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs hover:underline ${
        disabled ? "text-cream-muted/40 cursor-not-allowed" : tones[tone]
      }`}
    >
      {children}
    </button>
  );
};

export interface ChannelMatrixProps {
  posts: BlogPostRow[];
  displayDate: (value?: string | null) => string;
  copiedId: string | null;
  substackCopiedId?: string | null;
  downloadId: string | null;
  onEdit: (post: BlogPostRow) => void;
  onDelete: (id: string) => void;
  onDownloadImage: (post: BlogPostRow) => void;
  onPublishNow: (id: string) => void;
  onSchedule: (post: BlogPostRow) => void;
  onUnscheduleBlog: (id: string) => void;
  onUnpublish: (id: string) => void;
  onUnscheduleChannel: (id: string, channel: "reddit" | "substack") => void;
  onToggleSent: (post: BlogPostRow, channel: "reddit" | "substack") => void;
  onCopyReddit: (post: BlogPostRow) => void;
  onCopySubstack: (post: BlogPostRow) => void;
}

const ChannelMatrix = ({
  posts,
  displayDate,
  copiedId,
  substackCopiedId,
  downloadId,
  onEdit,
  onDelete,
  onDownloadImage,
  onPublishNow,
  onSchedule,
  onUnscheduleBlog,
  onUnpublish,
  onUnscheduleChannel,
  onToggleSent,
  onCopyReddit,
  onCopySubstack,
}: ChannelMatrixProps) => {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-background/60 px-4 py-8 text-center text-cream-muted">
        Nothing here yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((p) => {
        const sign = p.zodiac_sign_tag
          ? p.zodiac_sign_tag.charAt(0).toUpperCase() + p.zodiac_sign_tag.slice(1)
          : null;
        const missedHere = (["blog", "substack", "reddit"] as Channel[]).some((c) => {
          const { status, when } = channelState(p, c);
          return isMissed(status, when);
        });

        return (
          <div
            key={p.id}
            className={`rounded-xl border bg-background/60 overflow-hidden ${
              missedHere ? "border-red-500/40" : "border-border/40"
            }`}
          >
            {/* Transit header: what it is, when it happens (UTC first) */}
            <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 border-b border-border/30 bg-background/40">
              <div className="min-w-0">
                <div className="text-foreground font-display text-base">
                  {sign ? `Moon in ${sign}` : p.category}
                </div>
                <div className="text-xs text-cream-muted mt-0.5 break-words">{p.title}</div>
                <div className="text-[11px] text-cream-muted/80 mt-1">
                  {displayDate(p.publish_at || p.published_at)}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <LinkBtn onClick={() => onEdit(p)}>Edit</LinkBtn>
                <LinkBtn onClick={() => onDownloadImage(p)}>
                  {downloadId === p.id ? "Downloaded!" : "Get Image"}
                </LinkBtn>
                <LinkBtn tone="red" onClick={() => onDelete(p.id!)}>
                  Delete
                </LinkBtn>
              </div>
            </div>

            {/* Channels as rows */}
            <table className="w-full text-sm text-left">
              <thead className="text-cream-muted text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2 font-normal">Channel</th>
                  <th className="px-4 py-2 font-normal">Status</th>
                  <th className="px-4 py-2 font-normal">UTC time</th>
                  <th className="px-4 py-2 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {(["blog", "substack", "reddit"] as Channel[]).map((c) => {
                  const { status, when } = channelState(p, c);
                  const missed = isMissed(status, when);
                  return (
                    <tr key={c} className="border-t border-border/20">
                      <td className="px-4 py-2.5 text-foreground whitespace-nowrap">
                        {CHANNEL_LABEL[c]}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusPill
                          status={status}
                          missed={missed}
                          onClick={
                            status === "scheduled"
                              ? c === "blog"
                                ? () => onUnscheduleBlog(p.id!)
                                : () => onUnscheduleChannel(p.id!, c)
                              : undefined
                          }
                        />
                      </td>
                      <td className="px-4 py-2.5 text-cream-muted text-xs">
                        {displayDate(when)}
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-3 whitespace-nowrap">
                        {c === "blog" && (
                          <>
                            {p.status !== "published" && (
                              <LinkBtn tone="emerald" onClick={() => onPublishNow(p.id!)}>
                                Publish now
                              </LinkBtn>
                            )}
                            <LinkBtn tone="sky" onClick={() => onSchedule(p)}>
                              {p.status === "scheduled" ? "Reschedule" : "Schedule"}
                            </LinkBtn>
                            {p.status === "published" && (
                              <LinkBtn tone="amber" onClick={() => onUnpublish(p.id!)}>
                                Unpublish
                              </LinkBtn>
                            )}
                          </>
                        )}
                        {c === "reddit" && (
                          <>
                            <LinkBtn
                              onClick={() => onCopyReddit(p)}
                              disabled={!p.reddit_post}
                            >
                              {copiedId === p.id ? "Copied!" : "Copy post"}
                            </LinkBtn>
                            <LinkBtn tone="sky" onClick={() => onToggleSent(p, "reddit")}>
                              {status === "sent" ? "Undo posted" : "Mark posted"}
                            </LinkBtn>
                          </>
                        )}
                        {c === "substack" && (
                          <>
                            <LinkBtn
                              onClick={() => onCopySubstack(p)}
                              disabled={!p.substack_post}
                            >
                              {substackCopiedId === p.id ? "Copied!" : "Copy newsletter"}
                            </LinkBtn>
                            <LinkBtn tone="sky" onClick={() => onToggleSent(p, "substack")}>
                              {status === "sent" ? "Undo posted" : "Mark posted"}
                            </LinkBtn>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default ChannelMatrix;
