import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

/**
 * Substack draft bridge.
 *
 * When a transit post goes live on the Moonday blog, the matching newsletter
 * edition is emailed here fully formatted. The body is rendered as real
 * headings/paragraphs/quotes so it can be selected and pasted straight into
 * the Substack editor with its structure intact — no re-formatting by hand.
 *
 * Markdown is converted to React elements (never raw HTML) so nothing from the
 * generator can inject markup into the email.
 */

interface Props {
  title?: string
  content?: string
  toSign?: string
  ingressTime?: string
  postUrl?: string
  adminUrl?: string
}

const brandNavy = '#011124'
const brandLilac = '#5f61d6'
const ink = '#1c1f2b'
const muted = '#6b7280'

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
}

const container = {
  margin: '20px auto',
  maxWidth: '640px',
  padding: '28px',
}

const banner = {
  backgroundColor: brandNavy,
  borderRadius: '12px',
  padding: '20px 24px',
  marginBottom: '28px',
}

const bannerTitle = {
  color: '#a5a7f5',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
  textAlign: 'center' as const,
}

const bannerText = {
  color: '#f4f4f5',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
}

const h1 = {
  color: ink,
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.25',
  letterSpacing: '-0.02em',
  margin: '0 0 20px',
}

const h2 = {
  color: ink,
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '28px 0 12px',
}

const para = {
  color: ink,
  fontSize: '16px',
  lineHeight: '1.7',
  margin: '0 0 16px',
}

const quote = {
  color: ink,
  fontSize: '16px',
  fontStyle: 'italic' as const,
  lineHeight: '1.7',
  borderLeft: `3px solid ${brandLilac}`,
  paddingLeft: '16px',
  margin: '0 0 16px',
}

const listItem = {
  color: ink,
  fontSize: '16px',
  lineHeight: '1.7',
  margin: '0 0 8px 0',
  paddingLeft: '18px',
}

const footer = {
  color: muted,
  fontSize: '12px',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  marginTop: '8px',
}

/** Inline **bold** / *italic* / `code` → React nodes. No raw HTML ever. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let last = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const token = match[0]
    const key = `${keyPrefix}-i${i++}`
    if (token.startsWith('**')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={key} style={{ fontFamily: 'monospace' }}>
          {token.slice(1, -1)}
        </code>,
      )
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>)
    }
    last = match.index + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

/** Block-level markdown → React elements. */
function renderMarkdown(md: string): React.ReactNode[] {
  const blocks = md.replace(/\r\n/g, '\n').split(/\n{2,}/)
  const out: React.ReactNode[] = []

  blocks.forEach((rawBlock, bi) => {
    const block = rawBlock.trim()
    if (!block) return
    const key = `b${bi}`

    if (block.startsWith('## ')) {
      out.push(
        <Heading as="h2" key={key} style={h2}>
          {renderInline(block.slice(3).trim(), key)}
        </Heading>,
      )
      return
    }
    if (block.startsWith('# ')) {
      out.push(
        <Heading as="h1" key={key} style={h1}>
          {renderInline(block.slice(2).trim(), key)}
        </Heading>,
      )
      return
    }
    if (block.startsWith('> ')) {
      const text = block
        .split('\n')
        .map((l) => l.replace(/^>\s?/, ''))
        .join(' ')
      out.push(
        <Text key={key} style={quote}>
          {renderInline(text, key)}
        </Text>,
      )
      return
    }
    if (/^[-*]\s+/.test(block)) {
      block.split('\n').forEach((line, li) => {
        const item = line.replace(/^[-*]\s+/, '').trim()
        if (!item) return
        out.push(
          <Text key={`${key}-l${li}`} style={listItem}>
            • {renderInline(item, `${key}-l${li}`)}
          </Text>,
        )
      })
      return
    }

    out.push(
      <Text key={key} style={para}>
        {renderInline(block.replace(/\n/g, ' '), key)}
      </Text>,
    )
  })

  return out
}

const Email = ({ title, content, toSign, ingressTime, postUrl, adminUrl }: Props) => {
  const heading = title || `The Moon enters ${toSign || 'a new sign'}`
  const when = ingressTime
    ? new Date(ingressTime).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short',
      })
    : null

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Ready to paste into Substack: ${heading}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={banner}>
            <Text style={bannerTitle}>Substack edition ready</Text>
            <Text style={bannerText}>
              This edition is formatted and ready. Select everything below the
              line, copy it, and paste into a new Substack post — headings and
              emphasis carry over. Then hit send when you're ready.
            </Text>
          </Section>

          {when && (
            <Text style={{ ...para, color: muted, fontSize: '13px' }}>
              Ingress: {when}
              {postUrl ? ' · ' : ''}
              {postUrl && (
                <Link href={postUrl} style={{ color: brandLilac }}>
                  View live post
                </Link>
              )}
            </Text>
          )}

          <Hr style={{ borderColor: '#e5e7eb', margin: '0 0 28px' }} />

          {content ? (
            renderMarkdown(content)
          ) : (
            <Text style={para}>
              No newsletter copy was attached to this post. Open the Journal
              admin to generate or paste an edition.
            </Text>
          )}

          <Hr style={{ borderColor: '#e5e7eb', margin: '32px 0 16px' }} />

          <Text style={footer}>
            Moonday Live · Journal automation
            {adminUrl ? ' · ' : ''}
            {adminUrl && (
              <Link href={adminUrl} style={{ color: brandLilac }}>
                Open in Journal admin
              </Link>
            )}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Props) =>
    `Substack ready: ${data.title || `The Moon enters ${data.toSign || 'a new sign'}`}`,
  displayName: 'Substack Draft Bridge',
  previewData: {
    title: 'The Moon enters Scorpio: what to feel, notice, and release',
    toSign: 'Scorpio',
    ingressTime: new Date().toISOString(),
    postUrl: 'https://moondaylive.com/blog/the-moon-enters-scorpio',
    adminUrl: 'https://moondaylive.com/admin/blog',
    content:
      '# The week everyone reads the room\n\nThere is a particular kind of quiet that shows up when the Moon moves into Scorpio, and it is not the restful kind.\n\n## What shifts\n\nConversations get shorter and more loaded. People say the **second** thing they were thinking instead of the first.\n\n> Nobody announces this. It just happens.\n\n## The undercurrent\n\n- Patience for small talk drops\n- Loyalty questions get asked out loud\n\nIf any of this lands, your own chart has more to say about it.',
  },
} satisfies TemplateEntry
