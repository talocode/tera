import type { Metadata } from 'next'
import Link from 'next/link'
import SeoFooter from '@/components/seo/SeoFooter'
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

export default function HomePage() {
  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-16 md:pt-10">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[32px] border border-tera-border bg-tera-panel px-6 py-16 md:px-16 md:py-24">
          <div className="absolute inset-0 -z-10 opacity-40">
            <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-amber-200/20 to-transparent blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-200/15 to-transparent blur-3xl" />
          </div>
          <div className="mx-auto max-w-3xl text-center">
            <p className="tera-eyebrow">AI Learning Companion</p>
            <h1 className="mt-5 text-4xl font-bold tracking-[-0.04em] text-tera-primary sm:text-5xl lg:text-6xl">
              Learn anything.<br />
              <span className="text-tera-secondary">Deeply.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-tera-secondary md:text-lg">
              TeraAI is the AI learning companion that helps you understand difficult topics,
              research with real sources, and turn knowledge into action — all in one workspace.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/new" className="tera-button-primary px-8 py-3 text-base">
                Start learning free
              </Link>
              <Link href="/pricing" className="tera-button-secondary px-8 py-3 text-base">
                See plans
              </Link>
            </div>
            <p className="mt-5 text-xs text-tera-secondary">No credit card required. Free forever.</p>
          </div>
        </section>

        {/* What Tera does */}
        <section className="mt-16 md:mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="tera-eyebrow">Capabilities</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-tera-primary sm:text-4xl">
              Everything you need to learn smarter
            </h2>
            <p className="mt-4 text-base leading-relaxed text-tera-secondary">
              From quick questions to deep research sessions, Tera adapts to how you learn.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 6.75A2.25 2.25 0 016.75 4.5h10.5A2.25 2.25 0 0119.5 6.75v10.5A2.25 2.25 0 0117.25 19.5H6.75A2.25 2.25 0 014.5 17.25V6.75z" />
                    <path d="M8.25 8.25h7.5m-7.5 3h7.5m-7.5 3h4.5" />
                  </svg>
                ),
                title: 'Deep explanations',
                description: 'Break down complex topics into clear, step-by-step explanations you actually understand.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4 8.5 9.5 3 12l5.5 2.5L11 20l2.5-5.5L19 12l-5.5-2.5L11 4Z" />
                    <path d="M18.5 4.5 19.5 7l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
                  </svg>
                ),
                title: 'Web research',
                description: 'Get answers backed by real sources with citations. Deep Research mode goes further on Pro and Plus.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 18h.01M9.75 9.75a2.25 2.25 0 114.5 0c0 1.5-2.25 1.5-2.25 3.75" />
                    <path d="M4.5 6.75A2.25 2.25 0 016.75 4.5h10.5A2.25 2.25 0 0119.5 6.75v10.5A2.25 2.25 0 0117.25 19.5H6.75A2.25 2.25 0 014.5 17.25V6.75z" />
                  </svg>
                ),
                title: 'Quizzes & practice',
                description: 'Test your understanding with auto-generated quizzes and get instant feedback.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ),
                title: 'Upload & analyze',
                description: 'Drop in PDFs, images, or documents. Tera reads them and helps you understand the content.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 4.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V6a1.5 1.5 0 0 1 1.5-1.5Z" />
                    <path d="M14 4.5V9h4" />
                  </svg>
                ),
                title: 'Notes & summaries',
                description: 'Save key insights as notes. Get instant summaries of long articles and research papers.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20V10" />
                    <path d="M18 20V4" />
                    <path d="M6 20v-4" />
                  </svg>
                ),
                title: 'Usage dashboard',
                description: 'Track your credit consumption, uploads, and research usage with a clear visual dashboard.',
              },
            ].map((feature) => (
              <div key={feature.title} className="tera-card group">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-tera-border bg-tera-muted text-tera-secondary transition-colors group-hover:text-tera-primary">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-tera-primary">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-tera-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social proof */}
        <section className="mt-16 md:mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="tera-eyebrow">Trusted by learners</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-tera-primary sm:text-4xl">
              Built for how you actually learn
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { quote: 'Tera broke down quantum mechanics in a way my professor never could. I finally get it.', author: 'Physics student' },
              { quote: 'The research mode with citations saved me hours of文献 review. Game changer for my thesis.', author: 'Graduate researcher' },
              { quote: 'I use Tera every day to understand codebases and learn new frameworks. It\'s like having a senior dev on call.', author: 'Software engineer' },
            ].map((testimonial) => (
              <div key={testimonial.author} className="tera-card-subtle px-6 py-6">
                <p className="text-sm leading-relaxed text-tera-primary italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <p className="mt-4 text-xs uppercase tracking-[0.22em] text-tera-secondary">{testimonial.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-16 md:mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="tera-eyebrow">How it works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-tera-primary sm:text-4xl">
              Three steps to deeper understanding
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: '01', title: 'Ask anything', description: 'Type your question in natural language. Upload a document if you need help with something specific.' },
              { step: '02', title: 'Get deep answers', description: 'Tera breaks down complex topics, finds real sources, and explains things at your level.' },
              { step: '03', title: 'Build on it', description: 'Save notes, create quizzes, export summaries, and turn what you learn into real projects.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-tera-border bg-tera-panel text-2xl font-bold text-tera-primary">
                  {item.step}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-tera-primary">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-tera-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 md:mt-24">
          <div className="relative overflow-hidden rounded-[32px] border border-tera-border bg-tera-panel px-6 py-16 text-center md:px-16 md:py-20">
            <div className="absolute inset-0 -z-10 opacity-30">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-gradient-to-b from-amber-200/20 to-transparent blur-3xl" />
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-tera-primary sm:text-4xl">
              Ready to learn something new?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-tera-secondary">
              Join learners, researchers, and builders who use TeraAI to understand the world better.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/new" className="tera-button-primary px-8 py-3 text-base">
                Start for free
              </Link>
              <Link href="/pricing" className="tera-button-secondary px-8 py-3 text-base">
                Compare plans
              </Link>
            </div>
          </div>
        </section>

        <SeoFooter />
      </div>
    </div>
  )
}
