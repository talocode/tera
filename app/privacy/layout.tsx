import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy — TeraAI',
  description:
    'Read how TeraAI collects, uses, and protects your information when you use teraai.chat.',
  path: '/privacy',
})

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children
}