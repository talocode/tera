import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'About TeraAI — AI Learning Companion',
  description:
    'Learn how TeraAI helps students, teachers, and curious learners research, explain difficult topics, and keep notes and history in one workspace.',
  path: '/about',
})

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children
}