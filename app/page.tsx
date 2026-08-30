import type { Metadata } from 'next'
import Link from 'next/link'
import SeoFooter from '@/components/seo/SeoFooter'
import ReferralCapture from '@/components/ReferralCapture'
import { ProductPreview } from '@/components/ProductPreview'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_URL,
  buildPageMetadata,
} from '@/lib/seo'
import { getHomepageStats } from '@/lib/homepage-stats'

export const metadata: Metadata = buildPageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: '/',
})

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const stats = await getHomepageStats()

  return (
    <div className="tera-page">
      <ReferralCapture />
      <div className="mx-auto w-full max-w-6xl px-6">

        {/* Hero — left-aligned copy with live product preview */}
        <section className="flex min-h-[85vh] flex-col justify-center py-16 lg:py-24">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="max-w-xl">
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
                <Link href="/new" className="tera-button-primary rounded-full px-8 py-3 text-sm">
                  Start learning free
                </Link>
                <Link href="/pricing" className="inline-flex h-12 items-center rounded-full border border-tera-border px-8 text-sm font-semibold text-tera-primary transition hover:bg-tera-highlight">
                  See plans
                </Link>
              </div>
            </div>
            <div className="relative lg:justify-self-end">
              <div aria-hidden className="absolute -inset-8 -z-10 rounded-[32px] bg-gradient-to-br from-tera-highlight via-transparent to-tera-muted" />
              <ProductPreview variant="chat" />
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y border-tera-border py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
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
                visual: <ProductPreview variant="explain" />,
              },
              {
                title: 'Web research with citations',
                description: 'Get answers backed by real sources. Deep Research mode goes further on Pro and Plus.',
                visual: <ProductPreview variant="research" />,
              },
              {
                title: 'Upload & analyze',
                description: 'Drop in PDFs, images, or documents. Tera reads them and helps you understand the content.',
                visual: <ProductPreview variant="upload" />,
              },
              {
                title: 'Quizzes & practice',
                description: 'Test your understanding with auto-generated quizzes and get instant feedback.',
                visual: <ProductPreview variant="quiz" />,
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
            <Link href="/new" className="tera-button-primary rounded-full px-8 py-3 text-sm">
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
