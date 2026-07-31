import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import MoonLoader from "@/components/MoonLoader";
import { toast } from "sonner";

type ErrorRow = {
  id: string;
  source: string;
  severity: "warning" | "error" | "critical";
  message: string;
  context: Record<string, unknown> | null;
  affects_subscribers: boolean;
  occurred_at: string;
  alerted_at: string | null;
  resolved_at: string | null;
};

const fmt = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;
};

const severityClass = (s: ErrorRow["severity"]) =>
  s === "critical"
    ? "text-destructive border-destructive/40 bg-destructive/10"
    : s === "error"
      ? "text-primary border-primary/40 bg-primary/10"
      : "text-muted-foreground border-border bg-muted/20";

const SystemErrors = () => {
  const queryClient = useQueryClient();

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
    queryKey: ["system-errors"],
    enabled: isAdmin === true,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_errors")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as ErrorRow[];
    },
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const { data: session } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("system_errors")
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: session.session?.user.id ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as resolved");
      queryClient.invalidateQueries({ queryKey: ["system-errors"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not update"),
  });

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

  const rows = data ?? [];
  const openCritical = rows.filter((r) => !r.resolved_at && r.severity === "critical").length;
  const affectingMembers = rows.filter((r) => !r.resolved_at && r.affects_subscribers).length;

  return (
    <PageLayout>
      <SEO title="System errors · Admin" description="Production error tracking" noindex />
      <div className="max-w-6xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-light text-foreground/90">System errors</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Moon-ingress and publish workflow failures. Critical items alert admins by email immediately.
        </p>

        <div className="flex items-center justify-center gap-6 my-6 text-sm">
          <span className="text-destructive">{openCritical} open critical</span>
          <span className="text-primary">{affectingMembers} affecting Sovereign members</span>
          <button
            onClick={() => refetch()}
            className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {isLoading ? (
          <MoonLoader />
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground py-16">No errors recorded. All systems nominal.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className={`rounded-xl border p-4 text-left backdrop-blur-sm ${
                  row.resolved_at ? "border-border/40 opacity-60" : "border-border/70"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${severityClass(row.severity)}`}>
                    {row.severity}
                  </span>
                  <span className="text-sm text-foreground/90">{row.source}</span>
                  <span className="text-xs text-muted-foreground">{fmt(row.occurred_at)}</span>
                  {row.affects_subscribers && !row.resolved_at ? (
                    <span className="text-xs text-destructive">Sovereign impact</span>
                  ) : null}
                  {row.alerted_at ? (
                    <span className="text-xs text-muted-foreground">alerted {fmt(row.alerted_at)}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">no alert sent</span>
                  )}
                  <span className="ml-auto">
                    {row.resolved_at ? (
                      <span className="text-xs text-muted-foreground">resolved {fmt(row.resolved_at)}</span>
                    ) : (
                      <button
                        onClick={() => resolve.mutate(row.id)}
                        className="text-xs text-primary hover:text-primary/80 underline underline-offset-4"
                      >
                        Mark resolved
                      </button>
                    )}
                  </span>
                </div>

                <p className="mt-3 text-sm text-foreground/80">{row.message}</p>

                {row.context && Object.keys(row.context).length > 0 ? (
                  <pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-muted/20 p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words">
                    {JSON.stringify(row.context, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default SystemErrors;
