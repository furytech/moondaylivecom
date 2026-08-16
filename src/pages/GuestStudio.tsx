import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, Square, Loader2, Send, Trash2 } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import MoonLoader from "@/components/MoonLoader";
import {
  GuestContribution,
  fetchMyGuestProfile,
  listMyContributions,
  saveContribution,
  deleteContribution,
  transcribeGuestAudio,
  uploadGuestAudio,
  upsertMyGuestProfile,
} from "@/lib/guest/contributions";

const FIELD =
  "w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none";
const LABEL = "block text-xs uppercase tracking-wider text-cream-muted mb-1";
const BTN =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-50";

/**
 * The Guest Astrologer studio.
 *
 * Invited astrologers talk or type their reading here. Voice is the default
 * because most astrologers think out loud; the recording is transcribed and the
 * transcript stays editable so their words are never put through a paraphrase.
 */
const GuestStudio = () => {
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [credentials, setCredentials] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [transitLabel, setTransitLabel] = useState("");
  const [transitAt, setTransitAt] = useState("");
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const { data: profile, isLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["guest-profile"],
    queryFn: fetchMyGuestProfile,
  });

  const { data: contributions = [], refetch: refetchList } = useQuery({
    queryKey: ["guest-contributions", profile?.id],
    queryFn: () => listMyContributions(profile!.id),
    enabled: !!profile?.id,
  });

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name || "");
    setBio(profile.bio || "");
    setCredentials(profile.credentials || "");
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      setMessage("Please add the name you want printed on the post.");
      return;
    }
    setSavingProfile(true);
    try {
      await upsertMyGuestProfile({ display_name: displayName.trim(), bio, credentials });
      setMessage("Profile saved.");
      refetchProfile();
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setBusy(true);
        setMessage("Uploading and transcribing — this takes a moment.");
        try {
          const path = await uploadGuestAudio(blob);
          const transcript = await transcribeGuestAudio(path);
          setText((prev) => (prev.trim() ? `${prev.trim()}\n\n${transcript}` : transcript));
          setMessage("Transcribed. Edit anything the machine misheard, then submit.");
        } catch (err) {
          setMessage(`Error: ${(err as Error).message}`);
        } finally {
          setBusy(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setMessage("Recording — talk it through, then press stop.");
    } catch {
      setMessage("Microphone access was blocked. You can type your take instead.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const submit = async (status: "draft" | "submitted") => {
    if (!profile?.id) return;
    if (!text.trim()) {
      setMessage("Nothing to send yet — record or type your reading first.");
      return;
    }
    setBusy(true);
    try {
      await saveContribution({
        id: editingId ?? undefined,
        guest_id: profile.id,
        transit_label: transitLabel || null,
        transit_at: transitAt ? new Date(transitAt).toISOString() : null,
        input_mode: "text",
        raw_text: text,
        status,
      } as Partial<GuestContribution> & { guest_id: string });
      setMessage(
        status === "submitted"
          ? "Sent to the Journal desk — you'll see it marked accepted once it's slotted into an edition."
          : "Saved as a draft.",
      );
      setEditingId(null);
      setText("");
      setTransitLabel("");
      setTransitAt("");
      refetchList();
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const editRow = (row: GuestContribution) => {
    setEditingId(row.id);
    setText(row.transcript || row.raw_text || "");
    setTransitLabel(row.transit_label || "");
    setTransitAt(row.transit_at ? new Date(row.transit_at).toISOString().slice(0, 16) : "");
    setMessage("Editing an earlier contribution.");
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="py-20 flex justify-center">
          <MoonLoader size="md" text="Opening the studio..." />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <SEO
        title="Guest Astrologer Studio — Moonday Live"
        description="Private studio where invited astrologers record or write their reading for an upcoming lunar transit."
        noindex
      />

      <div className="w-full max-w-3xl mx-auto space-y-8">
        <header className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-2">
            Guest Astrologer
          </p>
          <h1 className="font-display text-2xl md:text-3xl text-foreground font-normal">
            Your take, in your words
          </h1>
          <p className="mt-3 text-sm text-cream-muted/85 leading-relaxed">
            Talk it through or type it out. We quote you directly — the engine only supplies
            the dignities, sect and whole-sign houses underneath.
          </p>
        </header>

        {message && (
          <p className="rounded-lg border border-primary/30 bg-primary/[0.06] px-4 py-2.5 text-sm text-center text-foreground">
            {message}
          </p>
        )}

        {/* Profile */}
        <section className="rounded-xl border border-border/40 bg-background/40 p-5 space-y-4">
          <h2 className="font-display text-lg text-foreground text-center font-normal">
            How you're credited
          </h2>
          <div>
            <label className={LABEL}>Display name</label>
            <input className={FIELD} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>One-line bio</label>
            <input className={FIELD} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Tradition / credentials</label>
            <input
              className={FIELD}
              placeholder="e.g. Hellenistic, 20 years of practice"
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
            />
          </div>
          <div className="flex justify-center">
            <button
              className={`${BTN} bg-primary/90 text-primary-foreground hover:bg-primary`}
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save profile
            </button>
          </div>
          {profile && !profile.approved && (
            <p className="text-xs text-center text-cream-muted/80">
              Your profile is waiting on approval from the Journal desk. You can save drafts now
              and submit once you're approved.
            </p>
          )}
        </section>

        {/* Contribution */}
        <section className="rounded-xl border border-border/40 bg-background/40 p-5 space-y-4">
          <h2 className="font-display text-lg text-foreground text-center font-normal">
            This week's reading
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={LABEL}>Which transit</label>
              <input
                className={FIELD}
                placeholder="Moon enters Virgo"
                value={transitLabel}
                onChange={(e) => setTransitLabel(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL}>Ingress date &amp; time (your local)</label>
              <input
                type="datetime-local"
                className={FIELD}
                value={transitAt}
                onChange={(e) => setTransitAt(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-center">
            {recording ? (
              <button
                className={`${BTN} bg-red-500/90 text-white hover:bg-red-500`}
                onClick={stopRecording}
              >
                <Square className="w-4 h-4" /> Stop recording
              </button>
            ) : (
              <button
                className={`${BTN} border border-primary/40 text-primary hover:bg-primary/10`}
                onClick={startRecording}
                disabled={busy}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                Talk it through
              </button>
            )}
          </div>

          <div>
            <label className={LABEL}>Your words</label>
            <textarea
              className={`${FIELD} min-h-[220px] leading-relaxed`}
              placeholder="Type here, or record above and edit the transcript."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              className={`${BTN} border border-border/50 text-cream-muted hover:text-foreground`}
              onClick={() => submit("draft")}
              disabled={busy}
            >
              Save draft
            </button>
            <button
              className={`${BTN} bg-primary/90 text-primary-foreground hover:bg-primary`}
              onClick={() => submit("submitted")}
              disabled={busy || !profile?.approved}
            >
              <Send className="w-4 h-4" /> Submit to the desk
            </button>
          </div>
        </section>

        {/* History */}
        {contributions.length > 0 && (
          <section className="rounded-xl border border-border/40 bg-background/40 p-5">
            <h2 className="font-display text-lg text-foreground text-center font-normal mb-4">
              Your contributions
            </h2>
            <ul className="space-y-3">
              {contributions.map((row) => (
                <li
                  key={row.id}
                  className="rounded-lg border border-border/40 bg-background/50 px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-foreground">
                      {row.transit_label || "Untitled reading"}
                    </span>
                    <span className="rounded-full bg-cream-muted/10 px-2.5 py-0.5 text-xs text-cream-muted">
                      {row.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-cream-muted/80 line-clamp-2">
                    {(row.transcript || row.raw_text || "").slice(0, 180)}
                  </p>
                  <div className="mt-2 flex gap-3 text-xs">
                    <button className="text-primary hover:underline" onClick={() => editRow(row)}>
                      Edit
                    </button>
                    {row.status === "draft" && (
                      <button
                        className="inline-flex items-center gap-1 text-cream-muted hover:text-red-400"
                        onClick={async () => {
                          await deleteContribution(row.id);
                          refetchList();
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageLayout>
  );
};

export default GuestStudio;
