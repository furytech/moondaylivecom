import { BlogPostRow } from "@/lib/blog/posts";

/**
 * Channel-first view of the publishing schedule.
 *
 * The old layout was one row per post with a column per channel, which made it
 * impossible to see at a glance whether a given channel actually went out.
 * Here each transit is a block, and inside it the rows are the outlets we
 * actually publish to — Blog, Substack and Reddit — with their own UTC instant, status
 * and remedy action.
 *
 * Below the tablet breakpoint the table collapses into stacked cards with
 * full-width tap targets, so every desktop control stays reachable on a phone.
 */

export type Channel = "blog" | "substack" | "reddit";

export const CHANNELS: Channel[] = ["blog", "substack", "reddit"];

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
  // Always report the instant that actually matters: once something is live/sent
  // we show when it went out, not when it was originally slated to go out.
  if (channel === "blog") {
    const status = (post.status || "draft") as string;
    return {
      status,
      when: status === "published" ? post.published_at || post.publish_at : post.publish_at || null,
    };
  }
  if (channel === "reddit") {
    const rStatus = (post.reddit_status || "draft") as string;
    return {
      status: rStatus,
      when: rStatus === "sent" ? post.reddit_posted_at || post.reddit_scheduled_at || null : post.reddit_scheduled_at || post.publish_at || null,
    };
  }
  const status = (post.substack_status || "draft") as string;
  return {
    status,
    when:
      status === "sent"
        ? post.substack_sent_at || post.substack_scheduled_at || null
        : post.substack_scheduled_at || post.publish_at || null,
  };
};

/** Count of channel deliveries that should have gone out but did not. */
export const countMissed = (posts: BlogPostRow[]) =>
  posts.reduce((total, p) => {
    return (
      total +
      CHANNELS.filter((c) => {
        const { status, when } = channelState(p, c);
        return isMissed(status, when);
      }).length
    );
  }, 0);

