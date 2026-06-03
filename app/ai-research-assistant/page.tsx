import type { Metadata } from 'next'
import Link from 'next/link'
import FaqSection from '@/components/seo/FaqSection'
import JsonLd from '@/components/seo/JsonLd'
import SeoFooter from '@/components/seo/SeoFooter'
import { buildPageMetadata, faqPageSchema } from '@/lib/seo'

const faqs = [
  {
    question: 'What is an AI research assistant?',
    answer:
      'An AI research assistant helps you frame questions, gather cited information, compare sources, and synthesize findings—not replace your judgment.',
  },
  {
    question: 'Does TeraAI provide citations?',
    answer:
      'Yes. Web-backed research on TeraAI can include citations so you can verify sources and continue reading.',
  },
  {
    question: 'What is Deep Research on TeraAI?',
    answer:
      'Deep Research is available on Pro and Plus plans. It supports longer, structured research briefs with sources, viewpoints, and recommendations.',
  },
  {
    question: 'Can researchers use TeraAI for literature-style review?',
    answer:
      'TeraAI helps you compare ideas, summarize sources, and draft structured notes. Always verify critical claims against primary sources.',
  },
  {
    question: 'How is this different from the AI learning companion page?',
    answer:
      'The learning companion page focuses on understanding and projects. This page focuses on research workflows: questions, sources, and synthesis.',
  },
]

export const metadata: Metadata = buildPageMetadata({
  title: 'AI Research Assistant with Cited Web Answers | TeraAI',
  description:
    'Research better with TeraAI: cited web answers, deeper research on Pro and Plus, and a workspace to compare sources and build clear briefs.',
  path: '/ai-research-assistant',
})

export default function AiResearchAssistantPage() {
  return (
    <div className="tera-page">
      <JsonLd data={faqPageSchema(faqs)} />
      <div className="tera-page-shell pt-24 md:pt-10">
        <section className="tera-surface overflow-hidden px-6 py-10 md:px-10 md:py-14">
          <div className="max-w-4xl">
            <p className="tera-eyebrow">AI research assistant</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-6xl">
              AI Research Assistant for Clearer, Cited Work
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-tera-secondary md:text-lg">
              Frame better questions, pull in cited web information, and synthesize what you find—whether you are
              writing a paper, exploring a topic, or planning a project.
            </p>
            <div className="mt-8">
              <Link href="/new" className="tera-button-primary">
                Start researching with TeraAI
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 tera-card">
          <h2 className="text-2xl font-semibold text-tera-primary">Research workflows TeraAI supports</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-tera-secondary">
            <li>Define objectives and key questions</li>
            <li>Find current information with citations</li>
            <li>Compare viewpoints and evidence quality</li>
            <li>Draft structured briefs and recommendations</li>
            <li>Keep notes and history in one workspace</li>
          </ul>
        </section>

        <section className="mt-8 tera-card">
          <h2 className="text-2xl font-semibold text-tera-primary">Plans and depth</h2>
          <p className="mt-4 text-sm leading-7 text-tera-secondary md:text-base">
            Free includes a limited number of Tavily-backed web research requests per month. Pro and Plus increase limits
            and unlock Deep Research for longer, structured briefs.
          </p>
          <Link href="/pricing" className="tera-button-secondary mt-6 inline-flex">
            Compare plans
          </Link>
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
            <Link href="/about" className="tera-button-secondary">
              About TeraAI
            </Link>
          </div>
        </section>

        <FaqSection items={faqs} />
        <SeoFooter />
      </div>
    </div>
  )
}