import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { UserCheck, UserX, Search, ArrowRight } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import MoonLoader from "@/components/MoonLoader";
import { listGuests, setGuestApproved, type GuestProfile } from "@/lib/guest/contributions";

type Filter = "pending" | "approved" | "all";

const TAB =
  "rounded-full border px-3.5 py-1.5 text-xs transition whitespace-nowrap";
const BTN =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-50";

const applied = (g: GuestProfile & { created_at?: string }) =>
  g.created_at
    ? new Date(g.created_at).toLocaleDateString("en-GB", {
        timeZone: "UTC",
        dateStyle: "medium",
      })
    : "—";

/**
 * Review queue for guest astrologer applications: pending first, with search
 * and one-tap approve / pause. Contribution review stays on the Guest Desk.
 */
const GuestApplications = () => {
  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: guests = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-guest-applications"],
    queryFn: listGuests,
  });

  const counts = useMemo(
    () => ({
      pending: guests.filter((g) => !g.approved).length,
      approved: guests.filter((g) => g.approved).length,
      all: guests.length,
    }),
    [guests],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests
      .filter((g) =>
        filter === "pending" ? !g.approved : filter === "approved" ? g.approved : true,
      )
      .filter((g) =>
        q
          ? [g.display_name, g.bio, g.credentials]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(q))
          : true,
      )
      .sort((a, b) => Number(a.approved) - Number(b.approved));
  }, [guests, filter, query]);

  const toggle = async (g: GuestProfile) => {
    setBusyId(g.id);
    try {
      await setGuestApproved(g.id, !g.approved);
      setMessage(
        g.approved
          ? `${g.display_name} paused — they can still save drafts, but not submit.`
          : `${g.display_name} approved — they can submit readings to the desk now.`,
      );
      await refetch();
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="py-20 flex justify-center">
          <MoonLoader size="md" text="Loading applications..." />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <SEO
        title="Guest Applications — Moonday Live Admin"
        description="Review and approve guest astrologer applications."
        noindex
      />

      <div className="w-full max-w-4xl mx-auto space-y-6">
        <header className="text-center">
          <h1 className="font-display text-2xl md:text-3xl text-foreground font-normal">
            Guest Applications
          </h1>
          <p className="mt-2 text-sm text-cream-muted/85">
            {counts.pending === 0
              ? "No one is waiting on a decision."
              : `${counts.pending} astrologer${counts.pending === 1 ? "" : "s"} waiting on a decision.`}
          </p>
          <Link
            to="/admin/guests"
            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Review submitted readings <ArrowRight className="w-3 h-3" />
          </Link>
        </header>

        {message && (
          <p className="rounded-lg border border-primary/30 bg-primary/[0.06] px-4 py-2.5 text-sm text-center text-foreground">
            {message}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap justify-center gap-2">
            {(["pending", "approved", "all"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`${TAB} ${
                  filter === f
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border/50 text-cream-muted hover:text-foreground"
                }`}
              >
                {f === "pending" ? "Pending" : f === "approved" ? "Approved" : "All"} ({counts[f]})
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream-muted/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or credentials"
              className="w-full sm:w-64 rounded-full border border-border/50 bg-background/50 py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-cream-muted/60 focus:border-primary/50 focus:outline-none"
            />
          </div>
        </div>

        <section className="rounded-xl border border-border/40 bg-background/40 p-4 sm:p-5">
          {visible.length === 0 ? (
            <p className="py-6 text-sm text-center text-cream-muted/80">
              Nothing in this queue.
            </p>
          ) : (
            <ul className="space-y-3">
              {visible.map((g) => (
                <li
                  key={g.id}
                  className="rounded-lg border border-border/40 bg-background/50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        {g.display_name}
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-[11px] align-middle ${
                            g.approved
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-yellow-400/15 text-yellow-300"
                          }`}
                        >
                          {g.approved ? "approved" : "pending"}
                        </span>
                      </p>
                      {g.credentials && (
                        <p className="mt-1 text-xs text-cream-muted/85">{g.credentials}</p>
                      )}
                      {g.bio && (
                        <p className="mt-1 text-xs leading-relaxed text-cream-muted/75">{g.bio}</p>
                      )}
                      <p className="mt-1 text-[11px] text-cream-muted/60">
                        Applied {applied(g as GuestProfile & { created_at?: string })}
                      </p>
                    </div>

                    <button
                      disabled={busyId === g.id}
                      onClick={() => toggle(g)}
                      className={`${BTN} ${
                        g.approved
                          ? "border-border/50 text-cream-muted hover:text-foreground"
                          : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                    >
                      {g.approved ? (
                        <>
                          <UserX className="w-3.5 h-3.5" /> Pause access
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5" /> Approve
                        </>
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageLayout>
  );
};

export default GuestApplications;
