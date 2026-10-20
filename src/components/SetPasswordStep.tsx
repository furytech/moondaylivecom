import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import MoonLoader from "@/components/MoonLoader";
import { supabase } from "@/integrations/supabase/client";

/** True for an account created from the birthday + email step that has not chosen its own password yet. */
export const needsPassword = (user: { user_metadata?: Record<string, unknown> } | null | undefined): boolean =>
  user?.user_metadata?.password_pending === true;

/**
 * The step after confirming the email: choose a password to open the Blueprint.
 * Accounts from the birthday + email step start with a random password nobody has seen.
 */
const SetPasswordStep = () => {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { password_pending: false },
    });
    setSaving(false);
    if (updateError) setError(updateError.message);
    // On success the auth listener refreshes the user and the Blueprint opens.
  };

  return (
    <div className="max-w-md mx-auto w-full pt-6">
      <GlassmorphismCard size="sm" className="animate-fade-up">
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-2">
            <p className="font-display text-xs uppercase tracking-[0.3em] text-primary text-center">Email confirmed</p>
            <h1 className="font-sans text-2xl normal-case tracking-normal font-semibold text-foreground text-left leading-snug">
              Set a password to open your Blueprint
            </h1>
            <p className="font-serif text-base text-cream-muted leading-relaxed text-left">
              Your Moon sign is waiting. Choose a password so you can sign back in any time.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-xs tracking-[0.2em] uppercase text-primary/80 pl-1">
              Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 pr-12 rounded-xl bg-background/40 border border-primary/20 text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                className="absolute right-0 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center text-muted-foreground/70 hover:text-muted-foreground transition-colors"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground/70 pl-1 text-left">At least 6 characters.</p>
          </div>

          {error && (
            <p role="alert" className="text-destructive text-sm text-left">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-12 px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-[15px] font-medium normal-case tracking-normal rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
          >
            {saving ? <MoonLoader size="sm" /> : "Set password and open my Blueprint"}
          </button>
        </form>
      </GlassmorphismCard>
    </div>
  );
};

export default SetPasswordStep;
