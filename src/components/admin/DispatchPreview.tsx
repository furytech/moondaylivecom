import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BlogPostRow } from "@/lib/blog/posts";

/**
 * Pre-approval inspection panel.
 *
 * Left half: the exact JSON each channel will POST (built server-side by the
 * same helpers the dispatchers use, so preview and reality cannot drift).
 * Right half: the persisted dispatch history for this transit — payload sent,
 * n8n status code and response body.
 */

type Channel = "blog" | "substack" | "reddit";

const LABEL: Record<Channel, string> = {
  blog: "Moonday Blog",
  substack: "Substack",
  reddit: "Reddit",
};

interface PreviewChannel {
  channel: Channel;
  webhook_url: string | null;
  will_dispatch: boolean;
  blocker: string | null;
  has_image: boolean;
  payload: Record<string, unknown>;
}

interface DispatchLogRow {
  id: string;
  channel: string;
  status: string;
  webhook_url: string | null;
  trigger_source: string | null;
  request_payload: unknown;
  response_status: number | null;
  response_body: string | null;
  error: string | null;
  created_at: string;
}

const StatusChip = ({ status }: { status: string }) => {
  const cls =
    status === "sent"
      ? "bg-emerald-500/15 text-emerald-400"
      : status === "failed"
      ? "bg-red-500/15 text-red-300"
      : "bg-cream-muted/10 text-cream-muted";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
};

const DispatchPreview = ({
  post,
  initialChannel = "blog",
  displayDate,
}: {
  post: BlogPostRow;
  initialChannel?: Channel;
  displayDate: (value?: string | null) => string;
}) => {
  const [channel, setChannel] = useState<Channel>(initialChannel);
  const [channels, setChannels] = useState<PreviewChannel[] | null>(null);
  const [logs, setLogs] = useState<DispatchLogRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const [preview, history] = await Promise.all([
        supabase.functions.invoke("dispatch-preview", { body: { post_id: post.id } }),
        supabase
          .from("dispatch_logs")
          .select("*")
          .eq("post_id", post.id!)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);
      if (cancelled) return;
      if (preview.error) setError(preview.error.message);
      else setChannels(((preview.data as { channels?: PreviewChannel[] })?.channels) ?? []);
      setLogs((history.data as DispatchLogRow[]) ?? []);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  const active = channels?.find((c) => c.channel === channel) ?? null;
  const json = active ? JSON.stringify(active.payload, null, 2) : "";
  const channelLogs = logs.filter((l) => l.channel === channel);

  const copy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["blog", "substack", "reddit"] as Channel[]).map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={`min-h-[40px] rounded-full border px-4 text-xs transition ${
              channel === c
                ? "border-primary text-primary bg-primary/10"
                : "border-border/40 text-cream-muted hover:text-foreground"
            }`}
          >
            {LABEL[c]}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-cream-muted">Building the outgoing payload…</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}

      {active && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-cream-muted">
            <span>
              Destination:{" "}
              <span className="text-foreground break-all">
                {active.webhook_url ?? "Published in place on moondaylive.com"}
              </span>
            </span>
            <span className={active.has_image ? "text-emerald-400" : "text-amber-300"}>
              {active.has_image ? "image_url included ✓" : "no image_url"}
            </span>
            {!active.will_dispatch && <span className="text-amber-300">{active.blocker}</span>}
          </div>

          <div className="relative">
            <button
              onClick={copy}
              className="absolute right-2 top-2 rounded-full border border-primary/40 px-3 py-1 text-[11px] text-primary hover:bg-primary/10"
            >
              {copied ? "Copied!" : "Copy JSON"}
            </button>
            <pre className="max-h-[45vh] overflow-auto rounded-lg border border-border/40 bg-background/70 p-4 text-left text-[11px] leading-relaxed text-cream-muted">
              {json}
            </pre>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm text-foreground">Dispatch history — {LABEL[channel]}</h4>
        {channelLogs.length === 0 ? (
          <p className="text-xs text-cream-muted">
            No dispatch recorded for this channel yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {channelLogs.map((log) => (
              <li
                key={log.id}
                className="rounded-lg border border-border/30 bg-background/50 p-3 text-left"
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-cream-muted">
                  <StatusChip status={log.status} />
                  <span>{displayDate(log.created_at)}</span>
                  {log.trigger_source && <span>via {log.trigger_source}</span>}
                  {log.response_status != null && <span>HTTP {log.response_status}</span>}
                </div>
                {log.error && <p className="mt-1 text-[11px] text-red-300">{log.error}</p>}
                {log.response_body && (
                  <p className="mt-1 break-all text-[11px] text-cream-muted/80">
                    Response: {log.response_body.slice(0, 300)}
                  </p>
                )}
                <details className="mt-1">
                  <summary className="cursor-pointer text-[11px] text-primary">
                    Payload sent
                  </summary>
                  <pre className="mt-1 max-h-56 overflow-auto text-[10px] text-cream-muted">
                    {JSON.stringify(log.request_payload, null, 2)}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DispatchPreview;
