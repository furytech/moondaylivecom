/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://moondaylive.com/assets/moon-logo-new.png'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={siteName} width={64} height={64} style={logo} />
        <Heading style={h1}>You've been invited</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Click the button below to accept the invitation and begin your journey
          through the lunar cycle.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this
          email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
}

const container = {
  padding: '32px 24px',
  maxWidth: '520px',
}

const logo = {
  display: 'block',
  margin: '0 auto 24px',
  borderRadius: '50%',
}

const h1 = {
  fontSize: '26px',
  fontWeight: '600' as const,
  color: '#0B1030',
  margin: '0 0 20px',
  textAlign: 'center' as const,
  letterSpacing: '-0.01em',
}

const text = {
  fontSize: '15px',
  color: '#5A5A6E',
  lineHeight: '1.6',
  margin: '0 0 20px',
}

const link = { color: '#6B66F7', textDecoration: 'underline' }

const button = {
  backgroundColor: '#6B66F7',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '8px 0 24px',
}

const footer = {
  fontSize: '12px',
  color: '#8B8B9A',
  margin: '24px 0 0',
  lineHeight: '1.5',
}
