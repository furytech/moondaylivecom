import { useEffect, useState } from "react";
import { getDevTierOverride, setDevTierOverride, subscribeDevTier, type DevTierOverride } from "@/lib/devTier";
import { FlaskConical, X } from "lucide-react";

/**
 * Floating dev-only tier override panel. Renders only when
 * `import.meta.env.DEV` is true — tree-shaken from production builds.
 *
 * Lets you preview the app as Free or Sovereign without juggling accounts.
 * Stored in localStorage so it survives reloads during a dev session.
 */
const DevTierPanel = () => {
  // Hard gate: this entire component returns null in production. Vite will
  // tree-shake the rest away because `import.meta.env.DEV` is a static false.
  if (!import.meta.env.DEV) return null;

  const [override, setOverride] = useState<DevTierOverride>(getDevTierOverride());
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeDevTier(() => setOverride(getDevTierOverride())), []);

  const apply = (next: DevTierOverride) => {
    setDevTierOverride(next);
    setOverride(next);
    // Force any subscription-aware UI to re-evaluate immediately.
    setTimeout(() => window.dispatchEvent(new CustomEvent("moonday:dev-tier-change")), 0);
  };

  const statusColor =
    override === "free" ? "rgb(248, 113, 113)" : override === "sovereign" ? "rgb(192, 132, 252)" : "rgb(148, 163, 184)";
  const statusLabel = override ? `Forcing ${override.toUpperCase()}` : "Real tier";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Dev tier override"
        className="fixed z-[100] left-3 bottom-3 md:left-4 md:bottom-4 flex items-center gap-2 px-3 py-2 rounded-full text-[10px] uppercase tracking-widest font-mono backdrop-blur-md border shadow-lg"
        style={{
          background: "rgba(15, 18, 36, 0.85)",
          borderColor: statusColor,
          color: statusColor,
        }}
      >
        <FlaskConical className="w-3.5 h-3.5" />
        DEV · {statusLabel}
      </button>
    );
  }

  return (
    <div
      className="fixed z-[100] left-3 bottom-3 md:left-4 md:bottom-4 w-72 rounded-xl backdrop-blur-md border shadow-2xl text-cream-muted"
      style={{ background: "rgba(15, 18, 36, 0.92)", borderColor: "rgba(192, 132, 252, 0.4)" }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono" style={{ color: statusColor }}>
          <FlaskConical className="w-3.5 h-3.5" />
          Dev Tier Override
        </div>
        <button onClick={() => setOpen(false)} className="text-cream-muted/60 hover:text-cream-muted">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-3 py-3 space-y-2">
        <p className="text-[10px] font-mono text-cream-muted/60 leading-relaxed">
          Preview the app as a different subscription tier. Stripped from production builds.
        </p>

        <div className="grid grid-cols-3 gap-1.5">
          {([
            { v: null, label: "Real", color: "rgb(148, 163, 184)" },
            { v: "free" as const, label: "Free", color: "rgb(248, 113, 113)" },
            { v: "sovereign" as const, label: "Sovereign", color: "rgb(192, 132, 252)" },
          ]).map((opt) => {
            const active = override === opt.v;
            return (
              <button
                key={opt.label}
                onClick={() => apply(opt.v)}
                className="px-2 py-1.5 rounded text-[10px] uppercase tracking-widest font-mono border transition"
                style={{
                  borderColor: active ? opt.color : "rgba(255,255,255,0.1)",
                  color: active ? opt.color : "rgba(255,255,255,0.6)",
                  background: active ? `${opt.color.replace("rgb", "rgba").replace(")", ", 0.12)")}` : "transparent",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <p className="text-[10px] font-mono text-cream-muted/40 pt-1">
          Status: <span style={{ color: statusColor }}>{statusLabel}</span>
        </p>
      </div>
    </div>
  );
};

export default DevTierPanel;
