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
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://moondaylive.com/assets/moon-logo-new.png'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={siteName} width={64} height={64} style={logo} />
        <Heading style={h1}>Your Portal Link</Heading>
        <Text style={text}>
          Click the button below to log in to {siteName}. This link is sacred and
          will expire shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Log In
        </Button>
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
