import { supabase } from '../lib/supabase';
import { ZodiacSignTransit } from '../types';
import { getDefaultTransitImageUrl } from '../lib/transitImages';

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

export async function syncTransitToBlogPost(
  transit: ZodiacSignTransit,
  publish: boolean = true
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    return { success: true };
  }

  const payload = buildTransitBlogPostPayload(transit, publish);

  try {
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', payload.slug)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error(`[transitService] Error updating blog post for transit ${transit.id}:`, error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error(`[transitService] Error inserting blog post for transit ${transit.id}:`, error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error syncing transit to blog';
    console.error(`[transitService] Exception syncing blog post:`, err);
    return { success: false, error: message };
  }
}

export async function sendMakeWebhook(
  transit: ZodiacSignTransit,
  publishedAt: string
): Promise<{ success: boolean; error?: string }> {
  let webhookUrl =
    import.meta.env.VITE_MAKE_WEBHOOK_URL?.trim() ||
    (typeof window !== 'undefined' ? localStorage.getItem('moonday.makeWebhook')?.trim() : null);

  if (!webhookUrl) {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'make_webhook_url')
        .maybeSingle();
      if (data?.value?.trim()) {
        webhookUrl = data.value.trim();
      }
    } catch {
      // ignore
    }
  }

  if (!webhookUrl) {
    console.warn('[sendMakeWebhook] No Make.com webhook URL configured.');
    return { success: false, error: 'No Make.com webhook URL configured' };
  }

  try {
    const payload = {
      event: 'transit.approved',
      source: 'moonday-mission-control',
      transit: toDbRow(transit, { status: 'published', published_at: publishedAt }),
      timestamp: new Date().toISOString(),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok || response.status === 200 || response.status === 201 || response.status === 204) {
      console.log('[sendMakeWebhook] Successfully delivered to Make.com');
      return { success: true };
    }

    console.warn(`[sendMakeWebhook] Make.com returned status ${response.status}`);
    return { success: false, error: `Make.com returned HTTP ${response.status}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sendMakeWebhook] Failed to deliver to Make.com:', message);
    return { success: false, error: message };
  }
}

export interface ApproveTransitResult {
  success: boolean;
  updatedTransits: ZodiacSignTransit[];
  action?: 'published' | 'pending';
  webhookSuccess?: boolean;
  feedbackMessage?: string;
  feedbackType?: 'success' | 'warning' | 'error';
  error?: string;
}

export async function approveTransit(
  id: string,
  currentTransits: ZodiacSignTransit[]
): Promise<ApproveTransitResult> {
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

    // Automatically sync / publish corresponding blog post in the journal
    try {
      const updatedTransitForBlog = { ...target, status: newStatus as any, publishedAt };
      await syncTransitToBlogPost(updatedTransitForBlog, newStatus === 'published');
      console.log('[approveTransit] Automatically synced journal blog post for sign:', target.sign, 'published:', newStatus === 'published');
    } catch (blogErr) {
      console.error('[approveTransit] Error during journal blog post sync:', blogErr);
    }
  } else {
    console.warn('[approveTransit] VITE_SUPABASE_URL is not configured. Supabase write skipped, only local state updated.');
  }

  const updatedTarget: ZodiacSignTransit = {
    ...target,
    status: newStatus,
    publishedAt,
  };

  const updatedTransits = currentTransits.map((t) =>
    t.id === id ? updatedTarget : t
  );

  if (newStatus === 'published') {
    const webhookRes = await sendMakeWebhook(updatedTarget, publishedAt!);
    const webhookSuccess = webhookRes.success;
    const feedbackMessage = webhookSuccess
      ? 'Approved. Sent to Make.com for syndication.'
      : 'Approval saved but Make.com webhook did not respond. Check your automation.';
    const feedbackType = webhookSuccess ? 'success' : 'warning';

    return {
      success: true,
      updatedTransits,
      action: 'published',
      webhookSuccess,
      feedbackMessage,
      feedbackType,
    };
  }

  return {
    success: true,
    updatedTransits,
    action: 'pending',
    feedbackMessage: 'Transit revoked to pending.',
    feedbackType: 'success',
  };
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

    // Automatically sync / publish all 12 blog posts to the journal
    try {
      await Promise.allSettled(
        currentTransits.map((t) =>
          syncTransitToBlogPost({ ...t, status: 'published', publishedAt: timestamp }, true)
        )
      );
      console.log('[batchApproveAllTransits] Successfully synced all 12 journal blog posts.');
    } catch (blogErr) {
      console.error('[batchApproveAllTransits] Error during batch journal blog post sync:', blogErr);
    }
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
