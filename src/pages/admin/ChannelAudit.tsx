import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import MoonLoader from "@/components/MoonLoader";
import { toast } from "sonner";

/**
 * Channel audit.
 *
 * One question this page answers and nothing else: for every transit we
 * published, did each outlet actually receive it, when, and if not — why.
 * Failures carry their real error text and the timestamp of the last attempt,
 * plus a one-tap retry that reruns the same pipeline the cron uses.
 */

type AuditRow = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  zodiac_sign_tag: string | null;
  status: string;
  publish_at: string | null;
  published_at: string | null;
  reddit_status: string;
  reddit_posted_at: string | null;
  reddit_scheduled_at: string | null;
  reddit_attempted_at: string | null;
  reddit_permalink: string | null;
  reddit_error: string | null;
  reddit_post: string | null;
  substack_status: string;
  substack_sent_at: string | null;
  substack_scheduled_at: string | null;
  substack_bridge_sent_at: string | null;
  substack_error: string | null;
  substack_post: string | null;
};

type ChannelKey = "blog" | "reddit" | "substack";

type Health = "delivered" | "failed" | "overdue" | "pending" | "empty";

interface ChannelView {
  key: ChannelKey;
  label: string;
  health: Health;
  when: string | null;
  whenLabel: string;
  detail?: string | null;
  link?: string | null;
}

const fmt = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;
};

