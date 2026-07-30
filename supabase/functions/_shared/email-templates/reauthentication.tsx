/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://moondaylive.com/assets/moon-logo-new.png'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Moonday verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Moonday Live" width={64} height={64} style={logo} />
        <Heading style={h1}>Your verification code</Heading>
        <Text style={text}>
          Use the code below to confirm your identity and continue your session:
        </Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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

const codeStyle = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
  fontSize: '32px',
  fontWeight: '600' as const,
  letterSpacing: '0.08em',
  color: '#0B1030',
  backgroundColor: '#F4F4F8',
  padding: '16px 24px',
  borderRadius: '12px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const footer = {
  fontSize: '12px',
  color: '#8B8B9A',
  margin: '24px 0 0',
  lineHeight: '1.5',
}
