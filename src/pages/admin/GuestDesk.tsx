import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Check, Archive, UserCheck, UserX } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import MoonLoader from "@/components/MoonLoader";
import {
  listAllContributions,
  listGuests,
  setContributionStatus,
  setGuestApproved,
} from "@/lib/guest/contributions";

const BTN =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-50";

/**
 * Journal desk for guest astrologers: approve who may contribute, then accept
 * the takes that should feed into an edition. Only "accepted" contributions are
 * ever handed to the generator.
 */
const GuestDesk = () => {
  const [message, setMessage] = useState("");

  const { data: guests = [], isLoading: loadingGuests, refetch: refetchGuests } = useQuery({
    queryKey: ["admin-guests"],
    queryFn: listGuests,
  });

  const { data: contributions = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-guest-contributions"],
    queryFn: listAllContributions,
  });

  const act = async (fn: () => Promise<void>, note: string) => {
    try {
      await fn();
      setMessage(note);
      refetch();
      refetchGuests();
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    }
  };

  if (isLoading || loadingGuests) {
    return (
      <PageLayout>
        <div className="py-20 flex justify-center">
          <MoonLoader size="md" text="Loading the guest desk..." />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <SEO title="Guest Desk — Moonday Live Admin" description="Approve guest astrologers and their contributions." noindex />

      <div className="w-full max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="font-display text-2xl md:text-3xl text-foreground font-normal">Guest Desk</h1>
          <p className="mt-2 text-sm text-cream-muted/85">
            Approve contributors, then accept the readings that should shape an edition.
          </p>
          <Link
            to="/admin/guest-applications"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Open the applications queue
          </Link>
        </header>


        {message && (
          <p className="rounded-lg border border-primary/30 bg-primary/[0.06] px-4 py-2.5 text-sm text-center text-foreground">
            {message}
          </p>
        )}

        <section className="rounded-xl border border-border/40 bg-background/40 p-5">
          <h2 className="font-display text-lg text-foreground text-center font-normal mb-4">Contributors</h2>
          {guests.length === 0 ? (
            <p className="text-sm text-center text-cream-muted/80">
              No one has opened the Guest Studio yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {guests.map((g) => (
                <li
                  key={g.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-foreground">{g.display_name}</p>
                    <p className="text-xs text-cream-muted/80">{g.bio || g.credentials || "—"}</p>
                  </div>
                  <button
                    className={`${BTN} ${
                      g.approved
                        ? "border-emerald-500/40 text-emerald-400"
                        : "border-primary/40 text-primary hover:bg-primary/10"
                    }`}
                    onClick={() =>
                      act(
                        () => setGuestApproved(g.id, !g.approved),
                        g.approved ? "Contributor paused." : "Contributor approved.",
                      )
                    }
                  >
                    {g.approved ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    {g.approved ? "Approved" : "Approve"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border/40 bg-background/40 p-5">
          <h2 className="font-display text-lg text-foreground text-center font-normal mb-4">Submissions</h2>
          {contributions.length === 0 ? (
            <p className="text-sm text-center text-cream-muted/80">Nothing submitted yet.</p>
          ) : (
            <ul className="space-y-4">
              {contributions.map((c) => (
                <li key={c.id} className="rounded-lg border border-border/40 bg-background/50 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-foreground">
                        {c.transit_label || "Untitled reading"}
                        <span className="text-cream-muted/70">
                          {" "}
                          · {c.guest_astrologers?.display_name || "Unknown guest"}
                        </span>
                      </p>
                      <p className="text-xs text-cream-muted/70">
                        {c.transit_at
                          ? new Date(c.transit_at).toLocaleString("en-GB", {
                              timeZone: "UTC",
                              dateStyle: "medium",
                              timeStyle: "short",
                            }) + " UTC"
                          : "No transit date set"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${
                        c.status === "accepted"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : c.status === "submitted"
                          ? "bg-yellow-400/15 text-yellow-300"
                          : "bg-cream-muted/10 text-cream-muted"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-cream-muted/90">
                    {(c.transcript || c.raw_text || "").slice(0, 1200)}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className={`${BTN} border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10`}
                      onClick={() =>
                        act(
                          () => setContributionStatus(c.id, "accepted"),
                          "Accepted — the next generated edition for that transit will be built around it.",
                        )
                      }
                    >
                      <Check className="w-3.5 h-3.5" /> Accept for an edition
                    </button>
                    <button
                      className={`${BTN} border-border/50 text-cream-muted hover:text-foreground`}
                      onClick={() => act(() => setContributionStatus(c.id, "archived"), "Archived.")}
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
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

export default GuestDesk;
