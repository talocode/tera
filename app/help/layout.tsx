import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Help Center — TeraAI',
  description:
    'Billing, plans, account access, and product help for TeraAI. Find answers about subscriptions, credits, uploads, and support.',
  path: '/help',
})

export default function HelpLayout({ children }: { children: ReactNode }) {
  return children
}