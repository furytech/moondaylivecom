import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  source?: string
  severity?: string
  message?: string
  occurredAt?: string
  affectsSubscribers?: boolean
  context?: string
}

const brandNavy = '#011124'
const brandLilac = '#8b8df2'
const brandCream = '#f4f4f5'
const alertRed = '#ff6b6b'

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
}

const container = {
  backgroundColor: brandNavy,
  borderRadius: '14px',
  margin: '20px auto',
  maxWidth: '560px',
  padding: '32px',
}

const heading = {
  color: alertRed,
  fontSize: '22px',
  fontWeight: '600',
  letterSpacing: '-0.02em',
  textAlign: 'center' as const,
  margin: '0 0 18px',
}

const bodyText = {
  color: brandCream,
  fontSize: '15px',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  margin: '0 0 10px',
}

const label = {
  color: brandLilac,
  fontSize: '12px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '18px 0 4px',
}

const pre = {
  backgroundColor: 'rgba(139,141,242,0.10)',
  borderRadius: '8px',
  color: brandCream,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '8px 0 0',
  padding: '14px',
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-word' as const,
}

const SystemErrorAlert = ({
  source = 'unknown',
  severity = 'error',
  message = 'An unexpected failure occurred.',
  occurredAt = new Date().toISOString(),
  affectsSubscribers = true,
  context = '{}',
}: Props) => (
  <Html>
    <Head />
    <Preview>{`${severity.toUpperCase()} in ${source}: ${message}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>
          {severity === 'critical' ? 'Critical failure' : 'System failure'}
        </Heading>

        <Text style={bodyText}>
          <strong>{source}</strong> reported a {severity} at {occurredAt} UTC.
        </Text>

        {affectsSubscribers ? (
          <Text style={{ ...bodyText, color: alertRed }}>
            Sovereign members are affected — please review now.
          </Text>
        ) : null}

        <Section>
          <Text style={label}>Message</Text>
          <Text style={pre}>{message}</Text>

          <Text style={label}>Context</Text>
          <Text style={pre}>{context}</Text>
        </Section>

        <Text style={{ ...bodyText, marginTop: '22px', fontSize: '13px', opacity: 0.8 }}>
          Full history: moondaylive.com/admin/errors
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template: TemplateEntry = {
  component: SystemErrorAlert,
  displayName: 'System error alert',
  subject: (data) =>
    `[Moonday ${String(data.severity || 'error').toUpperCase()}] ${data.source || 'system'} — ${String(
      data.message || 'failure',
    ).slice(0, 80)}`,
  previewData: {
    source: 'notify-moon-ingress',
    severity: 'critical',
    message: 'Failed to fetch transitions: connection timeout',
    occurredAt: new Date().toISOString(),
    affectsSubscribers: true,
    context: '{\n  "transitionId": "abc-123"\n}',
  },
}

export default SystemErrorAlert
