import { supabase } from '../lib/supabase';
import { ZodiacSignTransit } from '../types';

export function toDbRow(transit: ZodiacSignTransit, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: transit.id,
    sign: transit.sign,
    symbol: transit.symbol,
    element: transit.element,
    ruler: transit.ruler,
    dates: transit.dates,
    transit_title: transit.transitTitle,
    transit_aspect: transit.transitAspect,
    copy: transit.copy,
    power_hour: transit.powerHour,
    ritual_tip: transit.ritualTip,
    hashtags: transit.hashtags || [],
    status: transit.status,
    published_at: transit.publishedAt || null,
    social_posted_at: transit.socialPostedAt || null,
    created_at: transit.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function fromDbRow(row: Record<string, any>): ZodiacSignTransit {
  return {
    id: row.id,
    sign: row.sign,
    symbol: row.symbol,
    element: row.element,
    ruler: row.ruler,
    dates: row.dates,
    transitTitle: row.transit_title,
    transitAspect: row.transit_aspect,
    copy: row.copy,
    powerHour: row.power_hour,
    ritualTip: row.ritual_tip,
    hashtags: row.hashtags || [],
    status: row.status,
    publishedAt: row.published_at,
    socialPostedAt: row.social_posted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchTransits(): Promise<{ data: ZodiacSignTransit[] | null; error?: string }> {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    return { data: null };
  }
  try {
    const { data, error } = await supabase
      .from('transits')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching transits:', error);
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: null };
    }

    return { data: data.map(fromDbRow) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: msg };
  }
}

export async function approveTransit(
  id: string,
  currentTransits: ZodiacSignTransit[]
): Promise<{ success: boolean; updatedTransits: ZodiacSignTransit[]; error?: string }> {
  const target = currentTransits.find((t) => t.id === id);
  if (!target) return { success: false, updatedTransits: currentTransits };

  const isPublished = target.status === 'published';
  const newStatus = isPublished ? 'pending' : 'published';
  const publishedAt = isPublished ? null : new Date().toISOString();

  // If Supabase credentials are present, execute live upsert
  if (import.meta.env.VITE_SUPABASE_URL) {
    const dbPayload = toDbRow(target, {
      status: newStatus,
      published_at: publishedAt,
    });

    console.log('[approveTransit] Executing live Supabase upsert for transit ID:', id, 'Payload:', dbPayload);

    const { data, error } = await supabase
      .from('transits')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.error('[approveTransit] Supabase upsert failed:', error);
      throw new Error(`Failed to approve transit in Supabase: ${error.message}`);
    }

    console.log('[approveTransit] Supabase upsert succeeded for transit ID:', id);
  } else {
    console.warn('[approveTransit] VITE_SUPABASE_URL is not configured. Supabase write skipped, only local state updated.');
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
    const rows = currentTransits.map((t) =>
      toDbRow(t, {
        status: 'published',
        published_at: timestamp,
      })
    );

    console.log('[batchApproveAllTransits] Batch upserting 12 signs to Supabase transits table:', rows);

    const { error } = await supabase
      .from('transits')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('[batchApproveAllTransits] Supabase batch update error:', error);
      throw new Error(`Failed to batch approve transits in Supabase: ${error.message}`);
    }

    console.log('[batchApproveAllTransits] Supabase batch upsert succeeded for all transits.');
  } else {
    console.warn('[batchApproveAllTransits] VITE_SUPABASE_URL is not configured. Supabase write skipped.');
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
  const target = currentTransits.find((t) => t.id === id);
  if (!target) return { success: false, updatedTransits: currentTransits };

  const merged = { ...target, ...updates };

  if (import.meta.env.VITE_SUPABASE_URL) {
    const dbPayload = toDbRow(merged);
    console.log('[updateTransitContent] Upserting content to Supabase transits table:', { id, payload: dbPayload });

    const { error } = await supabase
      .from('transits')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.error('[updateTransitContent] Supabase update content error:', error);
      throw new Error(`Failed to update transit content in Supabase: ${error.message}`);
    }

    console.log('[updateTransitContent] Supabase content write succeeded for transit ID:', id);
  } else {
    console.warn('[updateTransitContent] VITE_SUPABASE_URL is not configured. Supabase write skipped.');
  }

  const updatedTransits = currentTransits.map((t) =>
    t.id === id ? merged : t
  );

  return { success: true, updatedTransits };
}
