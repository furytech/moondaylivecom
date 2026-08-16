import { supabase } from "@/integrations/supabase/client";

export type ContributionStatus = "draft" | "submitted" | "accepted" | "archived";

export interface GuestProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  credentials: string | null;
  avatar_url: string | null;
  approved: boolean;
}

export interface GuestContribution {
  id: string;
  guest_id: string;
  blog_post_id: string | null;
  transit_label: string | null;
  transit_at: string | null;
  input_mode: string;
  raw_text: string | null;
  transcript: string | null;
  audio_path: string | null;
  status: ContributionStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  guest_astrologers?: Pick<GuestProfile, "display_name" | "bio" | "approved"> | null;
}

/** The signed-in user's guest profile, or null if they are not a guest. */
export async function fetchMyGuestProfile(): Promise<GuestProfile | null> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("guest_astrologers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as GuestProfile) ?? null;
}

export async function upsertMyGuestProfile(values: {
  display_name: string;
  bio?: string | null;
  credentials?: string | null;
}): Promise<GuestProfile> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) throw new Error("You need to be signed in.");

  const { data, error } = await supabase
    .from("guest_astrologers")
    .upsert({ user_id: userId, ...values }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data as GuestProfile;
}

export async function listMyContributions(guestId: string): Promise<GuestContribution[]> {
  const { data, error } = await supabase
    .from("guest_contributions")
    .select("*")
    .eq("guest_id", guestId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GuestContribution[];
}

export async function saveContribution(
  values: Partial<GuestContribution> & { guest_id: string },
): Promise<GuestContribution> {
  const payload = { ...values };
  const { data, error } = values.id
    ? await supabase.from("guest_contributions").update(payload).eq("id", values.id).select().single()
    : await supabase.from("guest_contributions").insert(payload).select().single();
  if (error) throw error;
  return data as GuestContribution;
}

export async function deleteContribution(id: string) {
  const { error } = await supabase.from("guest_contributions").delete().eq("id", id);
  if (error) throw error;
}

/** Uploads a voice note into the guest's own folder and returns its storage path. */
export async function uploadGuestAudio(blob: Blob): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) throw new Error("You need to be signed in.");

  const path = `${userId}/${Date.now()}.webm`;
  const { error } = await supabase.storage
    .from("guest-audio")
    .upload(path, blob, { contentType: blob.type || "audio/webm", upsert: false });
  if (error) throw error;
  return path;
}

export async function transcribeGuestAudio(
  audioPath: string,
  contributionId?: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("transcribe-guest-audio", {
    body: { audio_path: audioPath, contribution_id: contributionId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return String(data?.transcript ?? "");
}

/* ---------- Admin side ---------- */

export async function listAllContributions(): Promise<GuestContribution[]> {
  const { data, error } = await supabase
    .from("guest_contributions")
    .select("*, guest_astrologers ( display_name, bio, approved )")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GuestContribution[];
}

export async function setContributionStatus(id: string, status: ContributionStatus) {
  const { error } = await supabase.from("guest_contributions").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function listGuests(): Promise<GuestProfile[]> {
  const { data, error } = await supabase
    .from("guest_astrologers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GuestProfile[];
}

export async function setGuestApproved(id: string, approved: boolean) {
  const { error } = await supabase.from("guest_astrologers").update({ approved }).eq("id", id);
  if (error) throw error;
}

/** Stamps a post with the guest byline so the banner renders publicly. */
export async function attachGuestToPost(postId: string, contribution: GuestContribution) {
  const { error } = await supabase
    .from("blog_posts")
    .update({
      guest_contribution_id: contribution.id,
      guest_display_name: contribution.guest_astrologers?.display_name ?? null,
      guest_bio: contribution.guest_astrologers?.bio ?? null,
    })
    .eq("id", postId);
  if (error) throw error;
}
