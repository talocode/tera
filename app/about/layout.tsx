import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'About Tera — AI Platform for Builders | Talocode',
  description:
    'Learn how Tera, powered by Talocode Cloud, helps builders code, write, research, and ship real work in one workspace.',
  path: '/about',
})

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children
}