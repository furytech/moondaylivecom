import { supabase } from '../lib/supabase';
import { ZodiacSignTransit } from '../types';
import { getDefaultTransitImageUrl } from '../lib/transitImages';
import {
  CLAIM_STALE_MINUTES,
  formatPostTime,
  socialStatus,
  type SocialStatus,
  type TransitWindow,
} from '../../supabase/functions/_shared/socialDue';

export function toDbRow(transit: ZodiacSignTransit, overrides: Partial<Record<string, unknown>> = {}) {
  const imageUrl = transit.imageUrl || transit.image_url || getDefaultTransitImageUrl(transit.id || transit.sign);
  const transitDate = overrides.transit_date !== undefined ? overrides.transit_date : (transit.transitDate !== undefined ? transit.transitDate : (transit.transit_date !== undefined ? transit.transit_date : null));
  const transitPeriod = overrides.transit_period !== undefined ? overrides.transit_period : (transit.transit_period !== undefined ? transit.transit_period : (transit.transitPeriod !== undefined ? transit.transitPeriod : transitDate));

  return {
    id: transit.id,
    sign: transit.sign,
    symbol: transit.symbol,
    element: transit.element,
    ruler: transit.ruler,
    dates: transit.dates,
    transit_title: transit.transitTitle,
    transit_aspect: transit.transitAspect,
    transit_date: transitDate,
    transit_period: transitPeriod,
    copy: transit.copy,
    power_hour: transit.powerHour,
    ritual_tip: transit.ritualTip,
    hashtags: transit.hashtags || [],
    image_url: imageUrl,
    status: transit.status,
    published_at: transit.publishedAt || null,
    social_posted_at: transit.socialPostedAt || null,
    created_at: transit.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function fromDbRow(row: Record<string, any>): ZodiacSignTransit {
  const imageUrl = row.image_url || getDefaultTransitImageUrl(row.id || row.sign);
  const transitDate = row.transit_date || row.transitDate || null;
  const transitPeriod = row.transit_period || row.transitPeriod || transitDate || null;

  return {
    id: row.id,
    sign: row.sign,
    symbol: row.symbol,
    element: row.element,
    ruler: row.ruler,
    dates: row.dates,
    transitTitle: row.transit_title,
    transitAspect: row.transit_aspect,
    transitDate: transitDate,
    transit_date: transitDate,
    transit_period: transitPeriod,
    transitPeriod: transitPeriod,
    copy: row.copy,
    powerHour: row.power_hour,
    ritualTip: row.ritual_tip,
    hashtags: row.hashtags || [],
    imageUrl: imageUrl,
    image_url: imageUrl,
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

export function formatTransitBlogPostMarkdown(transit: ZodiacSignTransit): string {
  const hashtags = Array.isArray(transit.hashtags) ? transit.hashtags.join(' ') : '';
  const dates = transit.transitDate || transit.transit_date || transit.dates || '';
  const powerHour = transit.powerHour || '';
  const ritualTip = transit.ritualTip || '';
  const copy = transit.copy || '';

  return `# ${transit.transitTitle || `Moon in ${transit.sign}: ${transit.transitAspect}`}

**Zodiac Sign:** ${transit.sign} ${transit.symbol || ''}  
**Transit Aspect:** ${transit.transitAspect || ''}  
${dates ? `**Transit Window:** ${dates}  \n` : ''}${powerHour ? `**Power Hour:** ${powerHour}  \n` : ''}
---

### Cosmic Weather & Astrological Forecast

${copy}

---

### Daily Ritual & Alignment Tip

${ritualTip}

---

**Astrological Keywords & Archetypes:**  
${hashtags}`;
}

export function buildTransitBlogPostPayload(transit: ZodiacSignTransit, publish: boolean = true) {
  const slug = `transit-${(transit.id || transit.sign).toLowerCase()}`;
  const now = new Date().toISOString();
  const hashtags = Array.isArray(transit.hashtags)
    ? transit.hashtags.map((h) => h.replace(/^#/, '').trim()).filter(Boolean)
    : [];
  const imageUrl = transit.imageUrl || transit.image_url || getDefaultTransitImageUrl(transit.id || transit.sign);

  return {
    slug,
    title: transit.transitTitle || `Moon in ${transit.sign}: ${transit.transitAspect}`,
    category: 'Transits' as const,
    excerpt: transit.copy ? (transit.copy.length > 160 ? transit.copy.slice(0, 157) + '...' : transit.copy) : '',
    content: formatTransitBlogPostMarkdown(transit),
    keywords: hashtags,
    read_time: 3,
    author: 'Moonday Live Team',
    reviewed_by: 'Moonday Live Astrologer',
    status: (publish ? 'published' : 'draft') as 'published' | 'draft',
    publish_at: publish ? (transit.publishedAt || now) : null,
    published_at: publish ? (transit.publishedAt || now) : null,
    featured: false,
    cta_type: 'birthday-calculator' as const,
    image_url: imageUrl,
    zodiac_sign_tag: transit.sign,
  };
}

// A journal article is eligible while its ingress is still upcoming, or at most this many
// hours old. Keeps a stale article from an earlier cycle from being touched by surprise.
const ARTICLE_LOOKBACK_HOURS = 6;

/**
 * Queues (or un-queues) the REAL journal article for this sign's upcoming ingress.
 *
 * The nightly generator (fill-transit-schedule) writes one full article per ingress, with
 * its Substack/Reddit/social editions, as a draft whose publish_at is the ingress instant.
 * Approving here marks that article 'approved'; auto-publish-posts then publishes it at
 * publish_at and fires the channel hand-offs. Revoking returns it to 'draft'.
 *
 * This no longer builds a separate legacy "transit-<sign>" post from the short transit copy.
 */
export async function syncTransitToBlogPost(
  transit: ZodiacSignTransit,
  publish: boolean = true
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    return { success: true };
  }

  const oldestAllowed = new Date(Date.now() - ARTICLE_LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();

  try {
    const { data: article, error: lookupError } = await supabase
      .from('blog_posts')
      .select('id, slug, status, publish_at')
      .eq('category', 'Transits')
      .eq('zodiac_sign_tag', transit.sign)
      .gte('publish_at', oldestAllowed)
      .order('publish_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      console.error(`[transitService] Error looking up journal article for ${transit.sign}:`, lookupError);
      return { success: false, error: lookupError.message };
    }

    if (!article) {
      return { success: false, error: `No upcoming journal article found for ${transit.sign}` };
    }

    if (publish) {
      // Already approved, scheduled or live — nothing to change.
      if (article.status !== 'draft') {
        return { success: true, data: article };
      }
      const { data, error } = await supabase
        .from('blog_posts')
        .update({ status: 'approved' })
        .eq('id', article.id)
        .select('id, slug, status, publish_at')
        .single();
      if (error) {
        console.error(`[transitService] Error approving journal article for ${transit.sign}:`, error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    }

    // Revoke: return the article to draft.
    if (article.status === 'draft') {
      return { success: true, data: article };
    }
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ status: 'draft', published_at: null })
      .eq('id', article.id)
      .select('id, slug, status, publish_at')
      .single();
    if (error) {
      console.error(`[transitService] Error reverting journal article for ${transit.sign}:`, error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error syncing transit to blog';
    console.error(`[transitService] Exception syncing blog post:`, err);
    return { success: false, error: message };
  }
}

export interface ApproveTransitResult {
  success: boolean;
  updatedTransits: ZodiacSignTransit[];
  action?: 'approved' | 'undone';
  feedbackMessage?: string;
  feedbackType?: 'success' | 'warning' | 'error';
  error?: string;
}

/** The displayed state of a card (Pending / Approved / Posted / Missed), derived from the stored row. */
export function stateOf(t: ZodiacSignTransit, windows: readonly TransitWindow[], now: number = Date.now()): SocialStatus {
  return socialStatus(
    { id: t.id, sign: t.sign, status: t.status, published_at: t.publishedAt ?? null, social_posted_at: t.socialPostedAt ?? null },
    windows,
    now
  );
}

const CLAIM_STALE_MS = CLAIM_STALE_MINUTES * 60000;

/** Write an approval. Only status, published_at and social_posted_at are touched (the rest of the row is left alone,
 *  so a stale screen can never overwrite a post that has just gone out). A card with no database row yet is inserted. */
async function writeApprovals(targets: ZodiacSignTransit[], stamp: string): Promise<void> {
  if (!import.meta.env.VITE_SUPABASE_URL || targets.length === 0) return;
  const { data, error } = await supabase
    .from('transits')
    .update({ status: 'published', published_at: stamp, social_posted_at: null, updated_at: stamp })
    .in('id', targets.map((t) => t.id))
    .select('id');
  if (error) throw new Error(`Failed to approve transit in Supabase: ${error.message}`);

  const saved = new Set((data ?? []).map((r: { id: string }) => r.id));
  const missing = targets.filter((t) => !saved.has(t.id));
  if (missing.length > 0) {
    const rows = missing.map((t) => toDbRow(t, { status: 'published', published_at: stamp, social_posted_at: null }));
    const { error: insertError } = await supabase.from('transits').upsert(rows, { onConflict: 'id' });
    if (insertError) throw new Error(`Failed to approve transit in Supabase: ${insertError.message}`);
  }
}

export async function approveTransit(
  id: string,
  currentTransits: ZodiacSignTransit[],
  windows: readonly TransitWindow[] = []
): Promise<ApproveTransitResult> {
  const target = currentTransits.find((t) => t.id === id);
  if (!target) return { success: false, updatedTransits: currentTransits };

  const now = Date.now();
  if (stateOf(target, windows, now).state !== 'pending') {
    return {
      success: false,
      updatedTransits: currentTransits,
      feedbackType: 'warning',
      feedbackMessage: 'This card is already approved or finished. Only Pending cards can be approved.',
    };
  }

  const stamp = new Date(now).toISOString();
  await writeApprovals([target], stamp);

  const updatedTarget: ZodiacSignTransit = { ...target, status: 'published', publishedAt: stamp, socialPostedAt: null };
  let blogSync: { success: boolean; error?: string } | null = null;
  if (import.meta.env.VITE_SUPABASE_URL) {
    // Queue the real journal article for this sign's upcoming ingress
    try {
      blogSync = await syncTransitToBlogPost(updatedTarget, true);
    } catch (blogErr) {
      blogSync = { success: false, error: blogErr instanceof Error ? blogErr.message : 'Journal sync failed' };
      console.error('[approveTransit] Error during journal blog post sync:', blogErr);
    }
  } else {
    console.warn('[approveTransit] VITE_SUPABASE_URL is not configured. Supabase write skipped, only local state updated.');
  }

  const status = stateOf(updatedTarget, windows, now);
  const when =
    status.postAt === null
      ? 'No moon schedule is loaded for this sign yet, so it will not post until one is.'
      : status.postAt <= now
        ? 'Its post time has passed, so it posts at the next hourly check.'
        : `Posts ${formatPostTime(status.postAt)}.`;
  const blogNote = blogSync && !blogSync.success ? ` Journal article not queued: ${blogSync.error}.` : '';

  return {
    success: true,
    updatedTransits: currentTransits.map((t) => (t.id === id ? updatedTarget : t)),
    action: 'approved',
    feedbackMessage: `Approved. ${when}${blogNote}`,
    feedbackType: blogNote || status.postAt === null ? 'warning' : 'success',
  };
}

type UndoRefusal = 'posted' | 'sending' | 'not_approved';

/** Return approved, unposted cards to Pending. Refuses any card that is posted or being sent right now.
 *  Resolves the ids that were undone and, for the rest, why not. */
async function writeUndo(ids: string[]): Promise<{ undone: string[]; refused: Array<{ id: string; why: UndoRefusal }> }> {
  if (!import.meta.env.VITE_SUPABASE_URL) return { undone: ids, refused: [] };
  const stamp = new Date().toISOString();
  const stale = new Date(Date.now() - CLAIM_STALE_MS).toISOString();
  const base = () =>
    supabase
      .from('transits')
      .update({ status: 'pending', published_at: null, updated_at: stamp })
      .in('id', ids)
      .eq('status', 'published')
      .is('social_posted_at', null);

  let res = await base().or(`social_sending_at.is.null,social_sending_at.lt.${stale}`).select('id');
  if (res.error) {
    // The sending column comes from a migration that may not be applied yet: undo without that check.
    res = await base().select('id');
  }
  if (res.error) throw new Error(`Failed to undo approval in Supabase: ${res.error.message}`);

  const undone = (res.data ?? []).map((r: { id: string }) => r.id);
  const left = ids.filter((id) => !undone.includes(id));
  const refused: Array<{ id: string; why: UndoRefusal }> = [];
  if (left.length > 0) {
    const { data } = await supabase.from('transits').select('id, status, social_posted_at, social_sending_at').in('id', left);
    for (const id of left) {
      const row = (data ?? []).find((r: { id: string }) => r.id === id) as
        | { status?: string; social_posted_at?: string | null; social_sending_at?: string | null }
        | undefined;
      refused.push({ id, why: row?.social_posted_at ? 'posted' : row?.status === 'pending' ? 'not_approved' : 'sending' });
    }
  }
  return { undone, refused };
}

const refusalText = (why: UndoRefusal): string =>
  why === 'posted'
    ? "Can't undo: this post has already gone out."
    : why === 'sending'
      ? "Can't undo: this post is being sent right now. Check again in a minute."
      : 'Nothing to undo: this card is not approved.';

async function revokeJournal(updated: ZodiacSignTransit[]): Promise<void> {
  if (!import.meta.env.VITE_SUPABASE_URL) return;
  await Promise.allSettled(updated.map((t) => syncTransitToBlogPost({ ...t, status: 'pending', publishedAt: null }, false)));
}

export async function undoApproval(
  id: string,
  currentTransits: ZodiacSignTransit[],
  windows: readonly TransitWindow[] = []
): Promise<ApproveTransitResult> {
  const target = currentTransits.find((t) => t.id === id);
  if (!target) return { success: false, updatedTransits: currentTransits };

  const state = stateOf(target, windows).state;
  if (state !== 'approved') {
    return {
      success: false,
      updatedTransits: currentTransits,
      feedbackType: 'warning',
      feedbackMessage: state === 'posted' ? refusalText('posted') : 'Only Approved cards can be undone.',
    };
  }

  const { undone, refused } = await writeUndo([id]);
  if (undone.length === 0) {
    return { success: false, updatedTransits: currentTransits, feedbackType: 'warning', feedbackMessage: refusalText(refused[0]?.why ?? 'sending') };
  }

  await revokeJournal([target]);
  return {
    success: true,
    updatedTransits: currentTransits.map((t) => (t.id === id ? { ...t, status: 'pending' as const, publishedAt: null } : t)),
    action: 'undone',
    feedbackMessage: `Approval undone. ${target.sign} is Pending again.`,
    feedbackType: 'success',
  };
}

export async function batchApproveAllTransits(
  currentTransits: ZodiacSignTransit[],
  windows: readonly TransitWindow[] = []
): Promise<{ success: boolean; updatedTransits: ZodiacSignTransit[]; approved: number; error?: string }> {
  const now = Date.now();
  const stamp = new Date(now).toISOString();
  const pending = currentTransits.filter((t) => stateOf(t, windows, now).state === 'pending');
  if (pending.length === 0) return { success: true, updatedTransits: currentTransits, approved: 0 };

  await writeApprovals(pending, stamp);

  if (import.meta.env.VITE_SUPABASE_URL) {
    // Queue each sign's upcoming journal article (signs with no upcoming article are skipped)
    const results = await Promise.allSettled(
      pending.map((t) => syncTransitToBlogPost({ ...t, status: 'published', publishedAt: stamp }, true))
    );
    const queued = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    console.log(`[batchApproveAllTransits] Queued ${queued} of ${pending.length} journal articles.`);
  }

  const ids = new Set(pending.map((t) => t.id));
  return {
    success: true,
    approved: pending.length,
    updatedTransits: currentTransits.map((t) => (ids.has(t.id) ? { ...t, status: 'published' as const, publishedAt: stamp, socialPostedAt: null } : t)),
  };
}

/** Undo every Approved card that is not posted or being sent. */
export async function undoAllApproved(
  currentTransits: ZodiacSignTransit[],
  windows: readonly TransitWindow[] = []
): Promise<{ success: boolean; updatedTransits: ZodiacSignTransit[]; undone: number; refused: number }> {
  const approved = currentTransits.filter((t) => stateOf(t, windows).state === 'approved');
  if (approved.length === 0) return { success: true, updatedTransits: currentTransits, undone: 0, refused: 0 };

  const { undone, refused } = await writeUndo(approved.map((t) => t.id));
  await revokeJournal(approved.filter((t) => undone.includes(t.id)));
  return {
    success: true,
    undone: undone.length,
    refused: refused.length,
    updatedTransits: currentTransits.map((t) => (undone.includes(t.id) ? { ...t, status: 'pending' as const, publishedAt: null } : t)),
  };
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
    // Content edits never touch the posting state: a stale screen must not undo an approval or a post.
    const { status: _status, published_at: _publishedAt, social_posted_at: _postedAt, ...dbPayload } = toDbRow(merged);
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
