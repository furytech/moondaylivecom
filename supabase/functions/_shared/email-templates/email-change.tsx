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

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={siteName} width={64} height={64} style={logo} />
        <Heading style={h1}>Confirm your email change</Heading>
        <Text style={text}>
          You requested to change your email address for {siteName} from{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>
            {oldEmail}
          </Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Click the button below to confirm this change:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email Change
        </Button>
        <Text style={footer}>
          If you didn't request this change, please secure your account
          immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
