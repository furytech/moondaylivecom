import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import MoonLoader from "@/components/MoonLoader";
import { ShieldCheck, KeyRound, AlertTriangle, Copy, Check } from "lucide-react";

type Stage = "idle" | "enrolling" | "verifying" | "codes" | "active";

interface Factor {
  id: string;
  status: string;
  factor_type: string;
}

// Cryptographically random backup codes: 10 × XXXX-XXXX (hex)
function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    codes.push(`${hex.slice(0, 4)}-${hex.slice(4, 8)}`);
  }
  return codes;
}

const SovereignSecurity = () => {
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("idle");
  const [loading, setLoading] = useState(true);
  const [factor, setFactor] = useState<Factor | null>(null);
  const [enrollData, setEnrollData] = useState<{
    factorId: string;
    qr: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const refreshFactors = async () => {
    setLoading(true);
    const { data, error: err } = await supabase.auth.mfa.listFactors();
    if (err) {
      console.error(err);
      setLoading(false);
      return;
    }
    const verified = data?.totp?.find((f) => f.status === "verified");
    if (verified) {
      setFactor(verified as Factor);
      setStage("active");
    } else {
      setFactor(null);
      if (stage === "active") setStage("idle");
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beginEnroll = async () => {
    setError("");
    setSubmitting(true);
    try {
      // Clear any half-enrolled factors so re-enroll works cleanly
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const f of existing?.totp ?? []) {
        if (f.status !== "verified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }

      const { data, error: err } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Moonday TOTP ${Date.now()}`,
      });
      if (err) throw err;
      setEnrollData({
        factorId: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setStage("enrolling");
    } catch (e: unknown) {
      setError((e as Error).message || "Could not start enrollment");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyEnroll = async () => {
    if (!enrollData || code.length !== 6) return;
    setError("");
    setSubmitting(true);
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: enrollData.factorId,
      });
      if (chErr) throw chErr;

      const { error: verErr } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        challengeId: challenge.id,
        code,
      });
      if (verErr) throw verErr;

      // Generate + persist backup codes
      const newCodes = generateBackupCodes(10);
      const { error: storeErr } = await supabase.functions.invoke(
        "mfa-store-backup-codes",
        { body: { codes: newCodes } }
      );
      if (storeErr) throw storeErr;

      setBackupCodes(newCodes);
      setCode("");
      setStage("codes");
      toast({
        title: "Two-Factor Enabled ✓",
        description: "Your portal is now sealed with a second key.",
      });
    } catch (e: unknown) {
      setError((e as Error).message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEnroll = async () => {
    if (enrollData) {
      await supabase.auth.mfa.unenroll({ factorId: enrollData.factorId });
    }
    setEnrollData(null);
    setCode("");
    setError("");
    setStage("idle");
  };

  const finishCodesReveal = async () => {
    setBackupCodes([]);
    setAcknowledged(false);
    await refreshFactors();
  };

  const disableMfa = async () => {
    if (!factor) return;
    if (!confirm("Disable two-factor authentication on this account?")) return;
    setSubmitting(true);
    try {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
      // Clear stored backup codes
      await supabase.from("mfa_backup_codes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      toast({ title: "Two-Factor Disabled" });
      await refreshFactors();
    } catch (e: unknown) {
      toast({
        title: "Could not disable",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GlassmorphismCard className="animate-fade-up stagger-2">
      <div className="flex items-center justify-center gap-3 mb-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg tracking-widest uppercase text-foreground text-center">
          Sovereign Security
        </h2>
      </div>
      <p className="font-serif text-sm text-cream-muted/70 text-center mb-6">
        A second key for the gate. Required after sign-in.
      </p>

      {loading ? (
        <div className="flex justify-center py-6">
          <MoonLoader size="sm" />
        </div>
      ) : stage === "active" ? (
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="font-display text-sm text-primary uppercase tracking-widest">
              Two-Factor Active
            </span>
          </div>
          <p className="font-serif text-base text-cream-muted/80">
            Your authenticator app guards every sign-in.
          </p>
          <button
            onClick={disableMfa}
            disabled={submitting}
            className="font-serif text-sm text-cream-muted/60 hover:text-destructive transition-colors disabled:opacity-50"
          >
            Disable two-factor
          </button>
        </div>
      ) : stage === "idle" ? (
        <div className="text-center space-y-5">
          <p className="font-serif text-base text-cream-muted/80 leading-relaxed">
            Enroll a TOTP key with Google Authenticator, 1Password, or any compatible app.
          </p>
          {error && (
            <p className="text-destructive text-sm font-serif" role="alert">
              {error}
            </p>
          )}
          <button
            onClick={beginEnroll}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 font-display text-xs tracking-[0.2em] uppercase border border-primary/30 rounded-full text-primary/90 hover:text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-500 disabled:opacity-40"
          >
            <KeyRound className="w-4 h-4" />
            Enable Two-Factor
          </button>
        </div>
      ) : stage === "enrolling" && enrollData ? (
        <div className="space-y-5">
          <p className="font-serif text-sm text-cream-muted/80 text-center">
            Scan this with Google Authenticator to enable Two-Factor Authentication.
          </p>
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-xl border border-primary/30">
              <img src={enrollData.qr} alt="TOTP QR code" className="w-48 h-48" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-cream-muted/60 mb-1">
              Or enter manually
            </p>
            <code className="font-mono text-xs text-primary/90 break-all px-3 py-1 bg-background/40 rounded">
              {enrollData.secret}
            </code>
          </div>

          <div>
            <label className="block font-display text-[10px] tracking-[0.2em] uppercase text-cream-muted/60 text-center mb-2">
              6-digit code
            </label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full px-4 py-3 bg-background/40 border border-primary/20 rounded-md font-mono text-center text-2xl tracking-[0.5em] text-foreground focus:outline-none focus:border-primary/60"
              placeholder="000000"
            />
          </div>

          {error && (
            <p className="text-destructive text-sm font-serif text-center" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={cancelEnroll}
              disabled={submitting}
              className="flex-1 px-4 py-3 font-display text-xs tracking-[0.2em] uppercase border border-primary/20 rounded-full text-cream-muted/70 hover:text-foreground transition-all"
            >
              Cancel
            </button>
            <button
              onClick={verifyEnroll}
              disabled={submitting || code.length !== 6}
              className="flex-1 px-4 py-3 font-display text-xs tracking-[0.2em] uppercase border border-primary/40 rounded-full text-primary hover:bg-primary/10 transition-all disabled:opacity-40"
            >
              {submitting ? <MoonLoader size="sm" /> : "Verify & Activate"}
            </button>
          </div>
        </div>
      ) : stage === "codes" ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 border border-primary/30 rounded-lg bg-background/40">
            <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="font-serif text-sm text-cream-muted/90 leading-relaxed">
              Save these <strong>10 backup recovery codes</strong> somewhere safe. Each works
              once if you lose your authenticator. They will not be shown again.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-4 bg-background/60 border border-primary/20 rounded-lg">
            {backupCodes.map((c) => (
              <code
                key={c}
                className="font-mono text-sm text-primary/90 text-center py-1.5 tracking-wider"
              >
                {c}
              </code>
            ))}
          </div>

          <button
            onClick={copyCodes}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 font-display text-[10px] tracking-[0.2em] uppercase border border-primary/20 rounded-full text-cream-muted/80 hover:text-primary hover:border-primary/40 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy all codes"}
          </button>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 accent-primary"
            />
            <span className="font-serif text-sm text-cream-muted/80">
              I have stored these codes in a safe place.
            </span>
          </label>

          <button
            onClick={finishCodesReveal}
            disabled={!acknowledged}
            className="w-full px-6 py-3 font-display text-xs tracking-[0.2em] uppercase border border-primary/40 rounded-full text-primary hover:bg-primary/10 transition-all disabled:opacity-40"
          >
            Done
          </button>
        </div>
      ) : null}
    </GlassmorphismCard>
  );
};

export default SovereignSecurity;
