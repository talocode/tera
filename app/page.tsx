import type { Metadata } from 'next'
import Link from 'next/link'
import SeoFooter from '@/components/seo/SeoFooter'
import PromptStarterTemplates from '@/components/PromptStarterTemplates'
import ContinueLaterQueue from '@/components/ContinueLaterQueue'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_URL,
  buildPageMetadata,
} from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: '/',
})

const highlights = [
  {
    title: 'Learn deeply',
    copy: 'Break down difficult topics, follow up with clearer questions, and build understanding step by step.',
  },
  {
    title: 'Research better',
    copy: 'Use web-backed answers with citations when you need current information, then go deeper on Pro and Plus plans.',
  },
  {
    title: 'Turn knowledge into projects',
    copy: 'Move from explanation to planning, notes, and next steps so what you study becomes something you can build.',
  },
]

export default function HomePage() {
  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-24 md:pt-10">
        <section className="tera-surface overflow-hidden px-6 py-10 md:px-10 md:py-14">
          <div className="max-w-4xl">
            <p className="tera-eyebrow">TeraAI</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-6xl">
              Your AI learning companion for deep learning and research
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-tera-secondary md:text-lg">
              TeraAI helps students, curious learners, researchers, and builders learn anything deeply,
              understand difficult topics, research with clearer context, and turn what they study into real projects.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/new" className="tera-button-primary">
                Start learning with TeraAI
              </Link>
              <Link href="/ai-learning-companion" className="tera-button-secondary">
                What is an AI learning companion?
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="tera-card">
              <p className="tera-eyebrow">Why TeraAI</p>
              <h2 className="mt-3 text-xl font-semibold text-tera-primary">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-tera-secondary">{item.copy}</p>
            </div>
          ))}
        </section>

        <PromptStarterTemplates launchPathPrefix="/new" />

        <ContinueLaterQueue />

        <section className="mt-8 tera-card">
          <p className="tera-eyebrow">Built for real learning workflows</p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-tera-secondary md:text-base">
            Ask questions in natural language, upload documents, use specialized learning tools, save notes,
            and return to your conversation history. TeraAI keeps research, explanation, and planning in one workspace at{' '}
            <a href={SITE_URL} className="text-tera-primary underline-offset-2 hover:underline">
              teraai.chat
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/ai-study-assistant" className="tera-button-secondary">
              AI study assistant
            </Link>
            <Link href="/ai-research-assistant" className="tera-button-secondary">
              AI research assistant
            </Link>
            <Link href="/pricing" className="tera-button-secondary">
              View pricing
            </Link>
          </div>
        </section>

        <SeoFooter />
      </div>
    </div>
  )
}
