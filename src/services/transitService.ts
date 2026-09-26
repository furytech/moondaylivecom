import { supabase } from '../lib/supabase';
import { ZodiacSignTransit } from '../types';

export async function approveTransit(
  id: string,
  currentTransits: ZodiacSignTransit[]
): Promise<{ success: boolean; updatedTransits: ZodiacSignTransit[]; error?: string }> {
  const target = currentTransits.find((t) => t.id === id);
  if (!target) return { success: false, updatedTransits: currentTransits };

  const isPublished = target.status === 'published';
  const newStatus = isPublished ? 'pending' : 'published';
  const publishedAt = isPublished ? null : new Date().toISOString();

  // If Supabase credentials are present, execute live update
  if (import.meta.env.VITE_SUPABASE_URL) {
    const { error } = await supabase
      .from('transits')
      .update({
        status: newStatus,
        published_at: publishedAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase update error:', error);
      return { success: false, error: error.message, updatedTransits: currentTransits };
    }
  }

  const updatedTransits = currentTransits.map((t) =>
    t.id === id ? { ...t, status: newStatus, publishedAt } : t
  );

  return { success: true, updatedTransits };
}

export async function batchApproveAllTransits(
  currentTransits: ZodiacSignTransit[]
): Promise<{ success: boolean; updatedTransits: ZodiacSignTransit[]; error?: string }> {
  const timestamp = new Date().toISOString();

  if (import.meta.env.VITE_SUPABASE_URL) {
    const { error } = await supabase
      .from('transits')
      .update({
        status: 'published',
        published_at: timestamp,
        updated_at: timestamp
      })
      .in(
        'id',
        currentTransits.map((t) => t.id)
      );

    if (error) {
      console.error('Supabase batch update error:', error);
      return { success: false, error: error.message, updatedTransits: currentTransits };
    }
  }

  const updatedTransits = currentTransits.map((t) => ({
    ...t,
    status: 'published' as const,
    publishedAt: timestamp
  }));

  return { success: true, updatedTransits };
}

export async function updateTransitContent(
  id: string,
  updates: Partial<ZodiacSignTransit>,
  currentTransits: ZodiacSignTransit[]
): Promise<{ success: boolean; updatedTransits: ZodiacSignTransit[]; error?: string }> {
  if (import.meta.env.VITE_SUPABASE_URL) {
    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (updates.copy !== undefined) dbPayload.copy = updates.copy;
    if (updates.transitTitle !== undefined) dbPayload.transit_title = updates.transitTitle;
    if (updates.transitAspect !== undefined) dbPayload.transit_aspect = updates.transitAspect;
    if (updates.powerHour !== undefined) dbPayload.power_hour = updates.powerHour;
    if (updates.ritualTip !== undefined) dbPayload.ritual_tip = updates.ritualTip;
    if (updates.hashtags !== undefined) dbPayload.hashtags = updates.hashtags;

    const { error } = await supabase
      .from('transits')
      .update(dbPayload)
      .eq('id', id);

    if (error) {
      console.error('Supabase update content error:', error);
      return { success: false, error: error.message, updatedTransits: currentTransits };
    }
  }

  const updatedTransits = currentTransits.map((t) =>
    t.id === id ? { ...t, ...updates } : t
  );

  return { success: true, updatedTransits };
}
