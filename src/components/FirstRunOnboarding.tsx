import { useEffect, useState } from "react";
import { Calendar, ShieldCheck, Sparkles, X } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";

const STORAGE_KEY = "moonday.onboarding.dismissed";

const steps = [
  {
    icon: Calendar,
    label: "Your birth date",
    body:
      "We use only your birth date to place the Moon in the sky on the day you arrived. That single point gives us your Lunar Signature — the sign the Moon was moving through.",
  },
  {
    icon: ShieldCheck,
    label: "No birth time collected",
    body:
      "We never ask for your birth time. Anything that truly requires a timestamp — Ascendant, houses — we simply don't claim. Everything you see here is honest without it.",
  },
  {
    icon: Sparkles,
    label: "Between Phases days",
    body:
      "If the Moon changed signs on your birthday, you were born Between Phases. We'll walk you through five short questions so your signature reflects the sign you actually live in.",
  },
];

const FirstRunOnboarding = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <GlassmorphismCard className="relative mb-6 animate-fade-up" size="sm">
      <button
        onClick={dismiss}
        aria-label="Dismiss introduction"
        className="absolute right-4 top-4 p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="text-center mb-6">
        <p className="font-display text-xs text-primary uppercase tracking-[0.22em] mb-2">
          Start here
        </p>
        <h2 className="font-display text-2xl md:text-3xl text-gold-gradient tracking-wider">
          How Moonday reads your chart
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {steps.map(({ icon: Icon, label, body }) => (
          <div
            key={label}
            className="rounded-xl border border-primary/15 bg-background/40 p-5 text-center"
          >
            <Icon className="w-5 h-5 text-primary mx-auto mb-3" />
            <p className="font-display text-xs text-primary uppercase tracking-[0.18em] mb-2">
              {label}
            </p>
            <p className="font-serif text-sm text-cream-muted leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-7">
        <button
          onClick={dismiss}
          className="px-8 py-3 font-display text-sm tracking-widest uppercase rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary/60 text-primary transition-all duration-300"
        >
          Got it
        </button>
      </div>
    </GlassmorphismCard>
  );
};

export default FirstRunOnboarding;
