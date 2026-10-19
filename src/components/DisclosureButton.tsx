import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared look for every expand/collapse toggle: a real button (bordered
 *  rounded-xl, body font, sentence case, 44px tall), in the Library tab style.
 *  Radix triggers style the open state with data-[state=open]. */
export const DISCLOSURE_BUTTON_CLASS = cn(
  "group inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl border px-4 py-2.5",
  "font-sans text-sm font-medium normal-case tracking-normal leading-tight",
  "border-white/15 bg-white/[0.03] text-foreground/80",
  "hover:border-white/35 hover:bg-white/10 hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "data-[state=open]:border-[#d4af37]/70 data-[state=open]:text-[#d4af37]",
  "transition-colors duration-200",
);

interface DisclosureButtonProps {
  open: boolean;
  /** id of the region this button shows and hides. */
  controls: string;
  /** Click bubbling to a clickable parent is fine; omit when the parent handles it. */
  onClick?: () => void;
  openLabel?: string;
  closedLabel?: string;
  className?: string;
}

const DisclosureButton = ({
  open,
  controls,
  onClick,
  openLabel = "Hide details",
  closedLabel = "Show details",
  className,
}: DisclosureButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={open}
    aria-controls={controls}
    data-state={open ? "open" : "closed"}
    className={cn(DISCLOSURE_BUTTON_CLASS, className)}
  >
    <span>{open ? openLabel : closedLabel}</span>
    <ChevronDown
      size={16}
      aria-hidden
      className={cn("shrink-0 transition-transform duration-200", open && "rotate-180")}
    />
  </button>
);

export default DisclosureButton;
