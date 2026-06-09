'use client'

import { useState } from 'react'
import Link from 'next/link'

const HELP_SECTIONS = [
  {
    id: 'billing',
    title: 'Billing and payments',
    articles: [
      {
        title: 'How do I upgrade my plan?',
        content: `To upgrade your plan:\n1. Open the Pricing page\n2. Choose Pro or Plus\n3. Review your plan details\n4. Continue to secure checkout powered by Lemon Squeezy\n5. Complete payment\n\nYour new limits and features become available as soon as the subscription is active.`,
      },
      {
        title: 'What payment methods do you accept?',
        content: `We accept major credit cards, PayPal, and other payment methods supported by Lemon Squeezy.\n\nPayments are processed securely through Lemon Squeezy. Tera does not store your payment details on its own servers.`,
      },
      {
        title: 'How do I manage my subscription?',
        content: `You can manage billing from your profile:\n1. Open your Profile page\n2. Find the subscription section\n3. Open the billing portal\n\nFrom there you can review your plan, update payment details, or cancel.`,
      },
      {
        title: 'Do you offer refunds?',
        content: `Yes. Paid plans include a 7-day money-back guarantee.\n\nIf you need help with a refund request, contact Teraaiguide@gmail.com with your account email and purchase details.`,
      },
    ],
  },
  {
    id: 'plans',
    title: 'Plans',
    articles: [
      {
        title: 'What is included in the Free plan?',
        content: `The Free plan includes unlimited AI conversations, 3 file uploads per day, 5 Tavily-backed web research requests per month, and access to the core Tera tools.`,
      },
      {
        title: 'What is the difference between Pro and Plus?',
        content: `Pro increases upload and research limits, adds Deep Research, and unlocks exports. Plus adds the highest usage limits, analytics, and priority support.`,
      },
      {
        title: 'Can I switch plans anytime?',
        content: `Yes. Upgrades take effect immediately. Downgrades usually apply at the next renewal period.`,
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    articles: [
      {
        title: 'My premium features are missing after upgrading',
        content: `Refresh the page, sign out and back in, and give the billing sync a few minutes. If the issue continues, contact support with your account email and a screenshot.`,
      },
      {
        title: 'My payment was declined',
        content: `Re-check your card details, confirm available funds, try another payment method, or contact your bank if international payments are blocked.`,
      },
      {
        title: 'How do I cancel my subscription?',
        content: `Open your profile, launch the billing portal, and cancel from there. Your paid access remains active until the end of the current billing period.`,
      },
    ],
  },
]

export default function HelpPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['billing'])
  const [expandedArticles, setExpandedArticles] = useState<string[]>([])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((current) =>
      current.includes(sectionId) ? current.filter((id) => id !== sectionId) : [...current, sectionId]
    )
  }

  const toggleArticle = (articleId: string) => {
    setExpandedArticles((current) =>
      current.includes(articleId) ? current.filter((id) => id !== articleId) : [...current, articleId]
    )
  }

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-24 md:pt-10">
        <section className="tera-surface overflow-hidden px-6 py-10 md:px-10 md:py-12">
          <p className="tera-eyebrow">Help center</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-5xl">Support for plans, billing, and product questions.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-tera-secondary">
            Browse the most common account and pricing questions, or contact support directly if you need help with a specific issue.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="mailto:Teraaiguide@gmail.com" className="tera-button-primary">Contact support</a>
            <Link href="/pricing" className="tera-button-secondary">Back to pricing</Link>
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {HELP_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => toggleSection(section.id)}
              className="tera-card-subtle text-left transition hover:-translate-y-px hover:bg-tera-highlight"
            >
              <p className="tera-eyebrow">Section</p>
              <h2 className="mt-3 text-xl font-semibold text-tera-primary">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-tera-secondary">{section.articles.length} article{section.articles.length > 1 ? 's' : ''}</p>
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-5">
          {HELP_SECTIONS.map((section) => (
            <div key={section.id} className="tera-surface overflow-hidden px-6 py-5">
              <button type="button" onClick={() => toggleSection(section.id)} className="flex w-full items-center justify-between gap-4 text-left">
                <div>
                  <p className="tera-eyebrow">Category</p>
                  <h2 className="mt-2 text-xl font-semibold text-tera-primary">{section.title}</h2>
                </div>
                <svg className={`h-5 w-5 text-tera-secondary transition ${expandedSections.includes(section.id) ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {expandedSections.includes(section.id) && (
                <div className="mt-5 space-y-4 border-t border-tera-border pt-5">
                  {section.articles.map((article, index) => {
                    const articleId = `${section.id}-${index}`
                    const isExpanded = expandedArticles.includes(articleId)

                    return (
                      <div key={articleId} className="tera-card-subtle px-5 py-4">
                        <button type="button" onClick={() => toggleArticle(articleId)} className="flex w-full items-center justify-between gap-4 text-left">
                          <h3 className="text-base font-medium text-tera-primary">{article.title}</h3>
                          <svg className={`h-4 w-4 shrink-0 text-tera-secondary transition ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </button>
                        {isExpanded && (
                          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-tera-secondary">{article.content}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
