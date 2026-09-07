import type { Metadata } from 'next'
import Link from 'next/link'
import FaqSection from '@/components/seo/FaqSection'
import JsonLd from '@/components/seo/JsonLd'
import SeoFooter from '@/components/seo/SeoFooter'
import { buildPageMetadata, faqPageSchema } from '@/lib/seo'

const faqs = [
  {
    question: 'What is Tera?',
    answer:
      'Tera is an AI platform powered by Talocode Cloud. Code, write, research, and build — all in one workspace with five work modes: General, Code, Write, Search, and Build.',
  },
  {
    question: 'How is Tera different from a normal chatbot?',
    answer:
      'Tera is built around work modes: General for quick answers, Code for building software, Write for creating content, Search for cited research, and Build for planning projects.',
  },
  {
    question: 'Can Tera help with research?',
    answer:
      'Yes. Use Search mode for cited web research, or Build mode to turn research into structured project plans.',
  },
  {
    question: 'Is Tera only for developers?',
    answer:
      'No. Developers, writers, researchers, and builders all use Tera. Choose the work mode that fits your task.',
  },
  {
    question: 'Can I use Tera to build projects?',
    answer:
      'Yes. Use Build mode to outline projects, compare approaches, and create implementation roadmaps.',
  },
]

export const metadata: Metadata = buildPageMetadata({
  title: 'Tera AI Platform | Code, Write, Research, Build | Talocode',
  description:
    'Tera is an AI platform powered by Talocode Cloud. Code, write, research, and build — all in one workspace with five work modes: General, Code, Write, Search, and Build.',
  path: '/',
})

export default function TeraPlatformPage() {
  return (
    <div className="tera-page">
      <JsonLd data={faqPageSchema(faqs)} />
      <div className="tera-page-shell pt-20 md:pt-10">
        <section className="tera-surface overflow-hidden px-6 py-10 md:px-10 md:py-14">
          <div className="max-w-4xl">
            <p className="tera-eyebrow">AI Platform</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-5xl lg:text-6xl">
              Tera AI Platform
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-tera-secondary md:text-lg">
              Code, write, research, and build. All powered by Talocode Cloud, all in one workspace.
            </p>
            <div className="mt-8">
              <Link href="/new" className="tera-button-primary">
                Start building free
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 tera-card">
          <h2 className="text-2xl font-semibold text-tera-primary">Five work modes</h2>
          <p className="mt-4 text-sm leading-7 text-tera-secondary md:text-base">
            Tera gives you five focused modes: General for quick answers, Code for building software,
            Write for creating content, Search for cited research, and Build for planning projects.
          </p>
        </section>

        <section className="mt-8 tera-card">
          <h2 className="text-2xl font-semibold text-tera-primary">
            Why Tera is different
          </h2>
          <p className="mt-4 text-sm leading-7 text-tera-secondary md:text-base">
            One-off answers can help, but real work needs continuity: follow-ups, sources, notes, and a
            workspace that remembers what you are building.
          </p>
        </section>

        <section className="mt-8 tera-card">
          <h2 className="text-2xl font-semibold text-tera-primary">How Tera helps you build</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-tera-secondary">
            <li>Build software with Code mode</li>
            <li>Draft and create content with Write mode</li>
            <li>Research with cited web answers in Search mode</li>
            <li>Plan projects and roadmaps in Build mode</li>
            <li>Get clear answers in General mode</li>
          </ul>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="tera-card">
            <h2 className="text-xl font-semibold text-tera-primary">Who Tera is for</h2>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-tera-secondary">
              <li>Developers</li>
              <li>Writers</li>
              <li>Researchers</li>
              <li>Builders</li>
            </ul>
          </div>
          <div className="tera-card-subtle px-6 py-6">
            <h2 className="text-xl font-semibold text-tera-primary">Work modes</h2>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-tera-secondary">
              <li>General — Ask anything</li>
              <li>Code — Build and debug</li>
              <li>Write — Draft and create</li>
              <li>Search — Research with citations</li>
              <li>Build — Plan and roadmap</li>
            </ul>
          </div>
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
