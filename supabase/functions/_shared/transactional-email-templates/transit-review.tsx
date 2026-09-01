import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

/**
 * Operator review email for one Moon ingress.
 *
 * Four independent blocks — Moonday Blog, Reddit, Facebook/Instagram,
 * Pinterest — each with its own full draft, the verified constellation
 * thumbnail, and its own share intent. Nothing is auto-posted: the operator
 * copies the text and opens the platform.
 */

interface ChannelBlock {
  key: string
  label: string
  text: string
  shareUrl: string
  shareLabel: string
}

interface Props {
  title?: string
  sign?: string
  transitionTime?: string
  imageUrl?: string | null
  imageWarning?: string | null
  adminUrl?: string
  channels?: ChannelBlock[]
}

const NAVY = '#011124'
const LILAC = '#5b5bd6'
const MUTED = '#5c6470'

const Email = ({
  title = 'Moon ingress',
  sign,
  transitionTime,
  imageUrl,
  imageWarning,
  adminUrl = 'https://moondaylive.com/admin/blog',
  channels = [],
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Review drafts: ${title}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{title}</Heading>
        {sign ? <Text style={meta}>Moon enters {sign}</Text> : null}
        {transitionTime ? <Text style={meta}>{transitionTime}</Text> : null}

        {imageUrl ? (
          <Img src={imageUrl} alt={sign || 'Constellation'} width="520" style={hero} />
        ) : null}

        {imageWarning ? <Text style={warn}>Image check: {imageWarning}</Text> : null}

        {channels.map((c) => (
          <Section key={c.key} style={block}>
            <Heading as="h2" style={h2}>
              {c.label}
            </Heading>
            {imageUrl ? (
              <Img src={imageUrl} alt={sign || 'Constellation'} width="96" style={thumb} />
            ) : null}
            <Text style={draft}>{c.text || 'No draft generated for this channel.'}</Text>
            <Button href={c.shareUrl} style={button}>
              {c.shareLabel}
            </Button>
            <Text style={hint}>
              Select the draft above and copy it, then paste it into the platform.
            </Text>
          </Section>
        ))}

        <Hr style={hr} />
        <Text style={footer}>
          <Link href={adminUrl} style={link}>
            Edit on MoondayLive Admin Panel
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) =>
    `Review drafts: ${(data?.title as string) || 'Moon ingress'}`,
  displayName: 'Transit review (operator)',
  previewData: {
    title: 'The Moon enters Virgo',
    sign: 'Virgo',
    transitionTime: '12 September 2026, 09:14 UTC',
    imageUrl: 'https://moondaylive.com/assets/signs/Virgo.png',
    imageWarning: 'Virgo artwork carries its name above the constellation, not beneath it.',
    adminUrl: 'https://moondaylive.com/admin/blog',
    channels: [
      {
        key: 'blog',
        label: 'Moonday Blog',
        text: 'Check your moon sign on MoondayLive.com → https://moondaylive.com\n\nThe Moon crosses into Virgo...',
        shareUrl: 'https://moondaylive.com/blog/moon-enters-virgo',
        shareLabel: 'View on site',
      },
      {
        key: 'reddit',
        label: 'Reddit',
        text: 'Tracking the gut-heart-head chain through this Virgo ingress...',
        shareUrl: 'https://reddit.com',
        shareLabel: 'Open Reddit',
      },
      {
        key: 'facebook',
        label: 'Facebook / Instagram',
        text: "Today's atmosphere tightens up a little...",
        shareUrl: 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmoondaylive.com',
        shareLabel: 'Share to Facebook',
      },
      {
        key: 'pinterest',
        label: 'Pinterest',
        text: 'Moon in Virgo: what to track\n• precision over speed\n• body signals first',
        shareUrl: 'https://www.pinterest.com/pin-builder/?url=https%3A%2F%2Fmoondaylive.com',
        shareLabel: 'Create Pin',
      },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px 20px', maxWidth: '600px' }
const h1 = { color: NAVY, fontSize: '22px', textAlign: 'center' as const, margin: '0 0 8px' }
const h2 = { color: NAVY, fontSize: '15px', margin: '0 0 10px', textAlign: 'center' as const }
const meta = { color: MUTED, fontSize: '12px', textAlign: 'center' as const, margin: '0 0 4px' }
const hero = { width: '100%', maxWidth: '520px', margin: '16px auto', display: 'block' }
const thumb = { display: 'block', margin: '0 auto 12px', borderRadius: '6px' }
const warn = {
  backgroundColor: '#fff7e6',
  color: '#8a5a00',
  fontSize: '12px',
  padding: '10px 12px',
  borderRadius: '6px',
  textAlign: 'center' as const,
}
const block = {
  border: '1px solid #e6e8ec',
  borderRadius: '10px',
  padding: '16px',
  margin: '16px 0',
}
const draft = {
  color: '#1d2430',
  fontSize: '13px',
  lineHeight: '20px',
  whiteSpace: 'pre-wrap' as const,
  textAlign: 'center' as const,
}
const button = {
  backgroundColor: LILAC,
  color: '#ffffff',
  borderRadius: '999px',
  fontSize: '13px',
  padding: '10px 20px',
  display: 'block',
  textAlign: 'center' as const,
  margin: '12px auto 0',
  maxWidth: '260px',
}
const hint = { color: MUTED, fontSize: '11px', textAlign: 'center' as const, margin: '10px 0 0' }
const hr = { borderColor: '#e6e8ec', margin: '24px 0 12px' }
const footer = { textAlign: 'center' as const, fontSize: '12px' }
const link = { color: LILAC }
