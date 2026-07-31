import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { reportError } from '../_shared/errorTracking.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[notify-moon-ingress] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  // Verify cron secret before doing any work
  const cronSecret = req.headers.get('X-Cron-Secret')
  const { data: secretData, error: secretError } = await supabase
    .from('cron_secrets')
    .select('secret_value')
    .eq('name', 'notify-moon-ingress')
    .single()

  if (secretError || !secretData || cronSecret !== secretData.secret_value) {
    console.warn('[notify-moon-ingress] Unauthorized cron attempt', {
      hasSecret: !!cronSecret,
      secretError: secretError?.message,
    })
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  const now = new Date()
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  // Find ingresses happening in the next two hours that we haven't notified yet
  const { data: transitions, error: transitionsError } = await supabase
    .from('moon_transitions')
    .select('id, transition_at, from_sign, to_sign')
    .gt('transition_at', now.toISOString())
    .lte('transition_at', twoHoursFromNow.toISOString())
    .order('transition_at', { ascending: true })

  if (transitionsError) {
    await reportError({
      source: 'notify-moon-ingress',
      severity: 'critical',
      message: `Failed to fetch moon transitions: ${transitionsError.message}`,
      context: { window: { from: now.toISOString(), to: twoHoursFromNow.toISOString() } },
    })
    return new Response(
      JSON.stringify({ error: 'Failed to fetch transitions' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (!transitions || transitions.length === 0) {
    return new Response(
      JSON.stringify({ message: 'No upcoming ingresses within 2 hours', notified: 0 }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  let totalNotified = 0
  const errors: string[] = []

  for (const transition of transitions) {
    const transitionAt = transition.transition_at
    const toSign = transition.to_sign
    const fromSign = transition.from_sign

    // Find Sovereign users who have not yet been notified for this transition
    const { data: users, error: usersError } = await supabase.rpc(
      'sovereign_users_for_ingress',
      {
        p_transition_at: transitionAt,
        p_to_sign: toSign,
      }
    )

    if (usersError) {
      console.error('[notify-moon-ingress] Failed to fetch users for ingress', {
        transitionAt,
        error: usersError.message,
      })
      errors.push(`users-fetch-${transitionAt}: ${usersError.message}`)
      continue
    }

    if (!users || users.length === 0) {
      console.log('[notify-moon-ingress] No eligible users for ingress', { transitionAt, toSign })
      continue
    }

    for (const user of users) {
      const userId = user.user_id
      const email = user.email
      const natalMoonSign = user.moon_sign
      const userName: string | null = null


      const idempotencyKey = `moon-ingress-${transitionAt}-${userId}`

      try {
        const { error: invokeError } = await supabase.functions.invoke(
          'send-transactional-email',
          {
            body: {
              templateName: 'moon-ingress-alert',
              recipientEmail: email,
              idempotencyKey,
              templateData: {
                toSign,
                fromSign,
                transitionTime: transitionAt,
                natalMoonSign,
                userName,
              },
            },
          }
        )

        if (invokeError) {
          throw new Error(invokeError.message)
        }

        // Record the notification so we don't repeat it
        const { error: insertError } = await supabase
          .from('moon_ingress_notifications')
          .insert({
            user_id: userId,
            transition_at: transitionAt,
            to_sign: toSign,
          })

        if (insertError) {
          console.error('[notify-moon-ingress] Failed to record notification', {
            userId,
            transitionAt,
            error: insertError.message,
          })
          errors.push(`record-${userId}-${transitionAt}: ${insertError.message}`)
        }

        totalNotified++
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[notify-moon-ingress] Failed to send ingress email', {
          userId,
          transitionAt,
          error: message,
        })
        errors.push(`send-${userId}-${transitionAt}: ${message}`)
      }
    }
  }

  // Any per-user failure means a paying member missed their ingress alert.
  if (errors.length > 0) {
    await reportError({
      source: 'notify-moon-ingress',
      severity: 'critical',
      message: `${errors.length} Sovereign ingress notification(s) failed`,
      context: { errors: errors.slice(0, 20), notified: totalNotified },
    })
  }

  return new Response(
    JSON.stringify({
      notified: totalNotified,
      transitions: transitions.length,
      errors: errors.length > 0 ? errors : undefined,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
})
