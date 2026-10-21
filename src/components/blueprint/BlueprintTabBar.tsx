import { BLUEPRINT_TABS, type BlueprintTab } from "@/lib/blueprintTabs";

interface BlueprintTabBarProps {
  active: BlueprintTab;
  onChange: (tab: BlueprintTab) => void;
}

/**
 * "Today" | "My Blueprint". Two equal halves, so both labels are always visible and it never scrolls sideways.
 * Sticky under the site header (h-16) so it stays reachable while reading.
 */
const BlueprintTabBar = ({ active, onChange }: BlueprintTabBarProps) => (
  <div className="sticky top-16 z-30 -mx-2 px-2 py-2 bg-background/90 backdrop-blur-md border-b border-primary/10">
    <div role="tablist" aria-label="Blueprint" className="grid grid-cols-2 gap-2">
      {BLUEPRINT_TABS.map(({ id, label }) => {
        const selected = id === active;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`blueprint-tab-${id}`}
            aria-selected={selected}
            aria-controls={`blueprint-panel-${id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            className={`min-h-11 px-3 rounded-xl font-sans text-[15px] font-medium normal-case tracking-normal transition-colors ${
              selected
                ? "bg-primary text-primary-foreground shadow-[0_0_24px_-8px_hsl(var(--primary)/0.7)]"
                : "border border-primary/30 text-primary hover:bg-primary/10"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  </div>
);

export default BlueprintTabBar;
