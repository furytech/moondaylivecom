// Finding the member's profile for customer-portal. user_profiles.user_id is the link to auth.users
// (user_profiles.id is the row's own id), so match on user_id and fall back to email only when
// user_id finds no row. A failed query is an error, never "no profile".

export interface PortalProfile {
  subscription_status: string | null;
  is_subscriber: boolean | null;
}

export interface ProfileLookup {
  byUserId(userId: string): Promise<{ data: PortalProfile | null; error?: string }>;
  byEmail(email: string): Promise<{ data: PortalProfile | null; error?: string }>;
}

export async function findPortalProfile(
  lookup: ProfileLookup,
  userId: string,
  email: string | undefined,
): Promise<PortalProfile | null> {
  const primary = await lookup.byUserId(userId);
  if (primary.error) throw new Error(`Profile lookup failed: ${primary.error}`);
  if (primary.data) return primary.data;
  if (!email) return null;
  const fallback = await lookup.byEmail(email);
  if (fallback.error) throw new Error(`Profile lookup failed: ${fallback.error}`);
  return fallback.data;
}

/** Paid = 'sovereign' or 'luminary' (either spelling, any case) or is_subscriber. */
export function isPaidProfile(profile: PortalProfile | null | undefined): boolean {
  const status = profile?.subscription_status?.toLowerCase();
  return status === "sovereign" || status === "luminary" || profile?.is_subscriber === true;
}
