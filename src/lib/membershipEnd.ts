/** "November 24, 2026" for the ISO date a membership ends (shown in the member's own locale and zone). */
export function formatMembershipEnd(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
