// The Blueprint is two tabs. The tab lives in the URL (/blueprint?tab=today or ?tab=blueprint) so emails and
// links can open one directly and back/forward move between them.

export type BlueprintTab = "today" | "blueprint";

export const BLUEPRINT_TABS: ReadonlyArray<{ id: BlueprintTab; label: string }> = [
  { id: "today", label: "Today" },
  { id: "blueprint", label: "My Blueprint" },
];

/** "today" / "blueprint" -> the tab; anything else (missing, misspelled) -> null */
export function parseBlueprintTab(value: string | null | undefined): BlueprintTab | null {
  return value === "today" || value === "blueprint" ? value : null;
}

/** A member's first-ever visit opens My Blueprint (the reveal moment); every later visit opens Today (the daily habit). */
export function defaultBlueprintTab(firstVisit: boolean): BlueprintTab {
  return firstVisit ? "blueprint" : "today";
}

export const blueprintTabPath = (tab: BlueprintTab) => `/blueprint?tab=${tab}`;
