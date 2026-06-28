import { contextDevProvider } from '@/lib/web-context/providers/context-dev'
import { firecrawlProvider } from '@/lib/web-context/providers/firecrawl'
import type { WebContextProvider, WebContextProviderName } from '@/lib/web-context/types'

export type { WebContextProvider, WebContextProviderName, WebContextRequest, WebContextResult, WebContextSource } from '@/lib/web-context/types'
export { WebContextError } from '@/lib/web-context/types'
export { assertSafePublicUrl, isSafePublicUrl } from '@/lib/web-context/url-safety'
export { extractUrlsFromText, promptRequestsUrlReading } from '@/lib/web-context/url-detection'

function normalizeProviderName(value?: string | null): WebContextProviderName | null {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return null
  if (normalized === 'firecrawl') return 'firecrawl'
  if (normalized === 'context-dev' || normalized === 'contextdev' || normalized === 'context_dev') {
    return 'context-dev'
  }
  if (normalized === 'tavily') return 'tavily'
  if (normalized === 'serpapi') return 'serpapi'
  if (normalized === 'browser') return 'browser'
  if (normalized === 'manual') return 'manual'
  return null
}

export function getConfiguredWebContextProviderName(): WebContextProviderName | null {
  return normalizeProviderName(process.env.WEB_CONTEXT_PROVIDER)
}

export function getUrlContextProvider(): WebContextProvider | null {
  const configured = getConfiguredWebContextProviderName()

  if (configured === 'firecrawl') {
    if (!process.env.FIRECRAWL_API_KEY?.trim()) {
      return null
    }
    return firecrawlProvider
  }

  if (configured === 'context-dev') {
    if (!process.env.CONTEXT_DEV_API_KEY?.trim()) {
      return null
    }
    return contextDevProvider
  }

  return null
}

export function getFallbackUrlContextProvider(exclude?: WebContextProviderName | null): WebContextProvider | null {
  if (exclude !== 'firecrawl' && process.env.FIRECRAWL_API_KEY?.trim()) return firecrawlProvider
  if (exclude !== 'context-dev' && process.env.CONTEXT_DEV_API_KEY?.trim()) return contextDevProvider
  return null
}

export function shouldUseContextDevForUrlContext(): boolean {
  const configured = getConfiguredWebContextProviderName()
  if (configured === 'firecrawl') {
    return Boolean(process.env.FIRECRAWL_API_KEY?.trim() || process.env.CONTEXT_DEV_API_KEY?.trim())
  }
  return configured === 'context-dev' && Boolean(process.env.CONTEXT_DEV_API_KEY?.trim())
}
