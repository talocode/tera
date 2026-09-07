'use client'

import Link from 'next/link'
import SeoFooter from '@/components/seo/SeoFooter'

const audienceCards = [
  {
    title: 'For Builders',
    points: ['Code, debug, and deploy with AI assistance', 'Build projects and implementation roadmaps', 'Ship production-ready code from one workspace', 'Connect with TALOCODE_API_KEY'],
  },
  {
    title: 'For Writers',
    points: ['Draft, edit, and create content', 'Generate marketing copy, docs, and reports', 'Export to PDF and Word', 'Structured writing with citations'],
  },
  {
    title: 'For Researchers',
    points: ['Research with real-time web citations', 'Deep research for complex investigations', 'Fact-check, compare, and synthesize', 'Source-backed answers with live context'],
  },
]

const features = [
  'Unlimited conversations on the free plan',
  'Current answers with web research and citations',
  'Deep research modes on higher tiers',
  'File uploads for documents and images',
  'Specialized tools for code, writing, research, and planning',
  'Persistent notes and conversation history',
]

export default function AboutPage() {
  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-20 md:pt-10">
        <section className="tera-surface overflow-hidden px-6 py-10 md:px-10 md:py-14">
          <div className="max-w-4xl">
            <p className="tera-eyebrow">About Tera</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-5xl lg:text-6xl">
              Tera — an AI platform for building, coding, and creating real work
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-tera-secondary md:text-lg md:leading-8">
              Tera helps you build products, write content, research with sources, and ship real work — all in one workspace powered by Talocode Cloud.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/new" className="tera-button-primary">
                Start building free
              </Link>
              <Link href="/pricing" className="tera-button-secondary">
                View plans
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="tera-card">
            <p className="tera-eyebrow">Mission</p>
            <h2 className="mt-3 text-2xl font-semibold text-tera-primary">Shipping real work should feel like a conversation, not a wall of friction.</h2>
            <p className="mt-4 text-sm leading-7 text-tera-secondary md:text-base">
              Tera adapts to the task in front of you. Write a prompt, open a code or research tool, upload a document, or run a current-information search. The interface stays consistent while the assistance shifts to fit the job.
            </p>
          </div>
          <div className="tera-card-subtle px-6 py-6">
            <p className="tera-eyebrow">What makes it different</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-tera-primary/95">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-tera-neon" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {audienceCards.map((card) => (
            <div key={card.title} className="tera-card">
              <p className="tera-eyebrow">Audience</p>
              <h2 className="mt-3 text-xl font-semibold text-tera-primary">{card.title}</h2>
              <div className="mt-5 space-y-3 text-sm leading-7 text-tera-secondary">
                {card.points.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-white/25" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 tera-card-subtle px-6 py-6">
          <p className="tera-eyebrow">Learn more</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/new" className="tera-button-secondary">
              Start building
            </Link>
            <Link href="/pricing" className="tera-button-secondary">
              View plans
            </Link>
            <Link href="/help" className="tera-button-secondary">
              Help center
            </Link>
          </div>
        </section>

        <section className="mt-8 tera-card-subtle px-6 py-6">
          <p className="tera-eyebrow">Support open-source Talocode</p>
          <p className="mt-4 text-sm leading-7 text-tera-secondary">
            Talocode builds open-source workflow layers for builders: coding agents, writing tools, trading intelligence, video workflows, and local-first automation.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <a
              href="https://github.com/sponsors/Abdulmuiz44"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src="https://img.shields.io/badge/Sponsor-Abdulmuiz44-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white"
                alt="Sponsor Abdulmuiz44"
                height="32"
              />
            </a>
          </div>
        </section>

        <section className="mt-8 tera-card">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="tera-eyebrow">How it works</p>
              <ol className="mt-4 space-y-4 text-sm leading-7 text-tera-secondary">
                <li><span className="text-tera-primary">1.</span> Start with a natural prompt or open a work mode.</li>
                <li><span className="text-tera-primary">2.</span> Turn on research mode when you need current, cited information.</li>
                <li><span className="text-tera-primary">3.</span> Continue the same thread with follow-up questions, notes, and revisions.</li>
                <li><span className="text-tera-primary">4.</span> Return later through history and keep your work moving.</li>
              </ol>
            </div>
            <div className="tera-card-subtle px-6 py-6">
              <p className="tera-eyebrow">Legal</p>
              <h3 className="mt-3 text-xl font-semibold text-tera-primary">Policies and account details</h3>
              <p className="mt-4 text-sm leading-7 text-tera-secondary">
                Questions about privacy, terms, billing, or account access are covered in the links below.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/privacy" className="tera-button-secondary">
                  Privacy policy
                </Link>
                <Link href="/terms" className="tera-button-secondary">
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </section>

        <SeoFooter />
      </div>
    </div>
  )
}