const relative = (v?: string | null) => {
  if (!v) return "";
  const diff = Date.now() - new Date(v).getTime();
  if (Number.isNaN(diff)) return "";
  const mins = Math.round(Math.abs(diff) / 60000);
  const unit =
    mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.round(mins / 60)}h` : `${Math.round(mins / 1440)}d`;
  return diff >= 0 ? `${unit} ago` : `in ${unit}`;
};

const HEALTH_STYLE: Record<Health, string> = {
  delivered: "border-primary/40 bg-primary/10 text-primary",
  failed: "border-destructive/50 bg-destructive/15 text-destructive",
  overdue: "border-destructive/40 bg-destructive/10 text-destructive",
  pending: "border-border bg-muted/20 text-muted-foreground",
  empty: "border-border/50 bg-muted/10 text-muted-foreground/70",
};

const HEALTH_LABEL: Record<Health, string> = {
  delivered: "Delivered",
  failed: "Failed",
  overdue: "Never sent",
  pending: "Pending",
  empty: "No copy",
};

/** Past its moment and still not out = a real gap, not a pending item. */
const isOverdue = (when: string | null) => {
  if (!when) return false;
  const t = new Date(when).getTime();
  return !Number.isNaN(t) && t < Date.now();
};

function buildChannels(row: AuditRow): ChannelView[] {
  const blogLive = row.status === "published";
  const blogWhen = blogLive ? row.published_at || row.publish_at : row.publish_at;
  const blog: ChannelView = {
    key: "blog",
    label: "Moonday Blog",
    health: blogLive ? "delivered" : isOverdue(row.publish_at) ? "overdue" : "pending",
    when: blogWhen,
    whenLabel: blogLive ? "Published" : "Scheduled",
    link: row.slug ? `/blog/${row.category ?? ""}/${row.slug}`.replace("//", "/") : null,
  };

  const redditSent = row.reddit_status === "sent";
  const redditFailed = row.reddit_status === "failed" || (!!row.reddit_error && !redditSent);
  const reddit: ChannelView = {
    key: "reddit",
    label: "Reddit",
    health: !row.reddit_post?.trim()
      ? "empty"
      : redditSent
        ? "delivered"
        : redditFailed
          ? "failed"
          : isOverdue(row.reddit_scheduled_at || row.publish_at)
            ? "overdue"
            : "pending",
    when: redditSent
      ? row.reddit_posted_at
      : row.reddit_attempted_at || row.reddit_scheduled_at || row.publish_at,
    whenLabel: redditSent ? "Posted" : row.reddit_attempted_at ? "Last attempt" : "Due",
    detail: row.reddit_error,
    link: row.reddit_permalink,
  };

  // Substack is "delivered" once the formatted draft has been emailed; the
  // sent flag is the editor confirming they actually pressed send in Substack.
  const substackSent = row.substack_status === "sent";
  const bridged = !!row.substack_bridge_sent_at;
  const substack: ChannelView = {
    key: "substack",
    label: "Substack",
    health: !row.substack_post?.trim()
      ? "empty"
      : substackSent
        ? "delivered"
        : row.substack_error
          ? "failed"
          : bridged
            ? "pending"
            : isOverdue(row.substack_scheduled_at || row.publish_at)
              ? "overdue"
              : "pending",
    when: substackSent
      ? row.substack_sent_at
      : row.substack_bridge_sent_at || row.substack_scheduled_at || row.publish_at,
    whenLabel: substackSent ? "Sent" : bridged ? "Draft emailed" : "Due",
    detail:
      row.substack_error ||
      (bridged && !substackSent ? "Draft is in your inbox — not sent from Substack yet." : null),
  };

  return [blog, reddit, substack];
}

const ChannelAudit = () => {
  const [onlyProblems, setOnlyProblems] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["admin-check"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return false;
      const { data } = await supabase.rpc("has_role", {
        _user_id: session.session.user.id,
        _role: "admin",
      });
      return !!data;
    },
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["channel-audit"],
    enabled: isAdmin === true,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id, slug, title, category, zodiac_sign_tag, status, publish_at, published_at, reddit_status, reddit_posted_at, reddit_scheduled_at, reddit_attempted_at, reddit_permalink, reddit_error, reddit_post, substack_status, substack_sent_at, substack_scheduled_at, substack_bridge_sent_at, substack_error, substack_post",
        )
        .order("publish_at", { ascending: false, nullsFirst: false })
        .limit(60);
      if (error) throw error;
      return data as AuditRow[];
    },
  });

  const audited = useMemo(
    () => (data ?? []).map((row) => ({ row, channels: buildChannels(row) })),
    [data],
  );

  const problems = useMemo(
    () =>
      audited.filter(({ channels }) =>
        channels.some((c) => c.health === "failed" || c.health === "overdue"),
      ),
    [audited],
  );

  const failureCount = audited.reduce(
    (n, { channels }) => n + channels.filter((c) => c.health === "failed").length,
    0,
  );
  const overdueCount = audited.reduce(
    (n, { channels }) => n + channels.filter((c) => c.health === "overdue").length,
    0,
  );

  const retry = async (row: AuditRow, channel: ChannelKey) => {
    const key = `${row.id}-${channel}`;
    setRetrying(key);
    try {
      // Both channels retry the real webhook dispatch, so a failed row can
      // actually clear. (substack-bridge-send only emails a draft — it never
      // touches substack_status, so it can't resolve a Failed delivery.)
      const fn = channel === "reddit" ? "reddit-auto-post" : "substack-auto-post";
      const { data: result, error } = await supabase.functions.invoke(fn, {
        body: { post_id: row.id, force: true },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      if (result?.skipped) {
        toast.info(`Skipped — ${result.reason ?? "nothing to send"}`);
      } else {
        toast.success(
          channel === "reddit" ? "Re-sent to the Reddit webhook." : "Re-sent to the Substack webhook.",
        );
      }
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setRetrying(null);
    }
  };

  if (checkingAdmin) return <MoonLoader />;
  if (!isAdmin) {
    return (
      <PageLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <h1 className="text-2xl font-light text-foreground/90">Admins only</h1>
          <p className="text-muted-foreground mt-2">You do not have access to this page.</p>
        </div>
      </PageLayout>
    );
  }

  const visible = onlyProblems ? problems : audited;

  return (
    <PageLayout>
      <SEO title="Channel audit · Admin" description="Per-channel publish status" noindex />
      <div className="max-w-6xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-light text-foreground/90">Channel audit</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Every transit, every outlet, and exactly when it went out — or why it did not.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 my-6 text-sm">
          <span className={failureCount ? "text-destructive" : "text-muted-foreground"}>
            {failureCount} failed
          </span>
          <span className={overdueCount ? "text-destructive" : "text-muted-foreground"}>
            {overdueCount} never sent
          </span>
          <button
            onClick={() => setOnlyProblems((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            {onlyProblems ? "Show every transit" : "Show only problems"}
          </button>
          <button
            onClick={() => refetch()}
            className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
          <Link
            to="/admin/blog"
            className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Journal admin
          </Link>
        </div>

        {isLoading ? (
          <MoonLoader />
        ) : visible.length === 0 ? (
          <p className="text-muted-foreground py-16">
            {onlyProblems
              ? "Nothing is missing. Every channel is accounted for."
              : "No posts yet."}
          </p>
        ) : (
          <div className="space-y-4">
            {visible.map(({ row, channels }) => {
              const hasProblem = channels.some(
                (c) => c.health === "failed" || c.health === "overdue",
              );
              return (
                <div
                  key={row.id}
                  className={`rounded-xl border p-4 text-left backdrop-blur-sm ${
                    hasProblem ? "border-destructive/40" : "border-border/60"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="text-sm text-foreground/90">{row.title}</h2>
                    {row.zodiac_sign_tag && (
                      <span className="text-xs text-muted-foreground">
                        {row.zodiac_sign_tag}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {fmt(row.published_at || row.publish_at)}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {channels.map((c) => {
                      const busy = retrying === `${row.id}-${c.key}`;
                      const canRetry =
                        (c.key === "reddit" || c.key === "substack") &&
                        (c.health === "failed" || c.health === "overdue");
                      return (
                        <div
                          key={c.key}
                          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted/10 px-3 py-2"
                        >
                          <span className="w-28 shrink-0 text-xs text-foreground/80">
                            {c.label}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs ${HEALTH_STYLE[c.health]}`}
                          >
                            {HEALTH_LABEL[c.health]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {c.whenLabel} {fmt(c.when)}
                            {c.when ? ` · ${relative(c.when)}` : ""}
                          </span>
                          {c.link && (
                            <a
                              href={c.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary underline underline-offset-4"
                            >
                              View
                            </a>
                          )}
                          {canRetry && (
                            <button
                              onClick={() => retry(row, c.key)}
                              disabled={busy}
                              className="ml-auto min-h-[36px] rounded-full border border-primary/40 px-3 text-xs text-primary transition hover:bg-primary/10 disabled:opacity-50"
                            >
                              {busy ? "Retrying…" : "Retry now"}
                            </button>
                          )}
                          {c.detail && (
                            <p className="w-full text-xs text-destructive/90">{c.detail}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ChannelAudit;
