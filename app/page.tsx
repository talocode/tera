import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
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
      <div className="mx-auto w-full max-w-6xl px-6">

        {/* Hero — pure background, left-aligned */}
        <section className="min-h-[85vh] flex flex-col justify-center py-20">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-tera-secondary mb-6">AI Learning Companion</p>
            <h1 className="text-5xl font-bold tracking-[-0.04em] text-tera-primary sm:text-6xl lg:text-7xl leading-[1.05]">
              Learn anything.<br />
              <span className="text-tera-secondary">Understand it deeply.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-tera-secondary">
              TeraAI helps you break down complex topics, research with real sources,
              and turn knowledge into action — all in one workspace.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/new" className="inline-flex h-12 items-center rounded-full bg-tera-primary px-8 text-sm font-semibold text-white transition hover:opacity-90">
                Start learning free
              </Link>
              <Link href="/pricing" className="inline-flex h-12 items-center rounded-full border border-tera-border px-8 text-sm font-semibold text-tera-primary transition hover:bg-tera-highlight">
                See plans
              </Link>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y border-tera-border py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '50K+', label: 'Active learners' },
              { value: '2M+', label: 'Chat sessions' },
              { value: '10M+', label: 'Prompts processed' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold tracking-[-0.03em] text-tera-primary">{stat.value}</p>
                <p className="mt-2 text-sm text-tera-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features — clean, no cards */}
        <section className="py-24">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-tera-secondary mb-4">Capabilities</p>
            <h2 className="text-4xl font-bold tracking-[-0.03em] text-tera-primary">
              Everything you need to learn smarter
            </h2>
          </div>
          <div className="mt-16 grid gap-16 md:grid-cols-2">
            {[
              {
                title: 'Deep explanations',
                description: 'Break down complex topics into clear, step-by-step explanations you actually understand.',
                visual: (
                  <div className="aspect-video rounded-2xl bg-tera-muted border border-tera-border overflow-hidden flex items-center justify-center">
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-tera-panel border border-tera-border">
                        <svg className="h-6 w-6 text-tera-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4.5 6.75A2.25 2.25 0 016.75 4.5h10.5A2.25 2.25 0 0119.5 6.75v10.5A2.25 2.25 0 0117.25 19.5H6.75A2.25 2.25 0 014.5 17.25V6.75z" /><path d="M8.25 8.25h7.5m-7.5 3h7.5m-7.5 3h4.5" /></svg>
                      </div>
                      <p className="text-sm text-tera-secondary">Step-by-step breakdowns</p>
                    </div>
                  </div>
                ),
              },
              {
                title: 'Web research with citations',
                description: 'Get answers backed by real sources. Deep Research mode goes further on Pro and Plus.',
                visual: (
                  <div className="aspect-video rounded-2xl bg-tera-muted border border-tera-border overflow-hidden flex items-center justify-center">
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-tera-panel border border-tera-border">
                        <svg className="h-6 w-6 text-tera-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4 8.5 9.5 3 12l5.5 2.5L11 20l2.5-5.5L19 12l-5.5-2.5L11 4Z" /><path d="M18.5 4.5 19.5 7l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" /></svg>
                      </div>
                      <p className="text-sm text-tera-secondary">Real sources, real citations</p>
                    </div>
                  </div>
                ),
              },
              {
                title: 'Upload & analyze',
                description: 'Drop in PDFs, images, or documents. Tera reads them and helps you understand the content.',
                visual: (
                  <div className="aspect-video rounded-2xl bg-tera-muted border border-tera-border overflow-hidden flex items-center justify-center">
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-tera-panel border border-tera-border">
                        <svg className="h-6 w-6 text-tera-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                      </div>
                      <p className="text-sm text-tera-secondary">PDFs, images, documents</p>
                    </div>
                  </div>
                ),
              },
              {
                title: 'Quizzes & practice',
                description: 'Test your understanding with auto-generated quizzes and get instant feedback.',
                visual: (
                  <div className="aspect-video rounded-2xl bg-tera-muted border border-tera-border overflow-hidden flex items-center justify-center">
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-tera-panel border border-tera-border">
                        <svg className="h-6 w-6 text-tera-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 18h.01M9.75 9.75a2.25 2.25 0 114.5 0c0 1.5-2.25 1.5-2.25 3.75" /><path d="M4.5 6.75A2.25 2.25 0 016.75 4.5h10.5A2.25 2.25 0 0119.5 6.75v10.5A2.25 2.25 0 0117.25 19.5H6.75A2.25 2.25 0 014.5 17.25V6.75z" /></svg>
                      </div>
                      <p className="text-sm text-tera-secondary">Auto-generated quizzes</p>
                    </div>
                  </div>
                ),
              },
            ].map((feature) => (
              <div key={feature.title}>
                {feature.visual}
                <h3 className="mt-6 text-xl font-semibold text-tera-primary">{feature.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-tera-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="border-t border-tera-border py-24">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-tera-secondary mb-4">Our mission</p>
            <h2 className="text-4xl font-bold tracking-[-0.03em] text-tera-primary leading-tight">
              Make deep learning accessible to everyone
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-tera-secondary">
              We believe understanding complex topics shouldn&apos;t require a tutor on speed dial.
              TeraAI gives you the tools to break down any subject, research with real sources,
              and build lasting knowledge — at your own pace.
            </p>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-tera-secondary mb-4">What people say</p>
            <h2 className="text-4xl font-bold tracking-[-0.03em] text-tera-primary">
              Trusted by learners worldwide
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { quote: 'Tera broke down quantum mechanics in a way my professor never could. I finally get it.', author: 'Physics student' },
              { quote: 'The research mode with citations saved me hours of literature review.', author: 'Graduate researcher' },
              { quote: 'I use Tera every day to understand codebases and learn new frameworks.', author: 'Software engineer' },
            ].map((t) => (
              <div key={t.author} className="border-t border-tera-border pt-6">
                <p className="text-base leading-relaxed text-tera-primary">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 text-sm text-tera-secondary">{t.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <h2 className="text-4xl font-bold tracking-[-0.03em] text-tera-primary">
            Ready to learn something new?
          </h2>
          <p className="mt-4 max-w-lg text-lg text-tera-secondary">
            Join thousands of learners who use TeraAI to understand the world better.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/new" className="inline-flex h-12 items-center rounded-full bg-tera-primary px-8 text-sm font-semibold text-white transition hover:opacity-90">
              Start for free
            </Link>
            <Link href="/pricing" className="inline-flex h-12 items-center rounded-full border border-tera-border px-8 text-sm font-semibold text-tera-primary transition hover:bg-tera-highlight">
              Compare plans
            </Link>
          </div>
        </section>

        <SeoFooter />
      </div>
    </div>
  )
}
