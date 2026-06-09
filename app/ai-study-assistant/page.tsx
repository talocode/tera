import type { Metadata } from 'next'
import Link from 'next/link'
import FaqSection from '@/components/seo/FaqSection'
import JsonLd from '@/components/seo/JsonLd'
import SeoFooter from '@/components/seo/SeoFooter'
import { buildPageMetadata, faqPageSchema } from '@/lib/seo'

const faqs = [
  {
    question: 'What is an AI study assistant?',
    answer:
      'An AI study assistant helps you break down coursework, review concepts, and prepare for exams with explanations and follow-up questions—not just copied answers.',
  },
  {
    question: 'Can TeraAI help with homework and difficult subjects?',
    answer:
      'Yes. You can ask TeraAI to explain problems, define terms, and walk through concepts. Use it to understand the material, not to skip learning.',
  },
  {
    question: 'Does TeraAI support file uploads for study materials?',
    answer:
      'Yes. You can upload documents and images on supported plans to work through readings, notes, and assignments in context.',
  },
  {
    question: 'Can I keep notes while I study?',
    answer:
      'Yes. TeraAI includes notes so you can capture key points and return to them later.',
  },
  {
    question: 'Is the free plan enough to start studying?',
    answer:
      'The free plan includes unlimited AI conversations and core tools. Higher tiers add more uploads, research limits, and Deep Research.',
  },
]

export const metadata: Metadata = buildPageMetadata({
  title: 'AI Study Assistant for Students and Self-Learners | TeraAI',
  description:
    'Study better with TeraAI: explain difficult topics, review for exams, upload materials, and keep notes in one AI study assistant.',
  path: '/ai-study-assistant',
})

export default function AiStudyAssistantPage() {
  return (
    <div className="tera-page">
      <JsonLd data={faqPageSchema(faqs)} />
      <div className="tera-page-shell pt-20 md:pt-10">
        <section className="tera-surface overflow-hidden px-6 py-10 md:px-10 md:py-14">
          <div className="max-w-4xl">
            <p className="tera-eyebrow">AI study assistant</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-5xl lg:text-6xl">
              AI Study Assistant for Clearer Understanding
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-tera-secondary md:text-lg">
              Use TeraAI to break down tough subjects, review for exams, and keep study notes organized—without losing
              the thread of what you are learning.
            </p>
            <div className="mt-8">
              <Link href="/new" className="tera-button-primary">
                Start studying with TeraAI
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 tera-card">
          <h2 className="text-2xl font-semibold text-tera-primary">Study workflows TeraAI supports</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-tera-secondary">
            <li>Explain a concept before an exam</li>
            <li>Walk through homework step by step</li>
            <li>Summarize readings from uploaded files</li>
            <li>Build a review checklist from your notes</li>
            <li>Ask follow-ups until the idea is clear</li>
          </ul>
        </section>

        <section className="mt-8 tera-card">
          <h2 className="text-2xl font-semibold text-tera-primary">Who it helps</h2>
          <p className="mt-4 text-sm leading-7 text-tera-secondary md:text-base">
            High school and university students, exam prep, and self-learners picking up a new skill or subject on their
            own schedule.
          </p>
        </section>

        <section className="mt-8 tera-card-subtle px-6 py-6">
          <h2 className="text-xl font-semibold text-tera-primary">Related guides</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/" className="tera-button-secondary">
              Homepage
            </Link>
            <Link href="/ai-learning-companion" className="tera-button-secondary">
              AI learning companion
            </Link>
            <Link href="/pricing" className="tera-button-secondary">
              Pricing
            </Link>
          </div>
        </section>

        <FaqSection items={faqs} />
        <SeoFooter />
      </div>
    </div>
  )
}
