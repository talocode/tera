import { assertSafePublicUrl } from '@/lib/web-context/url-safety'
import { WebContextError, type WebContextProvider, type WebContextRequest, type WebContextResult } from '@/lib/web-context/types'
import { buildWebContextResult } from '@/lib/web-context/provider-utils'

const DEFAULT_BASE_URL = 'https://api.firecrawl.dev'
const DEFAULT_TIMEOUT_MS = 30_000
const SCRAPE_PATH = '/v2/scrape'

type FirecrawlScrapeResponse = {
  success?: boolean
  markdown?: string
  text?: string
  summary?: string
  url?: string
  metadata?: {
    title?: string
    sourceURL?: string
    ogTitle?: string
  }
  title?: string
  error?: string
  message?: string
  data?: {
    markdown?: string
    text?: string
    summary?: string
    url?: string
    metadata?: {
      title?: string
      sourceURL?: string
      ogTitle?: string
    }
    title?: string
    scrapeId?: string
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/$/, '')
  return trimmed.endsWith('/v2') ? trimmed.slice(0, -3) : trimmed
}

function getApiKey(): string {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim()
  if (!apiKey) {
    throw new WebContextError('FIRECRAWL_API_KEY_MISSING', 'FIRECRAWL_API_KEY_MISSING')
  }
  return apiKey
}

function getBaseUrl(): string {
  return normalizeBaseUrl(process.env.FIRECRAWL_API_BASE_URL?.trim() || DEFAULT_BASE_URL)
}

function deriveTitle(response: FirecrawlScrapeResponse, url: string, content: string): string {
  const title =
    response.metadata?.title?.trim() ||
    response.data?.metadata?.title?.trim() ||
    response.title?.trim() ||
    response.data?.title?.trim() ||
    response.metadata?.ogTitle?.trim()
  if (title) return title

  const headingMatch = content.match(/^#\s+(.+)$/m)
  if (headingMatch?.[1]) return headingMatch[1].trim()

  try {
    return new URL(url).hostname
  } catch {
    return 'Web page'
  }
}

async function requestFirecrawlMarkdown(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<FirecrawlScrapeResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const endpoint = `${getBaseUrl()}${SCRAPE_PATH}`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    })

    const rawBody = await response.text().catch(() => '')
    let payload: FirecrawlScrapeResponse | null = null
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody) as FirecrawlScrapeResponse
      } catch {
        payload = null
      }
    }

    if (!response.ok) {
      const preview = rawBody.slice(0, 300)
      throw new WebContextError(
        'FIRECRAWL_REQUEST_FAILED',
        `FIRECRAWL_REQUEST_FAILED (${response.status}) endpoint=${endpoint} body=${preview || '[empty]'}`
      )
    }

    return payload ?? {}
  } catch (error) {
    if (error instanceof WebContextError) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new WebContextError('FIRECRAWL_TIMEOUT', 'FIRECRAWL_TIMEOUT')
    }
    throw new WebContextError('FIRECRAWL_REQUEST_FAILED', 'FIRECRAWL_REQUEST_FAILED')
  } finally {
    clearTimeout(timeout)
  }
}

export const firecrawlProvider: WebContextProvider = {
  name: 'firecrawl',

  async scrapeMarkdown(request: WebContextRequest): Promise<WebContextResult> {
    let safeUrl: URL

    try {
      safeUrl = assertSafePublicUrl(request.url)
    } catch {
      throw new WebContextError('FIRECRAWL_INVALID_URL', 'FIRECRAWL_INVALID_URL')
    }

    const response = await requestFirecrawlMarkdown(safeUrl.toString())
    const markdown = response.markdown?.trim() || response.data?.markdown?.trim() || response.text?.trim() || response.data?.text?.trim() || ''

    if (!markdown) {
      throw new WebContextError('FIRECRAWL_EMPTY_CONTENT', 'FIRECRAWL_EMPTY_CONTENT')
    }

    const resolvedUrl =
      response.url?.trim() ||
      response.data?.url?.trim() ||
      response.metadata?.sourceURL?.trim() ||
      response.data?.metadata?.sourceURL?.trim() ||
      safeUrl.toString()
    const title = deriveTitle(response, resolvedUrl, markdown)
    const summary = response.summary?.trim() || undefined

    return buildWebContextResult({
      provider: 'firecrawl',
      url: resolvedUrl,
      title,
      content: markdown,
      summary,
      fetchedAt: new Date().toISOString(),
      maxChars: request.maxChars,
      creditsEstimated: 1,
    })
  },
}
