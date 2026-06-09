'use client'

import Link from 'next/link'
import SeoFooter from '@/components/seo/SeoFooter'

const audienceCards = [
  {
    title: 'For Students',
    points: ['Get homework help that clicks', 'Break down tough concepts simply', 'Prepare for exams with guided support', 'Use web-backed answers when you need current information'],
  },
  {
    title: 'For Teachers',
    points: ['Create lessons and class materials faster', 'Generate worksheets, quizzes, and rubrics', 'Draft clear classroom communication', 'Keep resources and notes organized in one place'],
  },
  {
    title: 'For Everyone',
    points: ['Learn new skills on demand', 'Build roadmaps for projects and ideas', 'Switch between research, writing, and planning', 'Keep growing from one workspace'],
  },
]

const features = [
  'Unlimited conversations on the free plan',
  'Current answers with Tavily-backed web research and citations',
  'Deeper research modes on higher tiers',
  'File uploads for documents and images',
  'Specialized tools for teaching, learning, and planning',
  'Persistent notes and conversation history',
]

export default function AboutPage() {
  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-20 md:pt-10">
        <section className="tera-surface overflow-hidden px-6 py-10 md:px-10 md:py-14">
          <div className="max-w-4xl">
            <p className="tera-eyebrow">About Tera</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-6xl">
              TeraAI — your AI learning companion for deep learning and research
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-tera-secondary md:text-lg">
              TeraAI helps you learn difficult topics deeply, research with clearer context, and turn what you study into
              real projects. Research, tools, notes, and conversation history stay in one workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/new" className="tera-button-primary">
                Start with Tera
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
            <h2 className="mt-3 text-2xl font-semibold text-tera-primary">Learning should feel like a conversation, not a wall of friction.</h2>
            <p className="mt-4 text-sm leading-7 text-tera-secondary md:text-base">
              Tera adapts to the task in front of you. Ask a direct question, open a teaching tool, upload a document, or run a current-information search. The interface stays consistent while the assistance shifts to fit the job.
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
            <Link href="/ai-learning-companion" className="tera-button-secondary">
              AI learning companion
            </Link>
            <Link href="/ai-study-assistant" className="tera-button-secondary">
              AI study assistant
            </Link>
            <Link href="/ai-research-assistant" className="tera-button-secondary">
              AI research assistant
            </Link>
          </div>
        </section>

        <section className="mt-8 tera-card">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="tera-eyebrow">How it works</p>
              <ol className="mt-4 space-y-4 text-sm leading-7 text-tera-secondary">
                <li><span className="text-tera-primary">1.</span> Start with a natural prompt or open a tool.</li>
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
