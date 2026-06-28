import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms and Conditions — TeraAI',
  description:
    'Terms and conditions for using TeraAI at teraai.chat, including accounts, acceptable use, and subscriptions.',
  path: '/terms',
})

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children
}