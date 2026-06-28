import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Pricing — TeraAI Plans',
  description:
    'Compare TeraAI Free, Pro, and Plus plans. Unlimited conversations on every tier, with higher limits and Deep Research on paid plans.',
  path: '/pricing',
})

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children
}