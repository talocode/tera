import type { Metadata } from 'next'
import Link from 'next/link'
import FaqSection from '@/components/seo/FaqSection'
import JsonLd from '@/components/seo/JsonLd'
import SeoFooter from '@/components/seo/SeoFooter'
import { buildPageMetadata, faqPageSchema } from '@/lib/seo'

const faqs = [
  {
    question: 'What is the Code mode?',
    answer:
      'Code mode lets you build, debug, review, and deploy code. Write clean, correct, and well-structured code with clear explanations.',
  },
  {
    question: 'Can Tera help with difficult coding problems?',
    answer:
      'Yes. Use Code mode to explain problems, define terms, and walk through solutions. Write the code and debug it.',
  },
  {
    question: 'Does Tera support file uploads?',
    answer:
      'Yes. You can upload documents and images on supported plans to analyze code, docs, and images in context.',
  },
  {
    question: 'Can I keep notes while working?',
    answer:
      'Yes. Tera includes notes so you can capture key points and return to them later.',
  },
  {
    question: 'Is the free plan enough to start building?',
    answer:
      'The free plan includes unlimited AI conversations and core tools. Higher tiers add more uploads, research limits, and Deep Research.',
  },
]

export const metadata: Metadata = buildPageMetadata({
  title: 'Tera Code Mode | Build Software with AI | Talocode',
  description:
    'Build software with Tera Code mode. Build, debug, review, and deploy code. Supported by Talocode Cloud.',
  path: '/ai-study-assistant',
})

export default function TeraCodePage() {
  return (
    <div className="tera-page">
      <JsonLd data={faqPageSchema(faqs)} />
      <div className="tera-page-shell pt-20 md:pt-10">
        <section className="tera-surface overflow-hidden px-6 py-10 md:px-10 md:py-14">
          <div className="max-w-4xl">
            <p className="tera-eyebrow">Code Mode</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-5xl lg:text-6xl">
              Build Software with Tera
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-tera-secondary md:text-lg">
              Build, debug, review, and deploy code. Write clean, correct, and well-structured code with clear explanations.
            </p>
            <div className="mt-8">
              <Link href="/new" className="tera-button-primary">
                Start building free
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 tera-card">
          <h2 className="text-2xl font-semibold text-tera-primary">What Tera Code mode supports</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-tera-secondary">
            <li>Build software projects</li>
            <li>Debug and review code</li>
            <li>Deploy and iterate</li>
            <li>Analyze uploaded files</li>
            <li>Keep notes and history</li>
          </ul>
        </section>

        <section className="mt-8 tera-card">
          <h2 className="text-2xl font-semibold text-tera-primary">Who it helps</h2>
          <p className="mt-4 text-sm leading-7 text-tera-secondary md:text-base">
            Developers, engineers, and builders who want to ship code faster with AI assistance.
          </p>
        </section>

        <section className="mt-8 tera-card-subtle px-6 py-6">
          <h2 className="text-xl font-semibold text-tera-primary">Related guides</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/" className="tera-button-secondary">
              Homepage
            </Link>
            <Link href="/ai-research-assistant" className="tera-button-secondary">
              Research
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
