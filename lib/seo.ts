import type { Metadata } from 'next'

export const SITE_URL = 'https://teraai.chat'
export const SITE_NAME = 'TeraAI'

export const DEFAULT_TITLE =
  'TeraAI — AI Platform for Code, Write, Search, and Build'

export const DEFAULT_DESCRIPTION =
  'Build, code, write, and research with TeraAI, an AI platform powered by Talocode Cloud.'

export const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/tera-logo.jpg`

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}

export const PUBLIC_INDEXABLE_PATHS = [
  '/',
  '/about',
  '/pricing',
  '/privacy',
  '/terms',
  '/help',
] as const

export const ROBOTS_DISALLOW_PATHS = [
  '/api/',
  '/new',
  '/auth/',
  '/history',
  '/notes',
  '/settings',
  '/profile',
  '/images',
  '/skills',
  '/tools',
  '/tools/',
  '/lab/',
  '/plus/',
  '/admin',
  '/deep-research',
] as const

export function buildPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string
  description: string
  path: string
  noIndex?: boolean
}): Metadata {
  const url = absoluteUrl(path)

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          alt: `${SITE_NAME} logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_OG_IMAGE,
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    description: DEFAULT_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free plan with unlimited AI conversations',
    },
  }
}

export function faqPageSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}