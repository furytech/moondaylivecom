// Whether this member has opened their Blueprint on this device before, so the first visit can say
// "Welcome, <name>" and later ones "Welcome back, <name>".

const key = (userId: string) => `moonday:blueprintVisited:${userId}`;

export function hasVisitedBlueprint(userId: string): boolean {
  try {
    return localStorage.getItem(key(userId)) === "1";
  } catch {
    return false;
  }
}

export function markBlueprintVisited(userId: string): void {
  try {
    localStorage.setItem(key(userId), "1");
  } catch {
    /* storage unavailable: the member may see the first-visit greeting again */
  }
}
