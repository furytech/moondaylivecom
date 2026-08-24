import {
  sendTemplateEmail,
  type SendTemplateEmailOptions,
  type SendTemplateEmailResult,
} from './transactional-email-templates/send-email.ts'

/**
 * Sends a registered app email through Lovable's managed email API and keeps
 * the project's own `email_send_log` history up to date.
 *
 * Delivery, retries, suppression and unsubscribe handling are owned by Lovable.
 * The log rows written here are a convenience history for the admin surfaces —
 * a failed log write never changes the send result.
 */
export async function sendAppEmail(
  supabase: { from: (table: string) => any },
  templateName: string,
  recipient: string,
  options: SendTemplateEmailOptions = {},
): Promise<SendTemplateEmailResult> {
  const logRow = async (
    status: 'sent' | 'suppressed' | 'failed',
    errorMessage?: string,
  ) => {
    const { error } = await supabase.from('email_send_log').insert({
      message_id: null,
      template_name: templateName,
      recipient_email: recipient,
      status,
      error_message: errorMessage ?? null,
    })
    if (error) {
      console.error('[sendAppEmail] Failed to write email_send_log', {
        templateName,
        status,
        code: error.code,
        message: error.message,
      })
    }
  }

  try {
    const result = await sendTemplateEmail(templateName, recipient, options)
    if (result.sent) {
      await logRow('sent')
    } else {
      await logRow('suppressed', 'Recipient is suppressed (bounce, complaint or unsubscribe)')
    }
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await logRow('failed', message.slice(0, 1000))
    throw error
  }
}
