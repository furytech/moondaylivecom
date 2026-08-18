import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import MoonLoader from "@/components/MoonLoader";

type SubscriberRow = {
  user_id: string;
  email: string | null;
  is_subscriber: boolean | null;
  subscription_status: string | null;
  created_at: string | null;
  stripe_active: boolean;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
};

const fmt = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

const Subscribers = () => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-subscribers"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("list-subscribers");
      if (error) throw error;
      return (data as { subscribers: SubscriberRow[] }).subscribers;
    },
  });

  if (checkingAdmin) return <MoonLoader />;
  if (!isAdmin) {
    return (
      <PageLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <h1 className="text-2xl font-light text-white/90">Admins only</h1>
          <p className="text-white/60 mt-2">You do not have access to this page.</p>
        </div>
      </PageLayout>
    );
  }

  const rows = data ?? [];

  const handleDelete = async (row: SubscriberRow) => {
    const label = row.email ?? row.user_id;
    if (!window.confirm(`Permanently delete ${label}? This removes their account and data.`)) return;
    setDeletingId(row.user_id);
    setNotice(null);
    try {
      const { data: res, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { user_id: row.user_id },
      });
      const errMsg = (res as { error?: string } | null)?.error;
      if (error || errMsg) throw new Error(errMsg ?? (error as Error).message);
      setNotice(`Deleted ${label}.`);
      refetch();
    } catch (err) {
      setNotice(`Could not delete ${label}: ${(err as Error).message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const sovereignCount = rows.filter((r) => r.stripe_active).length;

  return (
    <PageLayout>
      <SEO title="Subscribers · Admin" description="Admin subscriber list" noindex />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-white/90">Subscribers</h1>
            <p className="text-white/60 text-sm mt-1">
              {rows.length} total · {sovereignCount} active in Stripe
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-sm rounded border border-white/20 text-white/80 hover:bg-white/5"
            disabled={isFetching}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {notice && (
          <p className="mb-4 rounded border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80">
            {notice}
          </p>
        )}

        {isLoading && <MoonLoader />}
        {error && (
          <div className="text-red-400 text-sm border border-red-400/30 rounded p-4">
            {(error as Error).message}
          </div>
        )}

        {!isLoading && !error && (
          <div className="overflow-x-auto border border-white/10 rounded">
            <table className="w-full text-sm text-left text-white/80">
              <thead className="bg-white/5 text-white/60 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Stripe</th>
                  <th className="px-4 py-3">Period Start</th>
                  <th className="px-4 py-3">Period End</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} className="border-t border-white/10">
                    <td className="px-4 py-3">{r.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      {r.is_subscriber ? (
                        <span className="text-amber-300">Sovereign</span>
                      ) : (
                        <span className="text-white/50">Free</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.stripe_active ? (
                        <span className="text-emerald-400">Active</span>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{fmt(r.current_period_start)}</td>
                    <td className="px-4 py-3">{fmt(r.current_period_end)}</td>
                    <td className="px-4 py-3">{fmt(r.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={deletingId === r.user_id}
                        aria-label={`Delete ${r.email ?? "user"}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {deletingId === r.user_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-white/50">
                      No subscribers yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Subscribers;
