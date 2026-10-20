import type { ReactNode } from "react";
import { Lock } from "lucide-react";

interface LockedBlueprintTeaserProps {
  sunSign: string;
  moonSign: string;
  children?: ReactNode;
}

/**
 * The Blueprint offer shown with a reveal. Deliberately shows no combination title or text
 * (the combination profiles are members-only): the blurred bars are decoration, not content.
 */
const LockedBlueprintTeaser = ({ sunSign, moonSign, children }: LockedBlueprintTeaserProps) => (
  <div className="rounded-2xl border border-lilac/25 bg-card/50 p-5 md:p-6 space-y-5">
    <div className="relative rounded-xl border border-lilac/15 bg-background/40 p-4 overflow-hidden" aria-hidden="true">
      <div className="space-y-2.5 blur-[5px] select-none">
        <div className="h-5 w-2/3 rounded-md bg-lilac/30" />
        <div className="h-3 w-full rounded-md bg-lilac/15" />
        <div className="h-3 w-11/12 rounded-md bg-lilac/15" />
        <div className="h-3 w-4/5 rounded-md bg-lilac/15" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-lilac/40 bg-background/80">
          <Lock className="h-5 w-5 text-lilac" strokeWidth={1.6} />
        </span>
      </div>
    </div>

    <p className="font-sans text-lg leading-snug text-foreground text-left">
      Your {sunSign} Sun × {moonSign} Moon Blueprint is ready.
    </p>

    {children}
  </div>
);

export default LockedBlueprintTeaser;
