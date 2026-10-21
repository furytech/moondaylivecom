import { ArrowUp } from "lucide-react";

export const NATAL_TOP_ID = "blueprint-natal-top";

export interface IndexEntry {
  id: string;
  label: string;
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

/** "Jump to" grid: wraps to 2 columns on phones and never scrolls sideways. */
export const SectionIndex = ({ entries }: { entries: IndexEntry[] }) => (
  <nav aria-label="Jump to a section" className="space-y-3">
    <p className="font-display text-xs uppercase tracking-[0.25em] text-primary/80 text-left">Jump to</p>
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {entries.map((e) => (
        <li key={e.id}>
          <button
            type="button"
            onClick={() => scrollTo(e.id)}
            className="w-full min-h-11 px-3 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 font-sans text-[15px] normal-case tracking-normal text-left transition-colors"
          >
            {e.label}
          </button>
        </li>
      ))}
    </ul>
  </nav>
);

/** Small link at the end of a section, back to the index at the top of the tab. */
export const BackToTop = () => (
  <div className="flex justify-end">
    <button
      type="button"
      onClick={() => scrollTo(NATAL_TOP_ID)}
      className="inline-flex items-center gap-1.5 min-h-11 px-3 text-sm text-muted-foreground hover:text-primary font-sans normal-case tracking-normal transition-colors"
    >
      <ArrowUp className="w-4 h-4" aria-hidden="true" /> Back to top
    </button>
  </div>
);
