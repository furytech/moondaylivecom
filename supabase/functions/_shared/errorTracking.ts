// Shared production error tracking for Moonday Live.
//
// Every critical backend path (moon-ingress calculation, ingress notifications,
// transit draft publishing, auto-publishing) reports failures here. Each report:
//   1. writes a row into public.system_errors (admin-visible audit trail), and
//   2. emails every admin immediately, throttled per fingerprint so a repeating
//      cron failure cannot flood the inbox.
//
// Reporting must never throw — a broken alert pipeline must not break the
// customer-facing request that triggered it.

import { createClient } from 'npm:@supabase/supabase-js@2'

export type Severity = 'warning' | 'error' | 'critical'

export interface ErrorReport {
  /** Logical source, e.g. "notify-moon-ingress" or "auto-publish-posts" */
  source: string
  /** Short, stable description of what failed */
  message: string
  severity?: Severity
  /** Structured detail: ids, timestamps, upstream error text */
  context?: Record<string, unknown>
  /** True when paying (Sovereign) members are impacted — default true */
  affectsSubscribers?: boolean
  /** Override the throttle window (minutes) for repeat alerts */
  throttleMinutes?: number
}

const DEFAULT_THROTTLE_MINUTES = 30

function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )
}

/** Stable grouping key so repeats of the same failure collapse into one alert. */
function fingerprintOf(source: string, message: string): string {
  return `${source}:${message.toLowerCase().replace(/[0-9a-f-]{8,}/g, '#').replace(/\s+/g, ' ').trim().slice(0, 160)}`
}

export function errorText(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

async function sendAdminAlert(
  supabase: ReturnType<typeof serviceClient>,
  report: Required<Pick<ErrorReport, 'source' | 'message' | 'severity'>> & {
    context: Record<string, unknown>
    affectsSubscribers: boolean
    occurredAt: string
    errorId: string
  },
): Promise<boolean> {
  const { data: admins, error: adminError } = await supabase.rpc('admin_alert_emails')

  const recipients = new Set<string>()
  if (!adminError && Array.isArray(admins)) {
    for (const row of admins as { email: string }[]) {
      if (row?.email) recipients.add(row.email)
    }
  }
  const fallback = Deno.env.get('ALERT_EMAIL')
  if (recipients.size === 0 && fallback) recipients.add(fallback)

  if (recipients.size === 0) {
    console.error('[errorTracking] No admin recipients configured for alert', {
      source: report.source,
    })
    return false
  }

  let sentAny = false
  for (const recipient of recipients) {
    try {
      const result = await sendAppEmail(supabase, 'system-error-alert', recipient, {
        idempotencyKey: `system-error-${report.errorId}-${recipient}`,
        templateData: {
          source: report.source,
          severity: report.severity,
          message: report.message,
          occurredAt: report.occurredAt,
          affectsSubscribers: report.affectsSubscribers,
          context: JSON.stringify(report.context, null, 2).slice(0, 2000),
        },
      })
      if (result.sent) {
        sentAny = true
      } else {
        console.warn('[errorTracking] Alert email skipped — recipient suppressed')
      }
    } catch (err) {
      console.error('[errorTracking] Alert email threw', { error: errorText(err) })
    }
  }

  return sentAny
}

/**
 * Record a production failure and alert admins. Never throws.
 * Returns the inserted error id when logging succeeded.
 */
export async function reportError(report: ErrorReport): Promise<string | null> {
  const severity: Severity = report.severity ?? 'error'
  const context = report.context ?? {}
  const affectsSubscribers = report.affectsSubscribers ?? true
  const fingerprint = fingerprintOf(report.source, report.message)
  const occurredAt = new Date().toISOString()

  console.error(`[${report.source}] ${severity.toUpperCase()}: ${report.message}`, context)

  try {
    const supabase = serviceClient()

    const { data: inserted, error: insertError } = await supabase
      .from('system_errors')
      .insert({
        source: report.source,
        severity,
        message: report.message,
        context,
        fingerprint,
        affects_subscribers: affectsSubscribers,
        occurred_at: occurredAt,
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      console.error('[errorTracking] Failed to persist error', {
        error: insertError?.message,
      })
      return null
    }

    // Throttle: skip the email if the same fingerprint already alerted recently.
    const throttleMs = (report.throttleMinutes ?? DEFAULT_THROTTLE_MINUTES) * 60_000
    const since = new Date(Date.now() - throttleMs).toISOString()
    const { count } = await supabase
      .from('system_errors')
      .select('id', { count: 'exact', head: true })
      .eq('fingerprint', fingerprint)
      .gte('alerted_at', since)

    // 'critical' always alerts — a paid-customer outage must never be silenced.
    if (severity !== 'critical' && (count ?? 0) > 0) {
      return inserted.id
    }

    const sent = await sendAdminAlert(supabase, {
      source: report.source,
      message: report.message,
      severity,
      context,
      affectsSubscribers,
      occurredAt,
      errorId: inserted.id,
    })

    if (sent) {
      await supabase
        .from('system_errors')
        .update({ alerted_at: new Date().toISOString() })
        .eq('id', inserted.id)
    }

    return inserted.id
  } catch (err) {
    console.error('[errorTracking] reportError failed', { error: errorText(err) })
    return null
  }
}

/** Wrap a critical handler so any thrown failure is tracked and alerted. */
export async function withErrorTracking<T>(
  source: string,
  fn: () => Promise<T>,
  context: Record<string, unknown> = {},
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    await reportError({
      source,
      message: errorText(err),
      severity: 'critical',
      context: { ...context, stack: err instanceof Error ? err.stack?.slice(0, 1500) : undefined },
    })
    throw err
  }
}
