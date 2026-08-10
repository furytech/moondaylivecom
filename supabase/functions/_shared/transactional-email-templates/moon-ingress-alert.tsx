import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  toSign?: string
  fromSign?: string
  transitionTime?: string
  natalMoonSign?: string
  userName?: string
}

const brandNavy = '#011124'
const brandLilac = '#8b8df2'
const brandCream = '#f4f4f5'

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
}

const container = {
  backgroundColor: brandNavy,
  borderRadius: '14px',
  margin: '20px auto',
  maxWidth: '520px',
  padding: '32px',
}

const previewText = {
  color: brandCream,
  fontSize: '14px',
  lineHeight: '1.5',
}

const heading = {
  color: brandLilac,
  fontSize: '24px',
  fontWeight: '600',
  letterSpacing: '-0.02em',
  textAlign: 'center' as const,
  margin: '0 0 18px',
}

const bodyText = {
  color: brandCream,
  fontSize: '16px',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  margin: '0 0 18px',
}

const ctaButton = {
  backgroundColor: brandLilac,
  borderRadius: '999px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '600',
  letterSpacing: '0.08em',
  padding: '14px 28px',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
}

const footer = {
  color: 'rgba(244,244,245,0.55)',
  fontSize: '12px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
  marginTop: '28px',
}

const Email = ({ toSign, fromSign, transitionTime, natalMoonSign, userName }: Props) => {
  const displayName = userName ? `Hi ${userName},` : 'Hi there,'
  const ingressLabel = transitionTime
    ? new Date(transitionTime).toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : 'soon'

  const isNatal = natalMoonSign && toSign === natalMoonSign
  const subjectSuffix = isNatal ? ` — The Moon returns to ${natalMoonSign}` : ''

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {`The Moon is entering ${toSign || 'a new sign'} in about 2 hours${subjectSuffix}.`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ textAlign: 'center' }}>
            <Heading as="h1" style={heading}>
              Moon Ingress Alert
            </Heading>
          </Section>

          <Text style={bodyText}>{displayName}</Text>

          <Text style={bodyText}>
            The Moon is leaving {fromSign || 'its current sign'} and entering{' '}
            <strong style={{ color: brandLilac }}>{toSign}</strong> around{' '}
            <strong>{ingressLabel}</strong>.
          </Text>

          {isNatal && (
            <Text style={bodyText}>
              This is a return to your natal Moon sign ({natalMoonSign}). Your
              emotional baseline is lit up — a good day to check your Sovereign
              blueprint.
            </Text>
          )}

          {!isNatal && natalMoonSign && (
            <Text style={bodyText}>
              Your natal Moon sign is {natalMoonSign}. See how this shift
              resonates through your Sovereign blueprint.
            </Text>
          )}

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button
              href="https://moondaylive.com/blueprint"
              style={ctaButton}
            >
              Open My Blueprint
            </Button>
          </Section>

          <Text style={footer}>
            Moonday Live · Entertainment astrology only.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Props) =>
    `The Moon enters ${data.toSign || 'a new sign'} in about 2 hours${
      data.natalMoonSign && data.toSign === data.natalMoonSign
        ? ` — returning to your ${data.natalMoonSign} Moon`
        : ''
    }`,
  displayName: 'Moon Ingress Alert',
  previewData: {
    toSign: 'Scorpio',
    fromSign: 'Libra',
    transitionTime: new Date().toISOString(),
    natalMoonSign: 'Scorpio',
    userName: 'Stargazer',
  },
} satisfies TemplateEntry
