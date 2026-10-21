import { useState } from "react";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import MoonLoader from "@/components/MoonLoader";
import { supabase } from "@/integrations/supabase/client";

const askedKey = (userId: string) => `moonday:nameAsked:${userId}`;

export function hasAskedForName(userId: string): boolean {
  try {
    return localStorage.getItem(askedKey(userId)) === "1";
  } catch {
    return false;
  }
}

function markAsked(userId: string) {
  try {
    localStorage.setItem(askedKey(userId), "1");
  } catch {
    /* storage unavailable: the prompt may come back once */
  }
}

interface NamePromptProps {
  userId: string;
  /** Called after a save or a skip, with the saved name (or null when skipped) */
  onDone: (name: string | null) => void;
}

/** A small, skippable first-visit question. The answer goes to the member's profile and greets them. */
const NamePrompt = ({ userId, onDone }: NamePromptProps) => {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const skip = () => {
    markAsked(userId);
    onDone(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim().slice(0, 40);
    if (!clean) {
      skip();
      return;
    }
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase.from("user_profiles").update({ first_name: clean }).eq("user_id", userId);
    setSaving(false);
    if (updateError) {
      setError("Could not save that. You can skip and add it later.");
      return;
    }
    markAsked(userId);
    onDone(clean);
  };

  return (
    <GlassmorphismCard className="mb-6 animate-fade-up" size="sm">
      <form onSubmit={handleSave} className="space-y-4 text-left" aria-label="What should we call you?">
        <div className="space-y-1">
          <h2 className="font-sans text-lg normal-case tracking-normal font-semibold text-foreground text-center">
            What should we call you?
          </h2>
          <p className="font-serif text-sm text-cream-muted text-left">Optional. We'll use it to greet you.</p>
        </div>
        <label htmlFor="name-prompt" className="sr-only">
          First name
        </label>
        <input
          id="name-prompt"
          type="text"
          autoComplete="given-name"
          maxLength={40}
          placeholder="First name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-12 px-4 rounded-xl bg-background/40 border border-primary/20 text-foreground placeholder:text-muted-foreground/80 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
        />
        {error && (
          <p role="alert" className="text-destructive text-sm text-left">
            {error}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 min-h-12 px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-[15px] font-medium normal-case tracking-normal rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
          >
            {saving ? <MoonLoader size="sm" /> : "Save"}
          </button>
          <button
            type="button"
            onClick={skip}
            className="flex-1 min-h-12 px-5 py-3 border border-primary/30 text-primary hover:bg-primary/10 font-sans text-[15px] normal-case tracking-normal rounded-xl transition-all duration-300"
          >
            Skip
          </button>
        </div>
      </form>
    </GlassmorphismCard>
  );
};

export default NamePrompt;
