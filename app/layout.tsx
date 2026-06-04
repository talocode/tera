import '@/styles/globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/components/AuthProvider'
import AppLayout from '@/components/AppLayout'
import JsonLd from '@/components/seo/JsonLd'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from '@/components/ThemeProvider'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from '@/lib/seo'

const shouldRenderAnalytics =
  process.env.VERCEL === '1' ||
  process.env.VERCEL === 'true' ||
  Boolean(process.env.VERCEL_URL)

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#06080d',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
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
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/app/icon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [
      { url: '/app/icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd
          data={[organizationSchema(), websiteSchema(), softwareApplicationSchema()]}
        />
      </head>
      <body className="min-h-screen bg-tera-bg font-sans text-tera-primary antialiased">
        <AuthProvider>
          <ThemeProvider>
            <AppLayout>
              {children}
              {shouldRenderAnalytics ? <Analytics /> : null}
            </AppLayout>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
