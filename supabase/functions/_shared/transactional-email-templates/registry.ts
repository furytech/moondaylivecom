import type { FC } from 'npm:react@18.3.1'
import { template as moonIngressAlert } from './moon-ingress-alert.tsx'
import { template as systemErrorAlert } from './system-error-alert.tsx'
import { template as substackDraft } from './substack-draft.tsx'

export interface TemplateEntry {
  component: FC<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'moon-ingress-alert': moonIngressAlert,
  'system-error-alert': systemErrorAlert,
  'substack-draft': substackDraft,
}