/** Formats a deadline relative to now. */
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
      title={onClick ? "Tap to unschedule and revert to draft" : undefined}
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs uppercase tracking-wide ${cls} ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      }`}
    >
      {label}
    </span>
  );
};

/** Top-level approval state for the post card. */
const ApprovalPill = ({ status, deadline }: { status: string; deadline: Date }) => {
  const now = Date.now();
  const due = deadline.getTime();
  const overdue = due < now && status !== "published" && status !== "sent";
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
  const isPast = due < now;
  if (status === "published" || status === "sent") {
    return <span className="text-xs text-emerald-400">{relativeTime(due - now)}</span>;
  }
  const cls = isPast ? "text-red-300" : "text-cream-muted";
  const prefix = isPast ? "Overdue" : status === "scheduled" ? "Publishing" : "Due";
  return (
    <span className={`text-xs ${cls}`} title={deadline.toISOString()}>
      {prefix} {relativeTime(due - now)}
    </span>
  );
};

type Tone = "primary" | "sky" | "emerald" | "amber" | "red";

const TONES: Record<Tone, string> = {
  primary: "text-primary",
  sky: "text-sky-400",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  red: "text-red-400",
};

const BORDER_TONES: Record<Tone, string> = {
  primary: "border-primary/40 text-primary hover:bg-primary/10",
  sky: "border-sky-400/40 text-sky-400 hover:bg-sky-400/10",
  emerald: "border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/10",
  amber: "border-amber-400/40 text-amber-400 hover:bg-amber-400/10",
  red: "border-red-400/40 text-red-400 hover:bg-red-400/10",
};

/** Inline text link — desktop density. */
const LinkBtn = ({
  children,
  onClick,
  tone = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: Tone;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`text-xs hover:underline ${
      disabled ? "text-cream-muted/40 cursor-not-allowed" : TONES[tone]
    }`}
  >
    {children}
  </button>
);

/** Outlined action button for the transit header (desktop). */
const HeaderBtn = ({
  children,
  onClick,
  tone = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: Tone;
}) => (
  <button
    onClick={onClick}
    className={`rounded-full border-[1.75px] px-4 py-1.5 text-xs tracking-wide transition ${BORDER_TONES[tone]}`}
  >
    {children}
  </button>
);

/** Pill button — mobile tap target, min 44px tall. */
const TapBtn = ({
  children,
  onClick,
  tone = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: Tone;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`min-h-[44px] flex-1 min-w-[8rem] rounded-full border px-4 text-xs transition ${
      disabled
        ? "border-border/30 text-cream-muted/40 cursor-not-allowed"
        : BORDER_TONES[tone]
    }`}
  >
    {children}
  </button>
);

export interface ChannelMatrixProps {
  posts: BlogPostRow[];
  displayDate: (value?: string | null) => string;
  substackCopiedId?: string | null;
  redditCopiedId?: string | null;
  downloadId: string | null;
  onEdit: (post: BlogPostRow) => void;
  onDelete: (id: string) => void;
  onDownloadImage: (post: BlogPostRow) => void;
  onPublishNow: (id: string) => void;
  onSchedule: (post: BlogPostRow) => void;
  onUnscheduleBlog: (id: string) => void;
  onUnpublish: (id: string) => void;
  onUnscheduleChannel: (id: string, channel: "substack" | "reddit") => void;
  onScheduleReddit: (post: BlogPostRow) => void;
  onSendRedditNow: (post: BlogPostRow) => void;
  redditSendingId?: string | null;
  onScheduleSubstack: (post: BlogPostRow) => void;
  onSendSubstackNow: (post: BlogPostRow) => void;
  substackSendingId?: string | null;
  onToggleSent: (post: BlogPostRow, channel: "substack" | "reddit") => void;
  onCopySubstack: (post: BlogPostRow) => void;
  onCopyReddit: (post: BlogPostRow) => void;
  /** Opens the outgoing-payload inspector for a given channel. */
  onPreviewPayload: (post: BlogPostRow, channel: Channel) => void;
}

const ChannelMatrix = ({
  posts,
  displayDate,
  substackCopiedId,
  redditCopiedId,
  downloadId,
  onEdit,
  onDelete,
  onDownloadImage,
  onPublishNow,
  onSchedule,
  onUnscheduleBlog,
  onUnpublish,
  onUnscheduleChannel,
  onScheduleReddit,
  onSendRedditNow,
  redditSendingId,
  onScheduleSubstack,
  onSendSubstackNow,
  substackSendingId,
  onToggleSent,
  onCopySubstack,
  onCopyReddit,
  onPreviewPayload,
}: ChannelMatrixProps) => {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-background/60 px-4 py-8 text-center text-cream-muted">
        Nothing here yet.
      </div>
    );
  }

  /** Shared action set, rendered with either inline links or tap pills. */
  const actions = (p: BlogPostRow, c: Channel, status: string) => {
    if (c === "blog") {
      return [
        p.status !== "published" && {
          key: "publish",
          tone: "emerald" as Tone,
          label: "Publish now",
          onClick: () => onPublishNow(p.id!),
        },
        {
          key: "schedule",
          tone: "sky" as Tone,
          label: p.status === "scheduled" ? "Reschedule" : "Schedule",
          onClick: () => onSchedule(p),
        },
        p.status === "published" && {
          key: "unpublish",
          tone: "amber" as Tone,
          label: "Unpublish",
          onClick: () => onUnpublish(p.id!),
        },
        {
          key: "preview",
          tone: "primary" as Tone,
          label: "Preview JSON",
          onClick: () => onPreviewPayload(p, "blog"),
        },
      ].filter(Boolean) as { key: string; tone: Tone; label: string; onClick: () => void }[];
    }
    if (c === "reddit") {
      return [
        status !== "sent" && {
          key: "send",
          tone: "emerald" as Tone,
          label: redditSendingId === p.id ? "Sending…" : "Publish now",
          onClick: () => onSendRedditNow(p),
          disabled: !p.reddit_post || redditSendingId === p.id,
        },
        {
          key: "schedule",
          tone: "sky" as Tone,
          label: status === "scheduled" ? "Approved ✓" : "Approve",
          onClick: () => onScheduleReddit(p),
          disabled: !p.reddit_post,
        },
        {
          key: "copy",
          tone: "primary" as Tone,
          label: redditCopiedId === p.id ? "Copied!" : "Copy Reddit post",
          onClick: () => onCopyReddit(p),
          disabled: !p.reddit_post,
        },
        {
          key: "sent",
          tone: "sky" as Tone,
          label: status === "sent" ? "Undo posted" : "Mark posted",
          onClick: () => onToggleSent(p, "reddit"),
        },
        {
          key: "preview",
          tone: "primary" as Tone,
          label: "Preview JSON",
          onClick: () => onPreviewPayload(p, "reddit"),
        },
      ].filter(Boolean) as { key: string; tone: Tone; label: string; onClick: () => void; disabled?: boolean }[];
    }
    return [
      status !== "sent" && {
        key: "send",
        tone: "emerald" as Tone,
        label: substackSendingId === p.id ? "Sending…" : "Publish now",
        onClick: () => onSendSubstackNow(p),
        disabled: !p.substack_post || substackSendingId === p.id,
      },
      {
        key: "schedule",
        tone: "sky" as Tone,
        label: status === "scheduled" ? "Approved ✓" : "Approve",
        onClick: () => onScheduleSubstack(p),
        disabled: !p.substack_post,
      },
      {
        key: "copy",
        tone: "primary" as Tone,
        label: substackCopiedId === p.id ? "Copied!" : "Copy newsletter",
        onClick: () => onCopySubstack(p),
        disabled: !p.substack_post,
      },
      {
        key: "sent",
        tone: "sky" as Tone,
        label: status === "sent" ? "Undo posted" : "Mark posted",
        onClick: () => onToggleSent(p, "substack"),
      },
      {
        key: "preview",
        tone: "primary" as Tone,
        label: "Preview JSON",
        onClick: () => onPreviewPayload(p, "substack"),
      },
    ].filter(Boolean) as { key: string; tone: Tone; label: string; onClick: () => void; disabled?: boolean }[];
  };

  return (
    <div className="space-y-4">
      {posts.map((p) => {
        const sign = p.zodiac_sign_tag
          ? p.zodiac_sign_tag.charAt(0).toUpperCase() + p.zodiac_sign_tag.slice(1)
          : null;
        const missedHere = CHANNELS.some((c) => {
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
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <ApprovalPill
                    status={p.status || "draft"}
                    deadline={new Date(p.publish_at || p.published_at || Date.now())}
                  />
                  <DeadlineBadge
                    status={p.status || "draft"}
                    deadline={new Date(p.publish_at || p.published_at || Date.now())}
                  />
                </div>
                <div className="text-xs text-cream-muted mt-1.5 break-words">{p.title}</div>
                <div className="text-[11px] text-cream-muted/80 mt-1">
                  {displayDate(p.publish_at || p.published_at)}
                </div>
              </div>
              {/* Desktop: inline links. Mobile: full tap targets below. */}
              <div className="hidden md:flex items-center gap-3 shrink-0">
                <LinkBtn onClick={() => onEdit(p)}>Edit</LinkBtn>
                <LinkBtn onClick={() => onDownloadImage(p)}>
                  {downloadId === p.id ? "Downloaded!" : "Get Image"}
                </LinkBtn>
                <LinkBtn tone="red" onClick={() => onDelete(p.id!)}>
                  Delete
                </LinkBtn>
              </div>
              <div className="flex flex-wrap md:hidden w-full gap-2">
                <TapBtn onClick={() => onEdit(p)}>Edit</TapBtn>
                <TapBtn tone="sky" onClick={() => onDownloadImage(p)}>
                  {downloadId === p.id ? "Downloaded!" : "Get Image"}
                </TapBtn>
                <TapBtn tone="red" onClick={() => onDelete(p.id!)}>
                  Delete
                </TapBtn>
              </div>
            </div>

            {/* Desktop: channels as table rows */}
            <table className="hidden md:table w-full text-sm text-left">
              <thead className="text-cream-muted text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2 font-normal">Channel</th>
                  <th className="px-4 py-2 font-normal">Status</th>
                  <th className="px-4 py-2 font-normal">UTC time</th>
                  <th className="px-4 py-2 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {CHANNELS.map((c) => {
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
                      <td className="px-4 py-2.5 text-cream-muted text-xs">{displayDate(when)}</td>
                      <td className="px-4 py-2.5 text-right space-x-3 whitespace-nowrap">
                        {actions(p, c, status).map((a) => (
                          <LinkBtn
                            key={a.key}
                            tone={a.tone}
                            onClick={a.onClick}
                            disabled={(a as any).disabled}
                          >
                            {a.label}
                          </LinkBtn>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile: channels as stacked cards */}
            <div className="md:hidden divide-y divide-border/20">
              {CHANNELS.map((c) => {
                const { status, when } = channelState(p, c);
                const missed = isMissed(status, when);
                return (
                  <div key={c} className="px-4 py-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-foreground text-sm">{CHANNEL_LABEL[c]}</span>
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
                    </div>
                    <div className="text-[11px] text-cream-muted">{displayDate(when)}</div>
                    <div className="flex flex-wrap gap-2">
                      {actions(p, c, status).map((a) => (
                        <TapBtn
                          key={a.key}
                          tone={a.tone}
                          onClick={a.onClick}
                          disabled={(a as any).disabled}
                        >
                          {a.label}
                        </TapBtn>
                      ))}
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
